import type { gmail_v1 } from 'googleapis'

const FIELD_LABELS = [
  'Source',
  'Name',
  'Phone',
  'Email',
  'Pax',
  'Trip Date',
  'Days',
  'Message',
  'GCLID',
]

function decodeBase64Url(data = '') {
  const normalized = data.replace(/-/g, '+').replace(/_/g, '/')
  return Buffer.from(normalized, 'base64').toString('utf8')
}

function htmlToText(html: string) {
  return html
    .replace(/<\/tr>/gi, '\n')
    .replace(/<\/p>|<br\s*\/?>/gi, '\n')
    .replace(/<\/t[dh]>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, '"')
}

function extractBody(payload?: gmail_v1.Schema$MessagePart): string {
  if (!payload) return ''

  if (payload.body?.data) {
    const decoded = decodeBase64Url(payload.body.data)
    return payload.mimeType === 'text/html' ? htmlToText(decoded) : decoded
  }

  const parts = payload.parts || []
  const plain = parts.find(part => part.mimeType === 'text/plain')
  if (plain?.body?.data) return decodeBase64Url(plain.body.data)

  const html = parts.find(part => part.mimeType === 'text/html')
  if (html?.body?.data) return htmlToText(decodeBase64Url(html.body.data))

  return parts.map(part => extractBody(part)).filter(Boolean).join('\n')
}

function cleanText(text: string) {
  return text
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{2,}/g, '\n')
    .trim()
}

function field(text: string, label: string) {
  const nextLabels = FIELD_LABELS.filter(item => item !== label)
    .map(item => item.replace(/\s+/g, '\\s+'))
    .join('|')
  const pattern = new RegExp(
    `${label.replace(/\s+/g, '\\s+')}\\s*:?\\s*([^\\n]+?)(?=\\s*(?:${nextLabels})\\s*:?|\\n|$)`,
    'i'
  )
  return text.match(pattern)?.[1]?.trim() || ''
}

function normalizeDate(raw: string) {
  const clean = raw.trim().replace(/[.,]/g, '')
  if (!clean || /^[-–—]+$/.test(clean)) return ''

  const match = clean.match(/(\d{1,2})[-/\s]([A-Za-z]{3,}|\d{1,2})[-/\s](\d{2,4})/)
  if (!match) return clean

  const months: Record<string, string> = {
    jan: 'Jan', feb: 'Feb', mar: 'Mar', apr: 'Apr', may: 'May', jun: 'Jun',
    jul: 'Jul', aug: 'Aug', sep: 'Sep', sept: 'Sep', oct: 'Oct', nov: 'Nov', dec: 'Dec',
  }
  const numeric: Record<string, string> = {
    '1': 'Jan', '01': 'Jan', '2': 'Feb', '02': 'Feb', '3': 'Mar', '03': 'Mar',
    '4': 'Apr', '04': 'Apr', '5': 'May', '05': 'May', '6': 'Jun', '06': 'Jun',
    '7': 'Jul', '07': 'Jul', '8': 'Aug', '08': 'Aug', '9': 'Sep', '09': 'Sep',
    '10': 'Oct', '11': 'Nov', '12': 'Dec',
  }

  const day = match[1].padStart(2, '0')
  const month = /^\d+$/.test(match[2])
    ? numeric[match[2]]
    : months[match[2].slice(0, 3).toLowerCase()]
  const year = match[3].length === 2 ? `20${match[3]}` : match[3]

  return month ? `${day}-${month}-${year}` : clean
}

function destinationFromSource(source: string) {
  return (source.split('-')[0] || source).trim()
}

export function parseGmailLead(message: gmail_v1.Schema$Message) {
  const headers = message.payload?.headers || []
  const getHeader = (name: string) =>
    headers.find(header => header.name?.toLowerCase() === name.toLowerCase())?.value || ''

  const text = cleanText(extractBody(message.payload || undefined))
  const source = field(text, 'Source')
  const name = field(text, 'Name')
  const phone = (
    field(text, 'Phone').match(/\+?\d[\d\s-]{7,}\d/)?.[0] ||
    text.match(/\b\d{9,13}\b/)?.[0] ||
    ''
  ).replace(/\s|-/g, '')
  const email =
    field(text, 'Email').match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] ||
    text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] ||
    ''

  const subject = getHeader('Subject')
  const receivedAt = Number(message.internalDate)
    ? new Date(Number(message.internalDate)).toISOString()
    : new Date(getHeader('Date') || Date.now()).toISOString()

  return {
    id: message.id || `gmail-${Date.now()}`,
    gmailMessageId: message.id || '',
    name,
    phone,
    email,
    source: 'Ads-Email',
    landingPage: destinationFromSource(source) || subject.replace(/new travel enquiry/i, '').trim(),
    paxCount: Number(field(text, 'Pax').match(/\d+/)?.[0] || 1),
    tripDate: normalizeDate(field(text, 'Trip Date')),
    days: Number(field(text, 'Days').match(/\d+/)?.[0] || 0),
    message: field(text, 'Message').replace(/^[-–—]+$/, ''),
    gclid: field(text, 'GCLID'),
    receivedAt,
  }
}
