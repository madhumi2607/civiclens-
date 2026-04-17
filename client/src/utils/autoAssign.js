import { TEAMS, SLA_DAYS } from '../data/teams'

let woCounter = 5  // starts at 5 — seeds occupy 1-4

function pad4(n) {
  return String(n).padStart(4, '0')
}

export function nextWoId() {
  // Persist counter across hot reloads
  const stored = parseInt(localStorage.getItem('civiclens_wo_counter') ?? '5', 10)
  const id = `WO-${pad4(stored)}`
  localStorage.setItem('civiclens_wo_counter', String(stored + 1))
  return id
}

/**
 * Assigns the best-matching team to a cluster.
 * Priority: city match → specialty → fallback Team H (General Regional).
 * Returns a work-order object (not yet persisted — caller saves it).
 */
export function autoAssign(cluster) {
  const type = cluster.dominantType
  const city = cluster.members[0]?.city ?? 'Chennai'

  // 1. Filter by city + specialty (includes 'any'-city teams like Team H)
  let candidates = TEAMS.filter((t) =>
    (t.city === city || t.city === 'any') && t.specialty.includes(type)
  )

  // 2. If only Team H matched (no city-specific team), still fine — use it
  // 3. For Chennai, narrow by zone for local teams
  if (city === 'Chennai') {
    const zone = inferZone(cluster.centLat, cluster.centLng)
    const zoneMatch = candidates.filter((t) => t.zone === zone || t.zone === 'floating')
    if (zoneMatch.length > 0) candidates = zoneMatch
  }

  // Absolute fallback: any team with specialty
  if (candidates.length === 0) {
    candidates = TEAMS.filter((t) => t.specialty.includes(type))
  }

  // 4. Pick highest availability ratio
  candidates.sort((a, b) => b.available / b.capacity - a.available / a.capacity)
  const team = candidates[0] ?? TEAMS.find((t) => t.id === 'team-h') ?? TEAMS[0]

  // 5. Deadline
  const sla = SLA_DAYS[type] ?? 7
  const deadline = new Date()
  deadline.setDate(deadline.getDate() + sla)

  // Carry the citizen's before photo from the first cluster member that has one
  const beforePhoto = cluster.members.find((m) => m.beforePhoto)?.beforePhoto ?? null

  return {
    id:          nextWoId(),
    clusterId:   cluster.id,
    clusterType: type,
    teamId:      team.id,
    assignedAt:  new Date().toISOString(),
    deadline:    deadline.toISOString(),
    status:      'assigned',
    steps:       [],
    proofPhoto:  null,
    beforePhoto,
    resolvedAt:  null,
    address:     cluster.members[0]?.street ?? '',
    ward:        cluster.members[0]?.ward ?? '',
    city:        city,
    lat:         cluster.centLat,
    lng:         cluster.centLng,
    count:       cluster.count,
    avgSeverity: cluster.avgSeverity,
    priorityScore: cluster.priorityScore,
  }
}

// Zone inference for Chennai teams
function inferZone(lat, _lng) {
  if (lat >= 13.03) return 'T. Nagar'
  return 'Adyar'
}

// ── localStorage helpers ──────────────────────────────────────────────────────

export const WO_KEY = 'civiclens_work_orders'

export function loadWorkOrders() {
  try {
    return JSON.parse(localStorage.getItem(WO_KEY) ?? '[]')
  } catch {
    return []
  }
}

export function saveWorkOrders(orders) {
  localStorage.setItem(WO_KEY, JSON.stringify(orders))
}

export function upsertWorkOrder(order) {
  const orders = loadWorkOrders()
  const idx = orders.findIndex((o) => o.id === order.id)
  if (idx >= 0) orders[idx] = order
  else orders.push(order)
  saveWorkOrders(orders)
}
