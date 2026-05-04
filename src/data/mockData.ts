export type LeadStatus =
  | 'New' |'Contacted' |'Interested' |'Proposal Sent' |'Negotiating' |'Booked' |'Lost';

export type LeadSource = 'Google Ads' | 'WhatsApp' | 'Phone Call' | 'Email' | 'Referral';

export type FollowUpType = 'Call' | 'WhatsApp' | 'Email' | 'Meeting' | 'Video Call';

export type FollowUpOutcome =
  | 'Reached' |'No Answer' |'Callback Requested' |'Sent Info' |'Meeting Scheduled' |'Not Interested' |'Converted';

export interface Agent {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'owner' | 'agent';
  isOnLeave: boolean;
}

export interface FollowUpLog {
  id: string;
  date: string;
  type: FollowUpType;
  notes: string;
  outcome: FollowUpOutcome;
  agentId: string;
  duration?: string;
}

export interface Reminder {
  id: string;
  leadId: string;
  dueDate: string;
  dueTime: string;
  note: string;
  isCompleted: boolean;
  createdAt: string;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  source: LeadSource;
  adCampaign?: string;
  status: LeadStatus;
  assignedAgentId: string;
  destination: string;
  packageType: string;
  travelDates: string;
  paxCount: number;
  budget: number;
  specialRequests?: string;
  createdAt: string;
  lastContactDate: string;
  nextFollowUp: string;
  followUpLog: FollowUpLog[];
  reminders: Reminder[];
  daysInPipeline: number;
  isOverdue: boolean;
  notes?: string;
}

export const AGENTS: Agent[] = [
  {
    id: 'agent-001',
    name: 'Priya Mehta',
    email: 'priya@sunrisetravels.com',
    avatar: 'PM',
    role: 'owner',
    isOnLeave: false,
  },
  {
    id: 'agent-002',
    name: 'Rohan Kapoor',
    email: 'rohan@sunrisetravels.com',
    avatar: 'RK',
    role: 'agent',
    isOnLeave: false,
  },
  {
    id: 'agent-003',
    name: 'Sneha Rao',
    email: 'sneha@sunrisetravels.com',
    avatar: 'SR',
    role: 'agent',
    isOnLeave: true,
  },
];

