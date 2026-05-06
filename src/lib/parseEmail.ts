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

const FIELD_PATTERN = 'Source|Name|Phone|Email|Pax|Trip\\s*Date|Trip|Date|Days|Message|GCLID'

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

function travelField(text: string, label: string) {
  const direct = field(text, label)
  if (direct) return direct

  const lines = text.split(/\n/).map(line => line.trim()).filter(Boolean)
  const index = lines.findIndex(line => new RegExp(`^${label}$`, 'i').test(line))
  if (index >= 0) return lines[index + 1] || ''

  const compact = text.replace(/\n/g, ' ')
  const match = compact.match(new RegExp(`${label}\\s+([^]+?)(?=\\s+(?:${FIELD_PATTERN})\\s+|$)`, 'i'))
  return match?.[1]?.trim() || ''
}

function tripDateField(text: string) {
  const direct = travelField(text, 'Trip\\s*Date')
  if (direct) return direct

  const lines = text.split(/\n/).map(line => line.trim()).filter(Boolean)
  const tripIndex = lines.findIndex(line => /^Trip$/i.test(line))
  if (tripIndex >= 0 && /^Date$/i.test(lines[tripIndex + 1] || '')) {
    return lines[tripIndex + 2] || ''
  }

  return text.match(/\b\d{1,2}[-/\s](?:[A-Za-z]{3,}|\d{1,2})[-/\s]\d{2,4}\b/)?.[0] || ''
}

function normalizeDate(raw: string) {
  const clean = raw.trim().replace(/[.,]/g, '')
  if (!clean || /^[-–—]+$/.test(clean)) return ''

  const match = clean.match(/(\d{1,2})[-/\s]([A-Za-z]{3,}|\d{1,2})[-/\s](\d{2,4})/)
  if (!match) return clean

  const months: Record<string, string> = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', sept: '09', oct: '10', nov: '11', dec: '12',
  }
  const numeric: Record<string, string> = {
    '1': '01', '01': '01', '2': '02', '02': '02', '3': '03', '03': '03',
    '4': '04', '04': '04', '5': '05', '05': '05', '6': '06', '06': '06',
    '7': '07', '07': '07', '8': '08', '08': '08', '9': '09', '09': '09',
    '10': '10', '11': '11', '12': '12',
  }

  const day = match[1].padStart(2, '0')
  const month = /^\d+$/.test(match[2])
    ? numeric[match[2]]
    : months[match[2].slice(0, 3).toLowerCase()]
  const year = match[3].length === 2 ? `20${match[3]}` : match[3]

  return month ? `${year}-${month}-${day}` : clean
}

function destinationFromSource(source: string) {
  return (source.split('-')[0] || source).trim()
}

export function parseGmailLead(message: gmail_v1.Schema$Message) {
  const headers = message.payload?.headers || []
  const getHeader = (name: string) =>
    headers.find(header => header.name?.toLowerCase() === name.toLowerCase())?.value || ''

  const text = cleanText(extractBody(message.payload || undefined))
  const source = travelField(text, 'Source')
  const name = travelField(text, 'Name')
  const phone = (
    travelField(text, 'Phone').match(/\+?\d[\d\s-]{7,}\d/)?.[0] ||
    text.match(/\b\d{9,13}\b/)?.[0] ||
    ''
  ).replace(/\s|-/g, '')
  const email =
    travelField(text, 'Email').match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] ||
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
    paxCount: Number(travelField(text, 'Pax').match(/\d+/)?.[0] || 1),
    tripDate: normalizeDate(tripDateField(text)),
    days: Number(travelField(text, 'Days').match(/\d+/)?.[0] || 0),
    message: travelField(text, 'Message').replace(/^[-–—]+$/, ''),
    gclid: travelField(text, 'GCLID'),
    receivedAt,
  }
}
