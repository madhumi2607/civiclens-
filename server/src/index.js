import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'

// ── City name normalization ───────────────────────────────────────────────────
const CITY_NORM = {
  'Tiruchirappalli':    'Trichy',
  'Tiruchirapalli':     'Trichy',
  'Bengaluru':          'Bangalore',
  'Kochi':              'Cochin',
  'Puducherry':         'Pondicherry',
  'Thiruvananthapuram': 'Trivandrum',
}
function normalizeCity(city) {
  if (!city) return city
  return CITY_NORM[city] ?? city
}

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DIST = path.join(__dirname, '../../client/dist')

const app = express()
const PORT = process.env.PORT ?? 3001
const IS_PROD = process.env.NODE_ENV === 'production' || process.env.DEMO_MODE === 'true'

app.use(cors({
  origin: IS_PROD ? false : (process.env.CLIENT_ORIGIN ?? 'http://localhost:5173'),
  credentials: true,
}))
app.use(express.json({ limit: '10mb' }))

if (IS_PROD) {
  app.use(express.static(DIST))
}

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'civiclens-server', ts: new Date().toISOString() })
})

// ── Demo Users ────────────────────────────────────────────────────────────────
const USERS = [
  {
    id: 'U-001', name: 'Priya Krishnamurthy', phone: '9876540001',
    area: 'T. Nagar', trustScore: 90,
    tier: 'trusted', badge: 'Trusted Reporter',
    verifiedCount: 10, resolvedCount: 8, rejectedCount: 0,
    reportIds: ['CL-1000','CL-1001','CL-1002','CL-1003','CL-1004','CL-1005','CL-1006','CL-1007','CL-1008','CL-1009','CL-1010','CL-1011'],
    createdAt: new Date(Date.now() - 90 * 86400000).toISOString(),
  },
  {
    id: 'U-002', name: 'Karthik Sundaram', phone: '9876540002',
    area: 'Adyar', trustScore: 75,
    tier: 'standard', badge: 'Active Citizen',
    verifiedCount: 5, resolvedCount: 4, rejectedCount: 0,
    reportIds: ['CL-1012','CL-1013','CL-1014','CL-1015','CL-1016','CL-1017','CL-1018','CL-1019'],
    createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
  },
  {
    id: 'U-003', name: 'Rajan Murugan', phone: '9876540003',
    area: 'Adyar', trustScore: 55,
    tier: 'standard', badge: 'Active Citizen',
    verifiedCount: 2, resolvedCount: 2, rejectedCount: 0,
    reportIds: ['CL-1020','CL-1021','CL-1022','CL-1023','CL-1024'],
    createdAt: new Date(Date.now() - 45 * 86400000).toISOString(),
  },
  {
    id: 'U-004', name: 'Deepa Narayanan', phone: '9876540004',
    area: 'T. Nagar', trustScore: 35,
    tier: 'review', badge: 'New Member',
    verifiedCount: 1, resolvedCount: 0, rejectedCount: 1,
    reportIds: ['CL-1025','CL-1026','CL-1027'],
    createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
  {
    id: 'U-005', name: 'Suresh Babu', phone: '9876540005',
    area: 'Adyar', trustScore: 15,
    tier: 'restricted', badge: 'Restricted',
    verifiedCount: 0, resolvedCount: 0, rejectedCount: 4,
    reportIds: ['CL-1028','CL-1029','CL-1030','CL-1031','CL-1032','CL-1033'],
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
]

// OTP sessions: phone → { otp, userId?, createdAt }
const OTP_SESSIONS = {}

function getTier(score) {
  if (score > 80)  return { tier: 'trusted',    badge: 'Trusted Reporter' }
  if (score >= 50) return { tier: 'standard',   badge: 'Active Citizen' }
  if (score >= 30) return { tier: 'review',     badge: 'New Member' }
  return                   { tier: 'restricted', badge: 'Restricted' }
}

// ── Mock classify responses ───────────────────────────────────────────────────
const MOCK_RESPONSES = {
  Pothole: [
    { severity: 3, confidence: 91, description: 'Medium-sized pothole detected on road surface, approximately 30–40 cm in diameter. Risk of vehicle damage and motorcycle hazard. Immediate cold-mix patching recommended before next rainfall.' },
    { severity: 4, confidence: 88, description: 'Deep pothole with jagged edges near road edge, estimated depth 15 cm. High risk for two-wheelers during night hours. Priority repair required within 48 hours.' },
    { severity: 2, confidence: 94, description: 'Minor surface depression with early-stage pothole formation. Low severity currently but will worsen in monsoon. Preventive patching recommended at next maintenance cycle.' },
  ],
  'Broken Streetlight': [
    { severity: 2, confidence: 89, description: 'Street light unit non-functional — likely bulb or driver failure. Area has reduced night illumination raising pedestrian safety concerns near the footpath.' },
    { severity: 3, confidence: 85, description: 'Multiple streetlight failures detected in the immediate vicinity. Significant visibility reduction on this stretch. Particularly concerning near the school zone. Urgent replacement required.' },
  ],
  'Clogged Drain': [
    { severity: 3, confidence: 87, description: 'Storm drain visibly obstructed with debris, plastic waste, and sediment. Outflow capacity severely reduced. Risk of road flooding during moderate rainfall. Desilting and clearance required.' },
    { severity: 4, confidence: 92, description: 'Major drain blockage with stagnant water pooling observed. Active mosquito breeding risk. Immediate clearance essential to prevent waterlogging and disease vector proliferation.' },
  ],
  'Open Manhole': [
    { severity: 5, confidence: 96, description: 'CRITICAL: Uncovered manhole on active road. Immediate hazard to all road users, especially cyclists and pedestrians. Emergency barricading and cover replacement required. Contact helpline: 1913.' },
    { severity: 5, confidence: 94, description: 'CRITICAL: Manhole cover displaced or missing entirely. High risk of serious injury or fatality. Cordon off immediately and reinstate cover. This is a P1 civic emergency.' },
  ],
  'Solid Waste': [
    { severity: 2, confidence: 90, description: 'Illegal roadside waste dumping detected — mixed household and commercial garbage. Risk of rodent activity and disease vectors. Clearance and community signage recommended.' },
    { severity: 3, confidence: 86, description: 'Large accumulation of uncollected municipal solid waste, evidence of several days of buildup. Odour and hygiene concern for surrounding residents. Urgent collection and road-cleaning required.' },
  ],
  'Road Flooding': [
    { severity: 4, confidence: 88, description: 'Significant water accumulation reducing road to single-lane passage. Likely caused by drain blockage or low-lying geometry. Immediate drainage intervention and traffic management required.' },
    { severity: 3, confidence: 91, description: 'Moderate inundation detected, water depth estimated 10–15 cm. Passable for larger vehicles but hazardous for two-wheelers. Drain inspection and clearance recommended.' },
    { severity: 5, confidence: 93, description: 'SEVERE: Road fully inundated, impassable. Underlying infrastructure damage possible. Emergency response required immediately. Activate diversion routes and alert ward office.' },
  ],
}

// ── Auth endpoints ────────────────────────────────────────────────────────────

// POST /api/auth/request-otp  { phone }
app.post('/api/auth/request-otp', (req, res) => {
  const { phone } = req.body
  if (!phone) return res.status(400).json({ error: 'phone required' })
  OTP_SESSIONS[phone] = { otp: '123456', createdAt: Date.now() }
  res.json({ ok: true, message: 'OTP sent (demo: use 123456)' })
})

// POST /api/auth/register  { phone, name, area }
app.post('/api/auth/register', (req, res) => {
  const { phone, name, area } = req.body
  if (!phone || !name) return res.status(400).json({ error: 'phone and name required' })
  if (USERS.find((u) => u.phone === phone)) {
    return res.status(409).json({ error: 'Phone already registered. Please log in.' })
  }
  OTP_SESSIONS[phone] = { otp: '123456', pendingUser: { phone, name, area: area ?? '' }, createdAt: Date.now() }
  res.json({ ok: true, message: 'OTP sent (demo: use 123456)' })
})

// POST /api/auth/verify-otp  { phone, otp }
app.post('/api/auth/verify-otp', (req, res) => {
  const { phone, otp } = req.body
  if (!phone || !otp) return res.status(400).json({ error: 'phone and otp required' })
  const session = OTP_SESSIONS[phone]
  if (!session) return res.status(400).json({ error: 'No OTP requested for this number' })
  if (session.otp !== otp) return res.status(400).json({ error: 'Invalid OTP' })

  delete OTP_SESSIONS[phone]

  // Check if this is a new registration
  if (session.pendingUser) {
    const { name, area } = session.pendingUser
    const newUser = {
      id: `U-${Date.now()}`,
      name, phone, area: area ?? '',
      trustScore: 50, tier: 'standard', badge: 'New Member',
      verifiedCount: 0, resolvedCount: 0, rejectedCount: 0,
      reportIds: [],
      createdAt: new Date().toISOString(),
    }
    USERS.push(newUser)
    return res.json({ ok: true, user: sanitizeUser(newUser) })
  }

  // Existing user login
  const user = USERS.find((u) => u.phone === phone)
  if (!user) return res.status(404).json({ error: 'User not found. Please register first.' })
  res.json({ ok: true, user: sanitizeUser(user) })
})

function sanitizeUser(u) {
  return {
    id: u.id, name: u.name, phone: u.phone, area: u.area,
    trustScore: u.trustScore, tier: u.tier, badge: u.badge,
    verifiedCount: u.verifiedCount, resolvedCount: u.resolvedCount, rejectedCount: u.rejectedCount,
    reportIds: u.reportIds, createdAt: u.createdAt,
  }
}

// GET /api/users
app.get('/api/users', (_req, res) => {
  res.json({ users: USERS.map(sanitizeUser) })
})

// GET /api/users/:id
app.get('/api/users/:id', (req, res) => {
  const user = USERS.find((u) => u.id === req.params.id)
  if (!user) return res.status(404).json({ error: 'User not found' })
  res.json({ user: sanitizeUser(user) })
})

// ── POST /api/classify ────────────────────────────────────────────────────────
app.post('/api/classify', async (req, res) => {
  const { issueType } = req.body
  if (!issueType) return res.status(400).json({ error: '`issueType` is required' })
  const options = MOCK_RESPONSES[issueType]
  if (!options) return res.status(422).json({ error: `Unknown issue type: ${issueType}` })
  await new Promise((resolve) => setTimeout(resolve, 1500))
  const pick = options[Math.floor(Math.random() * options.length)]
  res.json({ issueType, severity: pick.severity, confidence: pick.confidence, description: pick.description })
})

// ── Demo report data ──────────────────────────────────────────────────────────
function daysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

const DEMO_REPORTS = [
  { id: 'CL-1000', type: 'pothole',     severity: 4, lat: 13.0418, lng: 80.2341, ward: 'T. Nagar', street: 'Usman Road',          status: 'in_progress', reportedAt: daysAgo(2)  },
  { id: 'CL-1001', type: 'pothole',     severity: 5, lat: 13.0422, lng: 80.2347, ward: 'T. Nagar', street: 'Usman Road',          status: 'reported',    reportedAt: daysAgo(1)  },
  { id: 'CL-1002', type: 'pothole',     severity: 3, lat: 13.0415, lng: 80.2336, ward: 'T. Nagar', street: 'North Usman Road',    status: 'verified',    reportedAt: daysAgo(5)  },
  { id: 'CL-1003', type: 'pothole',     severity: 4, lat: 13.0420, lng: 80.2350, ward: 'T. Nagar', street: 'Venkatnarayana Rd',   status: 'assigned',    reportedAt: daysAgo(3)  },
  { id: 'CL-1004', type: 'drain',       severity: 4, lat: 13.0012, lng: 80.2565, ward: 'Adyar',    street: 'LB Road',             status: 'reported',    reportedAt: daysAgo(1)  },
  { id: 'CL-1005', type: 'drain',       severity: 3, lat: 13.0008, lng: 80.2570, ward: 'Adyar',    street: 'LB Road',             status: 'reported',    reportedAt: daysAgo(2)  },
  { id: 'CL-1006', type: 'drain',       severity: 5, lat: 13.0015, lng: 80.2560, ward: 'Adyar',    street: 'Lattice Bridge Rd',   status: 'verified',    reportedAt: daysAgo(4)  },
  { id: 'CL-1007', type: 'drain',       severity: 4, lat: 13.0010, lng: 80.2575, ward: 'Adyar',    street: 'Lattice Bridge Rd',   status: 'assigned',    reportedAt: daysAgo(3)  },
  { id: 'CL-1008', type: 'manhole',     severity: 5, lat: 13.0430, lng: 80.2290, ward: 'T. Nagar', street: 'Pondy Bazaar',        status: 'reported',    reportedAt: daysAgo(0)  },
  { id: 'CL-1009', type: 'waste',       severity: 2, lat: 13.0460, lng: 80.2380, ward: 'T. Nagar', street: 'GN Chetty Road',      status: 'resolved',    reportedAt: daysAgo(20) },
  { id: 'CL-1010', type: 'streetlight', severity: 2, lat: 13.0450, lng: 80.2310, ward: 'T. Nagar', street: 'Sir Thyagaraya Rd',   status: 'reported',    reportedAt: daysAgo(6)  },
  { id: 'CL-1011', type: 'streetlight', severity: 3, lat: 13.0455, lng: 80.2315, ward: 'T. Nagar', street: 'Sir Thyagaraya Rd',   status: 'verified',    reportedAt: daysAgo(7)  },
  { id: 'CL-1012', type: 'streetlight', severity: 2, lat: 13.0445, lng: 80.2306, ward: 'T. Nagar', street: 'Habibullah Road',     status: 'reported',    reportedAt: daysAgo(5)  },
  { id: 'CL-1013', type: 'streetlight', severity: 3, lat: 13.0458, lng: 80.2320, ward: 'T. Nagar', street: 'Habibullah Road',     status: 'assigned',    reportedAt: daysAgo(8)  },
  { id: 'CL-1014', type: 'pothole',     severity: 3, lat: 13.0050, lng: 80.2520, ward: 'Adyar',    street: 'Kasturba Nagar',      status: 'in_progress', reportedAt: daysAgo(10) },
  { id: 'CL-1015', type: 'flood',       severity: 4, lat: 12.9985, lng: 80.2600, ward: 'Adyar',    street: 'Canal Bank Road',     status: 'reported',    reportedAt: daysAgo(1)  },
  { id: 'CL-1016', type: 'manhole',     severity: 5, lat: 13.0025, lng: 80.2540, ward: 'Adyar',    street: 'Adyar Bridge Rd',     status: 'verified',    reportedAt: daysAgo(3)  },
  { id: 'CL-1017', type: 'waste',       severity: 2, lat: 13.0040, lng: 80.2610, ward: 'Adyar',    street: 'Besant Nagar 1st St', status: 'resolved',    reportedAt: daysAgo(15) },
  { id: 'CL-1018', type: 'pothole',     severity: 2, lat: 13.0060, lng: 80.2490, ward: 'Adyar',    street: 'Gandhi Nagar',        status: 'resolved',    reportedAt: daysAgo(25) },
  { id: 'CL-1019', type: 'drain',       severity: 3, lat: 12.9970, lng: 80.2580, ward: 'Adyar',    street: 'Indira Nagar',        status: 'assigned',    reportedAt: daysAgo(9)  },
  { id: 'CL-1020', type: 'pothole',     severity: 1, lat: 13.0390, lng: 80.2300, ward: 'T. Nagar', street: 'Kodambakkam High Rd', status: 'resolved',    reportedAt: daysAgo(28) },
  { id: 'CL-1021', type: 'flood',       severity: 3, lat: 13.0480, lng: 80.2400, ward: 'T. Nagar', street: 'Rangarajapuram',      status: 'reported',    reportedAt: daysAgo(2)  },
  { id: 'CL-1022', type: 'waste',       severity: 3, lat: 13.0500, lng: 80.2350, ward: 'T. Nagar', street: 'Burkit Road',         status: 'in_progress', reportedAt: daysAgo(4)  },
  { id: 'CL-1023', type: 'manhole',     severity: 4, lat: 13.0410, lng: 80.2280, ward: 'T. Nagar', street: 'Nungambakkam HR',     status: 'reported',    reportedAt: daysAgo(1)  },
  { id: 'CL-1024', type: 'streetlight', severity: 1, lat: 13.0370, lng: 80.2360, ward: 'T. Nagar', street: 'Mowbrays Road',       status: 'resolved',    reportedAt: daysAgo(22) },
  { id: 'CL-1025', type: 'waste',       severity: 3, lat: 13.0030, lng: 80.2590, ward: 'Adyar',    street: 'Thiruvanmiyur Main',  status: 'reported',    reportedAt: daysAgo(3)  },
  { id: 'CL-1026', type: 'waste',       severity: 4, lat: 13.0035, lng: 80.2595, ward: 'Adyar',    street: 'Thiruvanmiyur Main',  status: 'verified',    reportedAt: daysAgo(5)  },
  { id: 'CL-1027', type: 'waste',       severity: 3, lat: 13.0026, lng: 80.2585, ward: 'Adyar',    street: 'ECR Junction',        status: 'reported',    reportedAt: daysAgo(2)  },
  { id: 'CL-1028', type: 'waste',       severity: 2, lat: 13.0032, lng: 80.2600, ward: 'Adyar',    street: 'ECR Junction',        status: 'assigned',    reportedAt: daysAgo(7)  },
  { id: 'CL-1029', type: 'drain',       severity: 2, lat: 13.0075, lng: 80.2455, ward: 'Adyar',    street: 'Kotturpuram Bridge',  status: 'resolved',    reportedAt: daysAgo(18) },
  { id: 'CL-1030', type: 'pothole',     severity: 3, lat: 13.0395, lng: 80.2410, ward: 'T. Nagar', street: 'Cenotaph Road',       status: 'in_progress', reportedAt: daysAgo(6)  },
  { id: 'CL-1031', type: 'flood',       severity: 5, lat: 12.9960, lng: 80.2555, ward: 'Adyar',    street: 'Santhome HR',         status: 'reported',    reportedAt: daysAgo(1)  },
  { id: 'CL-1032', type: 'manhole',     severity: 3, lat: 13.0440, lng: 80.2260, ward: 'T. Nagar', street: 'TTK Road',            status: 'verified',    reportedAt: daysAgo(4)  },
  { id: 'CL-1033', type: 'streetlight', severity: 2, lat: 13.0385, lng: 80.2330, ward: 'T. Nagar', street: 'Eldams Road',         status: 'resolved',    reportedAt: daysAgo(12) },
  { id: 'CL-1034', type: 'pothole',     severity: 4, lat: 13.0020, lng: 80.2630, ward: 'Adyar',    street: 'Besant Nagar Beach',  status: 'assigned',    reportedAt: daysAgo(2)  },
  { id: 'CL-1035', type: 'waste',       severity: 1, lat: 13.0465, lng: 80.2270, ward: 'T. Nagar', street: 'Nagaswamy Road',      status: 'resolved',    reportedAt: daysAgo(29) },
  { id: 'CL-1036', type: 'drain',       severity: 4, lat: 13.0088, lng: 80.2510, ward: 'Adyar',    street: 'MRC Nagar',           status: 'in_progress', reportedAt: daysAgo(3)  },
  { id: 'CL-1037', type: 'flood',       severity: 3, lat: 13.0445, lng: 80.2430, ward: 'T. Nagar', street: 'Mahalingapuram',      status: 'verified',    reportedAt: daysAgo(7)  },
  { id: 'CL-1038', type: 'pothole',     severity: 2, lat: 12.9990, lng: 80.2640, ward: 'Adyar',    street: 'Foreshore Estate',    status: 'resolved',    reportedAt: daysAgo(24) },
  { id: 'CL-1039', type: 'manhole',     severity: 5, lat: 13.0405, lng: 80.2320, ward: 'T. Nagar', street: 'South Usman Road',    status: 'reported',    reportedAt: daysAgo(0)  },
  { id: 'CL-1040', type: 'streetlight', severity: 3, lat: 13.0095, lng: 80.2480, ward: 'Adyar',    street: 'Raja Annamalai Rd',   status: 'assigned',    reportedAt: daysAgo(5)  },
  { id: 'CL-1041', type: 'pothole',     severity: 4, lat: 13.0510, lng: 80.2290, ward: 'T. Nagar', street: 'Valluvar Kottam HR',  status: 'in_progress', reportedAt: daysAgo(8)  },
  { id: 'CL-1042', type: 'drain',       severity: 3, lat: 12.9975, lng: 80.2510, ward: 'Adyar',    street: 'Kasturba Nagar 2nd',  status: 'reported',    reportedAt: daysAgo(2)  },
  { id: 'CL-1043', type: 'waste',       severity: 2, lat: 13.0360, lng: 80.2390, ward: 'T. Nagar', street: 'Poes Garden',         status: 'resolved',    reportedAt: daysAgo(16) },
  { id: 'CL-1044', type: 'flood',       severity: 4, lat: 13.0070, lng: 80.2640, ward: 'Adyar',    street: 'Karpagam Avenue',     status: 'verified',    reportedAt: daysAgo(1)  },
  { id: 'CL-1045', type: 'manhole',     severity: 4, lat: 13.0520, lng: 80.2410, ward: 'T. Nagar', street: 'Khader Nawaz Khan Rd',status: 'reported',    reportedAt: daysAgo(0)  },
  { id: 'CL-1046', type: 'streetlight', severity: 1, lat: 13.0015, lng: 80.2650, ward: 'Adyar',    street: 'Greenways Road',      status: 'resolved',    reportedAt: daysAgo(27) },
  { id: 'CL-1047', type: 'pothole',     severity: 3, lat: 13.0355, lng: 80.2270, ward: 'T. Nagar', street: 'Chamiers Road',       status: 'in_progress', reportedAt: daysAgo(9)  },
  { id: 'CL-1048', type: 'drain',       severity: 2, lat: 13.0055, lng: 80.2530, ward: 'Adyar',    street: 'Shastri Nagar',       status: 'resolved',    reportedAt: daysAgo(21) },
  { id: 'CL-1049', type: 'waste',       severity: 3, lat: 13.0490, lng: 80.2360, ward: 'T. Nagar', street: 'Nandanam Main Rd',    status: 'assigned',    reportedAt: daysAgo(4)  },
]

// Build a map of reportId → user for quick lookup
const REPORT_USER_MAP = {}
USERS.forEach((u) => u.reportIds.forEach((rid) => { REPORT_USER_MAP[rid] = u }))

// Suresh's 4 rejected reports
const SURESH_REJECTED = new Set(['CL-1028', 'CL-1030', 'CL-1032', 'CL-1033'])

function enrichReport(r) {
  const user = REPORT_USER_MAP[r.id]
  const isRejected = SURESH_REJECTED.has(r.id)
  return {
    city: 'Chennai', area: r.ward, confirmedBy: 1,
    isCustom: false, customTitle: null, customDescription: null, beforePhoto: null,
    isLiveCapture: true,
    captureGps: { lat: r.lat, lng: r.lng },
    capturedAt: r.reportedAt,
    reportedBy: user?.id ?? null,
    reporterName: user?.name ?? null,
    reporterTrust: user?.trustScore ?? null,
    verificationFlag: null,
    verificationStatus: isRejected ? 'rejected' : (user?.trustScore > 80 ? 'auto_verified' : 'pending'),
    rejectionReason: isRejected ? 'Location mismatch detected' : null,
    ...r,
  }
}

let REPORTS = DEMO_REPORTS.map(enrichReport)

REPORTS = REPORTS.concat([
  // Trichy pothole cluster
  { id: 'CL-2000', type: 'pothole', severity: 4, lat: 10.7903, lng: 78.7044, ward: 'Thillai Nagar', area: 'Thillai Nagar', city: 'Trichy',  street: 'Bharathidasan Rd',  status: 'reported',  reportedAt: daysAgo(2), confirmedBy: 2, isCustom: false, customTitle: null, customDescription: null, beforePhoto: null, isLiveCapture: true, captureGps: {lat:10.7903,lng:78.7044}, capturedAt: daysAgo(2), reportedBy: null, reporterName: null, reporterTrust: null, verificationFlag: null, verificationStatus: 'pending', rejectionReason: null },
  { id: 'CL-2001', type: 'pothole', severity: 3, lat: 10.7908, lng: 78.7049, ward: 'Thillai Nagar', area: 'Thillai Nagar', city: 'Trichy',  street: 'Bharathidasan Rd',  status: 'reported',  reportedAt: daysAgo(3), confirmedBy: 1, isCustom: false, customTitle: null, customDescription: null, beforePhoto: null, isLiveCapture: true, captureGps: {lat:10.7908,lng:78.7049}, capturedAt: daysAgo(3), reportedBy: null, reporterName: null, reporterTrust: null, verificationFlag: null, verificationStatus: 'pending', rejectionReason: null },
  { id: 'CL-2002', type: 'pothole', severity: 5, lat: 10.7900, lng: 78.7041, ward: 'Thillai Nagar', area: 'Thillai Nagar', city: 'Trichy',  street: 'Karur Bypass Rd',   status: 'verified',  reportedAt: daysAgo(1), confirmedBy: 1, isCustom: false, customTitle: null, customDescription: null, beforePhoto: null, isLiveCapture: true, captureGps: {lat:10.7900,lng:78.7041}, capturedAt: daysAgo(1), reportedBy: null, reporterName: null, reporterTrust: null, verificationFlag: null, verificationStatus: 'pending', rejectionReason: null },
  { id: 'CL-2003', type: 'pothole', severity: 4, lat: 10.7907, lng: 78.7047, ward: 'Thillai Nagar', area: 'Thillai Nagar', city: 'Trichy',  street: 'Karur Bypass Rd',   status: 'reported',  reportedAt: daysAgo(4), confirmedBy: 1, isCustom: false, customTitle: null, customDescription: null, beforePhoto: null, isLiveCapture: true, captureGps: {lat:10.7907,lng:78.7047}, capturedAt: daysAgo(4), reportedBy: null, reporterName: null, reporterTrust: null, verificationFlag: null, verificationStatus: 'pending', rejectionReason: null },
  { id: 'CL-2004', type: 'drain',   severity: 3, lat: 10.7920, lng: 78.7060, ward: 'Srirangam',     area: 'Srirangam',     city: 'Trichy',  street: 'Srirangam Main',    status: 'reported',  reportedAt: daysAgo(5), confirmedBy: 1, isCustom: false, customTitle: null, customDescription: null, beforePhoto: null, isLiveCapture: true, captureGps: {lat:10.7920,lng:78.7060}, capturedAt: daysAgo(5), reportedBy: null, reporterName: null, reporterTrust: null, verificationFlag: null, verificationStatus: 'pending', rejectionReason: null },
  { id: 'CL-2005', type: 'waste',   severity: 2, lat: 10.7885, lng: 78.7030, ward: 'Woraiyur',      area: 'Woraiyur',      city: 'Trichy',  street: 'Woraiyur High Rd',  status: 'reported',  reportedAt: daysAgo(6), confirmedBy: 1, isCustom: false, customTitle: null, customDescription: null, beforePhoto: null, isLiveCapture: true, captureGps: {lat:10.7885,lng:78.7030}, capturedAt: daysAgo(6), reportedBy: null, reporterName: null, reporterTrust: null, verificationFlag: null, verificationStatus: 'pending', rejectionReason: null },
  { id: 'CL-2006', type: 'streetlight', severity: 3, lat: 10.7895, lng: 78.7055, ward: 'Ariyamangalam', area: 'Ariyamangalam', city: 'Trichy', street: 'Ariyamangalam Rd', status: 'reported', reportedAt: daysAgo(3), confirmedBy: 1, isCustom: false, customTitle: null, customDescription: null, beforePhoto: null, isLiveCapture: true, captureGps: {lat:10.7895,lng:78.7055}, capturedAt: daysAgo(3), reportedBy: null, reporterName: null, reporterTrust: null, verificationFlag: null, verificationStatus: 'pending', rejectionReason: null },
  // Madurai drain cluster
  { id: 'CL-3000', type: 'drain', severity: 4, lat: 9.9250, lng: 78.1195, ward: 'Anna Nagar', area: 'Anna Nagar', city: 'Madurai', street: 'Anna Nagar Main',    status: 'reported', reportedAt: daysAgo(1), confirmedBy: 2, isCustom: false, customTitle: null, customDescription: null, beforePhoto: null, isLiveCapture: true, captureGps: {lat:9.9250,lng:78.1195}, capturedAt: daysAgo(1), reportedBy: null, reporterName: null, reporterTrust: null, verificationFlag: null, verificationStatus: 'pending', rejectionReason: null },
  { id: 'CL-3001', type: 'drain', severity: 3, lat: 9.9253, lng: 78.1199, ward: 'Anna Nagar', area: 'Anna Nagar', city: 'Madurai', street: 'Anna Nagar Main',    status: 'reported', reportedAt: daysAgo(2), confirmedBy: 1, isCustom: false, customTitle: null, customDescription: null, beforePhoto: null, isLiveCapture: true, captureGps: {lat:9.9253,lng:78.1199}, capturedAt: daysAgo(2), reportedBy: null, reporterName: null, reporterTrust: null, verificationFlag: null, verificationStatus: 'pending', rejectionReason: null },
  { id: 'CL-3002', type: 'drain', severity: 5, lat: 9.9247, lng: 78.1192, ward: 'Anna Nagar', area: 'Anna Nagar', city: 'Madurai', street: 'KK Nagar Ring Rd',   status: 'verified', reportedAt: daysAgo(3), confirmedBy: 1, isCustom: false, customTitle: null, customDescription: null, beforePhoto: null, isLiveCapture: true, captureGps: {lat:9.9247,lng:78.1192}, capturedAt: daysAgo(3), reportedBy: null, reporterName: null, reporterTrust: null, verificationFlag: null, verificationStatus: 'pending', rejectionReason: null },
  { id: 'CL-3003', type: 'pothole', severity: 3, lat: 9.9260, lng: 78.1210, ward: 'KK Nagar',  area: 'KK Nagar',  city: 'Madurai', street: 'KK Nagar Main',      status: 'reported', reportedAt: daysAgo(4), confirmedBy: 1, isCustom: false, customTitle: null, customDescription: null, beforePhoto: null, isLiveCapture: true, captureGps: {lat:9.9260,lng:78.1210}, capturedAt: daysAgo(4), reportedBy: null, reporterName: null, reporterTrust: null, verificationFlag: null, verificationStatus: 'pending', rejectionReason: null },
  { id: 'CL-3004', type: 'waste',   severity: 2, lat: 9.9240, lng: 78.1185, ward: 'Teppakulam', area: 'Teppakulam', city: 'Madurai', street: 'Teppakulam St',      status: 'reported', reportedAt: daysAgo(5), confirmedBy: 1, isCustom: false, customTitle: null, customDescription: null, beforePhoto: null, isLiveCapture: true, captureGps: {lat:9.9240,lng:78.1185}, capturedAt: daysAgo(5), reportedBy: null, reporterName: null, reporterTrust: null, verificationFlag: null, verificationStatus: 'pending', rejectionReason: null },
  // Custom reports
  { id: 'CL-M-0012', type: 'other', isCustom: true, customTitle: 'Broken Park Bench',  customDescription: 'Wooden bench completely broken, sharp edges exposed — hazard for children.',          severity: 2, lat: 13.0460, lng: 80.2380, ward: 'T. Nagar', area: 'T. Nagar', city: 'Chennai', street: 'Valluvar Kottam Park',   status: 'reported', reportedAt: daysAgo(3), confirmedBy: 1, beforePhoto: null, isLiveCapture: true, captureGps: {lat:13.0460,lng:80.2380}, capturedAt: daysAgo(3), reportedBy: null, reporterName: null, reporterTrust: null, verificationFlag: null, verificationStatus: 'pending', rejectionReason: null },
  { id: 'CL-M-0013', type: 'other', isCustom: true, customTitle: 'Fallen Tree Branch', customDescription: "Large branch blocking half the footpath after last night's storm. Pedestrians walking on road.", severity: 3, lat: 13.0022, lng: 80.2600, ward: 'Adyar',    area: 'Adyar',    city: 'Chennai', street: 'Besant Nagar 3rd Ave',  status: 'verified', reportedAt: daysAgo(1), confirmedBy: 1, beforePhoto: null, isLiveCapture: true, captureGps: {lat:13.0022,lng:80.2600}, capturedAt: daysAgo(1), reportedBy: null, reporterName: null, reporterTrust: null, verificationFlag: null, verificationStatus: 'pending', rejectionReason: null },
  { id: 'CL-M-0014', type: 'other', isCustom: true, customTitle: 'Stray Dog Menace',   customDescription: 'Pack of ~8 stray dogs near the school gate, aggressive during morning hours. Animal welfare team needed.', severity: 4, lat: 13.0430, lng: 80.2320, ward: 'T. Nagar', area: 'T. Nagar', city: 'Chennai', street: 'Gopathy Narayanaswamy Rd', status: 'reported', reportedAt: daysAgo(0), confirmedBy: 1, beforePhoto: null, isLiveCapture: true, captureGps: {lat:13.0430,lng:80.2320}, capturedAt: daysAgo(0), reportedBy: null, reporterName: null, reporterTrust: null, verificationFlag: null, verificationStatus: 'pending', rejectionReason: null },
])

const PHOTOS = {}

// ── Haversine distance ────────────────────────────────────────────────────────
function haversineMetres(a, b) {
  const R = 6371000
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const sinLat = Math.sin(dLat / 2)
  const sinLng = Math.sin(dLng / 2)
  const c = sinLat * sinLat +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * sinLng * sinLng
  return R * 2 * Math.atan2(Math.sqrt(c), Math.sqrt(1 - c))
}

// ── DBSCAN ────────────────────────────────────────────────────────────────────
function runDbscan(points, eps = 500, minPoints = 3) {
  const UNVISITED = -1, NOISE = -2
  const labels = new Array(points.length).fill(UNVISITED)
  let clusterId = 0

  for (let i = 0; i < points.length; i++) {
    if (labels[i] !== UNVISITED) continue
    const neighbours = points.reduce((acc, _, j) => {
      if (haversineMetres(points[i], points[j]) <= eps) acc.push(j)
      return acc
    }, [])
    if (neighbours.length < minPoints) { labels[i] = NOISE; continue }
    labels[i] = clusterId
    const seed = [...neighbours]
    for (let si = 0; si < seed.length; si++) {
      const q = seed[si]
      if (labels[q] === NOISE) labels[q] = clusterId
      if (labels[q] !== UNVISITED) continue
      labels[q] = clusterId
      const qN = points.reduce((acc, _, j) => {
        if (haversineMetres(points[q], points[j]) <= eps) acc.push(j)
        return acc
      }, [])
      if (qN.length >= minPoints) qN.forEach((n) => { if (!seed.includes(n)) seed.push(n) })
    }
    clusterId++
  }

  const clusters = []
  for (let c = 0; c < clusterId; c++) {
    const members = points.filter((_, i) => labels[i] === c)
    if (!members.length) continue
    const centLat = members.reduce((s, p) => s + p.lat, 0) / members.length
    const centLng = members.reduce((s, p) => s + p.lng, 0) / members.length
    const typeCounts = {}
    members.forEach((p) => { typeCounts[p.type] = (typeCounts[p.type] ?? 0) + 1 })
    const dominantType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0][0]
    const avgSeverity = members.reduce((s, p) => s + p.severity, 0) / members.length
    const now = Date.now()
    const recencyBonus = Math.min(20,
      members.reduce((s, p) => s + Math.max(0, 20 - (now - new Date(p.reportedAt)) / 86400000 * 2), 0) / members.length
    )
    const priorityScore = Math.round(avgSeverity * 20 + members.length * 10 + recencyBonus)
    const maxTypeCount = Math.max(...Object.values(typeCounts))
    clusters.push({ id: `CLUSTER-${c + 1}`, members, centLat, centLng, count: members.length,
      dominantType, avgSeverity: Math.round(avgSeverity * 10) / 10, priorityScore,
      isRootCause: maxTypeCount >= 3 })
  }
  return clusters.sort((a, b) => b.priorityScore - a.priorityScore)
}

// ── Dashboard API routes ───────────────────────────────────────────────────────
app.get('/api/reports', (req, res) => {
  const { ward, type } = req.query
  let data = REPORTS
  if (ward) data = data.filter((r) => r.ward === ward)
  if (type) data = data.filter((r) => r.type === type)
  res.json({ data })
})

app.post('/api/reports', (req, res) => {
  const { beforePhotoData, ...reportFields } = req.body ?? {}
  if (!reportFields.id) return res.status(400).json({ error: '`id` is required' })
  if (REPORTS.find((r) => r.id === reportFields.id)) {
    return res.status(409).json({ error: 'Duplicate ID' })
  }

  // Trust tier check
  const userId = reportFields.reportedBy ?? null
  let verificationStatus = 'pending'
  let reportStatus = reportFields.status ?? 'reported'

  if (userId) {
    const user = USERS.find((u) => u.id === userId)
    if (user) {
      if (user.trustScore < 30) {
        return res.status(403).json({ error: 'Account restricted due to multiple rejected reports. You cannot submit new reports.' })
      }
      if (user.trustScore > 80) {
        verificationStatus = 'auto_verified'
        // auto-verified reporters still go through normal status flow
      } else if (user.trustScore < 50) {
        verificationStatus = 'under_review'
        reportStatus = 'under_review'
      }
    }
  }

  // Location mismatch flag
  if (reportFields.verificationFlag === 'location_mismatch') {
    verificationStatus = 'flagged'
  }

  const record = {
    city: 'Chennai', area: reportFields.ward ?? null, confirmedBy: 1,
    isCustom: !!reportFields.isCustom, customTitle: reportFields.customTitle ?? null,
    customDescription: reportFields.customDescription ?? null, beforePhoto: null,
    isLiveCapture: true,
    captureGps: reportFields.captureGps ?? null,
    capturedAt: reportFields.capturedAt ?? null,
    reportedBy: userId,
    reporterName: reportFields.reporterName ?? null,
    reporterTrust: reportFields.reporterTrust ?? null,
    verificationFlag: reportFields.verificationFlag ?? null,
    verificationStatus,
    rejectionReason: null,
    ...reportFields,
    city: normalizeCity(reportFields.city ?? 'Chennai'),
    status: reportStatus,
    reportedAt: reportFields.reportedAt ?? new Date().toISOString(),
  }

  if (beforePhotoData) {
    const base64 = beforePhotoData.replace(/^data:[^;]+;base64,/, '')
    PHOTOS[record.id] = Buffer.from(base64, 'base64')
    record.beforePhoto = { url: `/api/photos/${record.id}`, timestamp: record.reportedAt }
  }

  REPORTS.push(record)

  // Link report to user
  if (userId) {
    const user = USERS.find((u) => u.id === userId)
    if (user && !user.reportIds.includes(record.id)) {
      user.reportIds.push(record.id)
    }
  }

  res.status(201).json({ ok: true, id: record.id, verificationStatus })
})

app.get('/api/photos/:reportId', (req, res) => {
  const buf = PHOTOS[req.params.reportId]
  if (!buf) return res.status(404).json({ error: 'Photo not found' })
  res.set('Content-Type', 'image/jpeg').send(buf)
})

app.patch('/api/reports/:id/confirm', (req, res) => {
  const report = REPORTS.find((r) => r.id === req.params.id)
  if (!report) return res.status(404).json({ error: 'Report not found' })
  report.confirmedBy = (report.confirmedBy ?? 1) + 1
  res.json({ ok: true, confirmedBy: report.confirmedBy })
})

// Officer: verify a flagged/pending report
app.patch('/api/reports/:id/verify', (req, res) => {
  const report = REPORTS.find((r) => r.id === req.params.id)
  if (!report) return res.status(404).json({ error: 'Report not found' })

  const prevStatus = report.verificationStatus
  report.verificationStatus = 'verified'
  if (report.status === 'under_review') report.status = 'reported'

  // Trust adjustment: +5 for verified report
  if (report.reportedBy) {
    const user = USERS.find((u) => u.id === report.reportedBy)
    if (user) {
      user.trustScore = Math.min(100, user.trustScore + 5)
      user.verifiedCount += 1
      const { tier, badge } = getTier(user.trustScore)
      user.tier = tier
      user.badge = badge
    }
  }

  res.json({ ok: true, verificationStatus: 'verified', prevStatus })
})

// Officer: reject a flagged/pending report
app.patch('/api/reports/:id/reject', (req, res) => {
  const { reason } = req.body ?? {}
  const report = REPORTS.find((r) => r.id === req.params.id)
  if (!report) return res.status(404).json({ error: 'Report not found' })

  report.verificationStatus = 'rejected'
  report.rejectionReason = reason ?? 'Rejected by officer'
  report.status = 'rejected'

  // Trust adjustment
  if (report.reportedBy) {
    const user = USERS.find((u) => u.id === report.reportedBy)
    if (user) {
      user.rejectedCount += 1
      const penalty = user.rejectedCount > 1 ? 25 : 15
      user.trustScore = Math.max(0, user.trustScore - penalty)
      user.rejectedCount = (user.rejectedCount ?? 0) + 0
      const { tier, badge } = getTier(user.trustScore)
      user.tier = tier
      user.badge = badge
    }
  }

  res.json({ ok: true, verificationStatus: 'rejected', reason: report.rejectionReason })
})

// Officer: approve under_review report (move to normal flow)
app.patch('/api/reports/:id/approve', (req, res) => {
  const report = REPORTS.find((r) => r.id === req.params.id)
  if (!report) return res.status(404).json({ error: 'Report not found' })
  report.verificationStatus = 'verified'
  report.status = 'reported'
  res.json({ ok: true })
})

app.post('/api/cluster', (req, res) => {
  const { ward, type } = req.body ?? {}
  // Exclude rejected and under_review from clustering
  let data = REPORTS.filter((r) => r.status !== 'resolved' && r.status !== 'rejected' && r.status !== 'under_review')
  if (ward) data = data.filter((r) => r.ward === ward)
  if (type) data = data.filter((r) => r.type === type)
  res.json({ clusters: runDbscan(data) })
})

app.get('/api/action-briefs', (_req, res) => {
  const active = REPORTS.filter((r) => r.status !== 'resolved' && r.status !== 'rejected' && r.status !== 'under_review')
  const clusters = runDbscan(active)
  res.json({ briefs: clusters })
})

app.post('/api/root-cause', (req, res) => {
  const { clusterId } = req.body ?? {}
  const active = REPORTS.filter((r) => r.status !== 'resolved' && r.status !== 'rejected' && r.status !== 'under_review')
  const clusters = runDbscan(active)
  const cluster = clusters.find((c) => c.id === clusterId)
  if (!cluster) return res.status(404).json({ error: 'Cluster not found' })

  const ninety = new Date(Date.now() - 90 * 86400000)
  const recurring = REPORTS.filter((r) =>
    r.type === cluster.dominantType &&
    new Date(r.reportedAt) >= ninety &&
    haversineMetres(r, { lat: cluster.centLat, lng: cluster.centLng }) <= 750
  )
  const isRecurring = recurring.length >= 3

  const hypotheses = {
    pothole:     'Repeated surface failures suggest substandard base-course material or high axle-load traffic.',
    drain:       'Persistent blockages indicate inadequate drain capacity or upstream solid waste disposal.',
    streetlight: 'Multiple failures in the same zone point to a faulty feeder cable or overloaded circuit.',
    manhole:     'Recurring open manholes may indicate theft of covers or inadequate locking hardware.',
    waste:       'Concentrated dumping suggests absence of a designated collection point in this micro-zone.',
    flood:       'Repeated inundation indicates a structural drainage bottleneck or low-lying road geometry.',
  }
  const actions = {
    pothole:     'Schedule full-depth reclamation; conduct axle-load survey on this stretch.',
    drain:       'Desilting and CCTV inspection of the drain network within 200m radius.',
    streetlight: 'Inspect and replace feeder cable; audit load distribution across the circuit.',
    manhole:     'Install anti-theft locking covers; increase night patrol frequency.',
    waste:       'Deploy a community bin within 100m; engage local ward councillor for awareness.',
    flood:       'Commission topographic survey; widen or re-grade drain outfalls.',
  }

  res.json({
    isRecurring, recurringCount: recurring.length,
    hypothesis: hypotheses[cluster.dominantType] ?? 'Requires field investigation.',
    recommendedAction: actions[cluster.dominantType] ?? 'Escalate to ward engineer.',
  })
})

app.get('/api/infrastructure', (_req, res) => res.json({ data: [] }))

// ── GET /api/reports/:trackingId ──────────────────────────────────────────────
app.get('/api/reports/:trackingId', (req, res) => {
  const { trackingId } = req.params

  const live = REPORTS.find((r) => r.id === trackingId)
  if (live) {
    // Rejected report
    if (live.status === 'rejected' || live.verificationStatus === 'rejected') {
      return res.json({
        trackingId,
        isCustom: !!live.isCustom,
        currentStep: 1,
        rejected: true,
        rejectionReason: live.rejectionReason ?? 'Report rejected — location mismatch detected',
        statuses: [],
      })
    }

    const isCustom = !!live.isCustom
    const isUnderReview = live.status === 'under_review'
    const STATUSES = isUnderReview
      ? [
          { step: 1, label: 'Submitted',    detail: 'Your report has been submitted and is awaiting officer review.' },
          { step: 2, label: 'Under Review',  detail: 'An officer is reviewing your report before it enters the queue.' },
          { step: 3, label: 'Verified',      detail: 'Your report has been approved and is now active.' },
          { step: 4, label: 'In Progress',   detail: 'The team is working on the issue.' },
          { step: 5, label: 'Resolved',      detail: 'Issue has been resolved. Thank you for reporting!' },
        ]
      : isCustom
      ? [
          { step: 1, label: 'Reported',              detail: 'Your custom report has been received and logged.' },
          { step: 2, label: 'Under Review',           detail: 'A field officer is reviewing your report.' },
          { step: 3, label: 'Categorized / Assigned', detail: 'Issue has been categorized and assigned to the appropriate team.' },
          { step: 4, label: 'In Progress',            detail: 'The team is working on the issue.' },
          { step: 5, label: 'Resolved',               detail: 'Issue has been resolved. Thank you for reporting!' },
        ]
      : [
          { step: 1, label: 'Reported',    detail: 'Your report has been received and logged.' },
          { step: 2, label: 'Verified',    detail: 'A field officer has verified the issue on-site.' },
          { step: 3, label: 'Assigned',    detail: 'Assigned to the Roads & Infrastructure ward team.' },
          { step: 4, label: 'In Progress', detail: 'Repair crew is on-site. Work is underway.' },
          { step: 5, label: 'Resolved',    detail: 'Issue has been resolved. Thank you for reporting!' },
        ]

    const statusStepMap = { reported: 1, under_review: 2, verified: 2, assigned: 3, in_progress: 4, resolved: 5 }
    const currentStep = statusStepMap[live.status] ?? 1
    return res.json({
      trackingId, isCustom, currentStep, rejected: false,
      verificationStatus: live.verificationStatus,
      verificationFlag: live.verificationFlag,
      reporterName: live.reporterName,
      reporterTrust: live.reporterTrust,
      statuses: STATUSES.map((s) => ({ ...s, done: s.step <= currentStep })),
    })
  }

  const customMatch = trackingId.match(/^CL-M-(\d{4})$/)
  if (customMatch) {
    const lastDigit = parseInt(customMatch[1], 10) % 10
    let currentStep
    if (lastDigit <= 2)      currentStep = 1
    else if (lastDigit <= 4) currentStep = 2
    else if (lastDigit <= 6) currentStep = 3
    else if (lastDigit <= 8) currentStep = 4
    else                     currentStep = 5
    const CUSTOM_STATUSES = [
      { step: 1, label: 'Reported',              detail: 'Your custom report has been received and logged.' },
      { step: 2, label: 'Under Review',           detail: 'A field officer is reviewing your report.' },
      { step: 3, label: 'Categorized / Assigned', detail: 'Issue has been categorized and assigned to the appropriate team.' },
      { step: 4, label: 'In Progress',            detail: 'The team is working on the issue.' },
      { step: 5, label: 'Resolved',               detail: 'Issue has been resolved. Thank you for reporting!' },
    ]
    return res.json({ trackingId, isCustom: true, currentStep, rejected: false, statuses: CUSTOM_STATUSES.map((s) => ({ ...s, done: s.step <= currentStep })) })
  }

  const match = trackingId.match(/^CL-(\d{4})$/)
  if (!match) return res.status(404).json({ error: 'Tracking ID not found. Check format: CL-XXXX or CL-M-XXXX' })

  const lastDigit = parseInt(match[1], 10) % 10
  let currentStep
  if (lastDigit <= 1)      currentStep = 1
  else if (lastDigit <= 3) currentStep = 2
  else if (lastDigit <= 5) currentStep = 3
  else if (lastDigit <= 7) currentStep = 4
  else                     currentStep = 5

  const STATUSES = [
    { step: 1, label: 'Reported',    detail: 'Your report has been received and logged.' },
    { step: 2, label: 'Verified',    detail: 'A field officer has verified the issue on-site.' },
    { step: 3, label: 'Assigned',    detail: 'Assigned to the Roads & Infrastructure ward team.' },
    { step: 4, label: 'In Progress', detail: 'Repair crew is on-site. Work is underway.' },
    { step: 5, label: 'Resolved',    detail: 'Issue has been resolved. Thank you for reporting!' },
  ]
  res.json({ trackingId, isCustom: false, currentStep, rejected: false, statuses: STATUSES.map((s) => ({ ...s, done: s.step <= currentStep })) })
})

// ── SPA catchall ──────────────────────────────────────────────────────────────
if (IS_PROD) {
  app.get('*', (_req, res) => res.sendFile(path.join(DIST, 'index.html')))
}
if (!IS_PROD) {
  app.use((_req, res) => res.status(404).json({ error: 'Not found' }))
}

app.listen(PORT, () => {
  console.log(`[civiclens-server] Listening on http://localhost:${PORT}`)
})