export const LEADS: Lead[] = [
  {
    id: 'lead-001',
    name: 'Arjun Sharma',
    phone: '+91 98201 34567',
    email: 'arjun.sharma@gmail.com',
    source: 'Google Ads',
    adCampaign: 'Maldives Summer 2026',
    status: 'Interested',
    assignedAgentId: 'agent-002',
    destination: 'Maldives',
    packageType: 'Honeymoon',
    travelDates: 'Jun 10 – Jun 17, 2026',
    paxCount: 2,
    budget: 4800,
    specialRequests: 'Water villa preferred, anniversary setup',
    createdAt: '2026-04-10T09:15:00Z',
    lastContactDate: '2026-04-22T14:30:00Z',
    nextFollowUp: '2026-04-26T10:00:00Z',
    daysInPipeline: 15,
    isOverdue: false,
    notes: 'Very interested, comparing with another agency. Decision by end of April.',
    followUpLog: [
      {
        id: 'log-001a',
        date: '2026-04-22T14:30:00Z',
        type: 'WhatsApp',
        notes: 'Sent Maldives package PDF. He reviewed it and asked about water villa availability.',
        outcome: 'Sent Info',
        agentId: 'agent-002',
        duration: '12 min',
      },
      {
        id: 'log-001b',
        date: '2026-04-18T11:00:00Z',
        type: 'Call',
        notes: 'First contact. Confirmed travel dates and budget range. Very responsive.',
        outcome: 'Reached',
        agentId: 'agent-002',
        duration: '18 min',
      },
      {
        id: 'log-001c',
        date: '2026-04-10T09:15:00Z',
        type: 'Email',
        notes: 'Lead captured from Google Ads. Auto-reply sent with brochure.',
        outcome: 'Sent Info',
        agentId: 'agent-002',
      },
    ],
    reminders: [
      {
        id: 'rem-001a',
        leadId: 'lead-001',
        dueDate: '2026-04-26',
        dueTime: '10:00',
        note: 'Follow up on Maldives quote — he said he will decide by end of April',
        isCompleted: false,
        createdAt: '2026-04-22T14:35:00Z',
      },
    ],
  },
  {
    id: 'lead-002',
    name: 'Kavitha Nair',
    phone: '+91 99870 56234',
    email: 'kavitha.nair@outlook.com',
    source: 'WhatsApp',
    status: 'Proposal Sent',
    assignedAgentId: 'agent-002',
    destination: 'Switzerland',
    packageType: 'Family Tour',
    travelDates: 'Jul 5 – Jul 14, 2026',
    paxCount: 4,
    budget: 9200,
    specialRequests: 'Two kids aged 8 and 11, need child-friendly hotels',
    createdAt: '2026-04-05T08:00:00Z',
    lastContactDate: '2026-04-20T16:00:00Z',
    nextFollowUp: '2026-04-24T09:00:00Z',
    daysInPipeline: 20,
    isOverdue: true,
    notes: 'Proposal sent via WhatsApp. Awaiting response. 4 PAX family trip.',
    followUpLog: [
      {
        id: 'log-002a',
        date: '2026-04-20T16:00:00Z',
        type: 'WhatsApp',
        notes: 'Sent detailed Switzerland itinerary with hotel options. Read receipts show delivered.',
        outcome: 'Sent Info',
        agentId: 'agent-002',
      },
      {
        id: 'log-002b',
        date: '2026-04-14T10:30:00Z',
        type: 'Call',
        notes: 'Discussed Switzerland vs Austria. She preferred Switzerland. Budget confirmed at $9,200.',
        outcome: 'Reached',
        agentId: 'agent-002',
        duration: '25 min',
      },
    ],
    reminders: [
      {
        id: 'rem-002a',
        leadId: 'lead-002',
        dueDate: '2026-04-24',
        dueTime: '09:00',
        note: 'Follow up on Switzerland proposal — overdue by 1 day',
        isCompleted: false,
        createdAt: '2026-04-20T16:05:00Z',
      },
    ],
  },
  {
    id: 'lead-003',
    name: 'Deepak Verma',
    phone: '+91 97654 12890',
    email: 'deepak.v@yahoo.com',
    source: 'Google Ads',
    adCampaign: 'Europe Summer 2026',
    status: 'Negotiating',
    assignedAgentId: 'agent-003',
    destination: 'Paris + Rome',
    packageType: 'Couple Tour',
    travelDates: 'Aug 1 – Aug 12, 2026',
    paxCount: 2,
    budget: 6500,
    specialRequests: 'Business class flights, 5-star hotels only',
    createdAt: '2026-04-08T11:00:00Z',
    lastContactDate: '2026-04-23T15:00:00Z',
    nextFollowUp: '2026-04-25T14:00:00Z',
    daysInPipeline: 17,
    isOverdue: false,
    notes: 'High-value lead. Negotiating on flight upgrade. Close to booking.',
    followUpLog: [
      {
        id: 'log-003a',
        date: '2026-04-23T15:00:00Z',
        type: 'Call',
        notes: 'Negotiating business class upgrade. He wants it included at same price.',
        outcome: 'Callback Requested',
        agentId: 'agent-003',
        duration: '30 min',
      },
      {
        id: 'log-003b',
        date: '2026-04-16T10:00:00Z',
        type: 'Video Call',
        notes: 'Presented full Europe itinerary. Very positive. Requested business class upgrade.',
        outcome: 'Meeting Scheduled',
        agentId: 'agent-003',
        duration: '45 min',
      },
    ],
    reminders: [
      {
        id: 'rem-003a',
        leadId: 'lead-003',
        dueDate: '2026-04-25',
        dueTime: '14:00',
        note: 'Call back on Europe package — business class upgrade decision',
        isCompleted: false,
        createdAt: '2026-04-23T15:05:00Z',
      },
    ],
  },
  {
    id: 'lead-004',
    name: 'Meena Pillai',
    phone: '+91 94562 78901',
    email: 'meena.pillai@gmail.com',
    source: 'Phone Call',
    status: 'Contacted',
    assignedAgentId: 'agent-002',
    destination: 'Bali',
    packageType: 'Group Tour',
    travelDates: 'Sep 15 – Sep 22, 2026',
    paxCount: 8,
    budget: 14400,
    specialRequests: 'Group coordinator, needs group discount',
    createdAt: '2026-04-20T13:00:00Z',
    lastContactDate: '2026-04-21T11:00:00Z',
    nextFollowUp: '2026-04-28T11:00:00Z',
    daysInPipeline: 5,
    isOverdue: false,
    notes: 'Corporate group trip. 8 colleagues. Needs group pricing.',
    followUpLog: [
      {
        id: 'log-004a',
        date: '2026-04-21T11:00:00Z',
        type: 'Call',
        notes: 'Initial discovery call. Group of 8 colleagues. Needs group pricing for Bali.',
        outcome: 'Reached',
        agentId: 'agent-002',
        duration: '20 min',
      },
    ],
    reminders: [
      {
        id: 'rem-004a',
        leadId: 'lead-004',
        dueDate: '2026-04-28',
        dueTime: '11:00',
        note: 'Send Bali group package with group discount pricing',
        isCompleted: false,
        createdAt: '2026-04-21T11:05:00Z',
      },
    ],
  },
  {
    id: 'lead-005',
    name: 'Rahul Desai',
    phone: '+91 90123 45678',
    email: 'rahul.desai@hotmail.com',
    source: 'Google Ads',
    adCampaign: 'Maldives Summer 2026',
    status: 'Booked',
    assignedAgentId: 'agent-002',
    destination: 'Maldives',
    packageType: 'Honeymoon',
    travelDates: 'May 20 – May 27, 2026',
    paxCount: 2,
    budget: 5200,
    createdAt: '2026-03-28T10:00:00Z',
    lastContactDate: '2026-04-18T12:00:00Z',
    nextFollowUp: '',
    daysInPipeline: 28,
    isOverdue: false,
    notes: 'Booked! Full payment received. Visa processing started.',
    followUpLog: [
      {
        id: 'log-005a',
        date: '2026-04-18T12:00:00Z',
        type: 'Call',
        notes: 'Booking confirmed. Payment received. Visa documents sent.',
        outcome: 'Converted',
        agentId: 'agent-002',
        duration: '10 min',
      },
    ],
    reminders: [],
  },
  {
    id: 'lead-006',
    name: 'Sunita Joshi',
    phone: '+91 88234 56789',
    email: 'sunita.joshi@gmail.com',
    source: 'Email',
    status: 'New',
    assignedAgentId: 'agent-003',
    destination: 'Thailand',
    packageType: 'Solo Adventure',
    travelDates: 'Oct 1 – Oct 10, 2026',
    paxCount: 1,
    budget: 2100,
    createdAt: '2026-04-24T08:30:00Z',
    lastContactDate: '',
    nextFollowUp: '2026-04-25T09:00:00Z',
    daysInPipeline: 1,
    isOverdue: false,
    notes: 'New email inquiry. Not yet contacted.',
    followUpLog: [],
    reminders: [
      {
        id: 'rem-006a',
        leadId: 'lead-006',
        dueDate: '2026-04-25',
        dueTime: '09:00',
        note: 'First contact — email inquiry for Thailand solo trip',
        isCompleted: false,
        createdAt: '2026-04-24T08:35:00Z',
      },
    ],
  },
  {
    id: 'lead-007',
    name: 'Vikram Singh',
    phone: '+91 91234 67890',
    email: 'vikram.singh@gmail.com',
    source: 'WhatsApp',
    status: 'Lost',
    assignedAgentId: 'agent-003',
    destination: 'Dubai',
    packageType: 'Family Tour',
    travelDates: 'Apr 15 – Apr 20, 2026',
    paxCount: 3,
    budget: 3800,
    createdAt: '2026-04-01T09:00:00Z',
    lastContactDate: '2026-04-14T10:00:00Z',
    nextFollowUp: '',
    daysInPipeline: 14,
    isOverdue: false,
    notes: 'Went with competitor. Price sensitive.',
    followUpLog: [
      {
        id: 'log-007a',
        date: '2026-04-14T10:00:00Z',
        type: 'Call',
        notes: 'Said he found a cheaper package elsewhere. Could not match the price.',
        outcome: 'Not Interested',
        agentId: 'agent-003',
        duration: '8 min',
      },
    ],
    reminders: [],
  },
  {
    id: 'lead-008',
    name: 'Ananya Krishnan',
    phone: '+91 93456 78901',
    email: 'ananya.k@gmail.com',
    source: 'Google Ads',
    adCampaign: 'Europe Summer 2026',
    status: 'Interested',
    assignedAgentId: 'agent-002',
    destination: 'Greece',
    packageType: 'Honeymoon',
    travelDates: 'Jul 20 – Jul 30, 2026',
    paxCount: 2,
    budget: 7500,
    specialRequests: 'Santorini cave hotel, sunset dinner',
    createdAt: '2026-04-15T10:00:00Z',
    lastContactDate: '2026-04-23T11:00:00Z',
    nextFollowUp: '2026-04-27T10:00:00Z',
    daysInPipeline: 10,
    isOverdue: false,
    notes: 'Very enthusiastic. Wants Santorini specifically.',
    followUpLog: [
      {
        id: 'log-008a',
        date: '2026-04-23T11:00:00Z',
        type: 'WhatsApp',
        notes: 'Shared Greece honeymoon packages. She loved the Santorini cave hotel option.',
        outcome: 'Sent Info',
        agentId: 'agent-002',
      },
    ],
    reminders: [
      {
        id: 'rem-008a',
        leadId: 'lead-008',
        dueDate: '2026-04-27',
        dueTime: '10:00',
        note: 'Follow up on Greece honeymoon — confirm Santorini dates',
        isCompleted: false,
        createdAt: '2026-04-23T11:05:00Z',
      },
    ],
  },
  {
    id: 'lead-009',
    name: 'Rajesh Iyer',
    phone: '+91 87654 32109',
    email: 'rajesh.iyer@company.com',
    source: 'Phone Call',
    status: 'Contacted',
    assignedAgentId: 'agent-003',
    destination: 'Singapore + Malaysia',
    packageType: 'Family Tour',
    travelDates: 'Dec 20 – Dec 30, 2026',
    paxCount: 5,
    budget: 11000,
    specialRequests: 'Christmas travel, kids activities',
    createdAt: '2026-04-22T14:00:00Z',
    lastContactDate: '2026-04-22T14:00:00Z',
    nextFollowUp: '2026-04-29T10:00:00Z',
    daysInPipeline: 3,
    isOverdue: false,
    notes: 'Christmas family trip. Flexible on dates.',
    followUpLog: [
      {
        id: 'log-009a',
        date: '2026-04-22T14:00:00Z',
        type: 'Call',
        notes: 'Inbound call. Christmas family trip for 5. Needs Singapore + Malaysia combo.',
        outcome: 'Reached',
        agentId: 'agent-003',
        duration: '15 min',
      },
    ],
    reminders: [],
  },
  {
    id: 'lead-010',
    name: 'Pooja Agarwal',
    phone: '+91 96543 21098',
    email: 'pooja.agarwal@gmail.com',
    source: 'Google Ads',
    adCampaign: 'Maldives Summer 2026',
    status: 'Proposal Sent',
    assignedAgentId: 'agent-002',
    destination: 'Maldives',
    packageType: 'Honeymoon',
    travelDates: 'Aug 15 – Aug 22, 2026',
    paxCount: 2,
    budget: 5500,
    createdAt: '2026-04-12T09:00:00Z',
    lastContactDate: '2026-04-21T10:00:00Z',
    nextFollowUp: '2026-04-25T11:00:00Z',
    daysInPipeline: 13,
    isOverdue: false,
    notes: 'Proposal sent. Comparing Maldives vs Bali.',
    followUpLog: [
      {
        id: 'log-010a',
        date: '2026-04-21T10:00:00Z',
        type: 'Email',
        notes: 'Sent detailed Maldives proposal. She is comparing with Bali.',
        outcome: 'Sent Info',
        agentId: 'agent-002',
      },
    ],
    reminders: [],
  },
];

export const PIPELINE_DATA = [
  { stage: 'New', count: 1, value: 2100 },
  { stage: 'Contacted', count: 2, value: 15400 },
  { stage: 'Interested', count: 2, value: 12300 },
  { stage: 'Proposal Sent', count: 2, value: 14700 },
  { stage: 'Negotiating', count: 1, value: 6500 },
  { stage: 'Booked', count: 1, value: 5200 },
  { stage: 'Lost', count: 1, value: 3800 },
];

export const SOURCE_DATA = [
  { name: 'Google Ads', value: 5, fill: '#0F6FEC' },
  { name: 'WhatsApp', value: 2, fill: '#25D366' },
  { name: 'Phone Call', value: 2, fill: '#F97316' },
  { name: 'Email', value: 1, fill: '#8B5CF6' },
];

export const WEEKLY_LEADS_DATA = [
  { week: 'Mar 24', leads: 3, booked: 0 },
  { week: 'Mar 31', leads: 4, booked: 1 },
  { week: 'Apr 7', leads: 5, booked: 0 },
  { week: 'Apr 14', leads: 6, booked: 1 },
  { week: 'Apr 21', leads: 4, booked: 1 },
];

export const AGENT_PERFORMANCE = [
  {
    agentId: 'agent-002',
    name: 'Rohan Kapoor',
    avatar: 'RK',
    totalLeads: 6,
    active: 4,
    booked: 1,
    lost: 0,
    conversionRate: 16.7,
    overdueFollowUps: 1,
    avgResponseHrs: 2.4,
  },
  {
    agentId: 'agent-003',
    name: 'Sneha Rao',
    avatar: 'SR',
    totalLeads: 4,
    active: 2,
    booked: 0,
    lost: 1,
    conversionRate: 0,
    overdueFollowUps: 0,
    avgResponseHrs: 4.1,
    isOnLeave: true,
  },
];

export const STATUS_COLORS: Record<LeadStatus, { bg: string; text: string; dot: string }> = {
  New: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  Contacted: { bg: 'bg-slate-100', text: 'text-slate-700', dot: 'bg-slate-500' },
  Interested: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  'Proposal Sent': { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500' },
  Negotiating: { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500' },
  Booked: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  Lost: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-400' },
};

export const SOURCE_COLORS: Record<string, { bg: string; text: string }> = {
  'Google Ads': { bg: 'bg-blue-50', text: 'text-blue-700' },
  WhatsApp: { bg: 'bg-green-50', text: 'text-green-700' },
  'Phone Call': { bg: 'bg-orange-50', text: 'text-orange-700' },
  Email: { bg: 'bg-purple-50', text: 'text-purple-700' },
  Referral: { bg: 'bg-teal-50', text: 'text-teal-700' },
};