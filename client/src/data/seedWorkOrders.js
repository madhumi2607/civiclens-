import { RESOLUTION_STEPS } from './teams'

function daysFromNow(n) {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString()
}
function daysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

// Pre-seeded work orders for the 4 demo clusters
// CLUSTER-1: pothole / T.Nagar → Team A → assigned (deadline in 2d)
// CLUSTER-2: drain / Adyar    → Team B → in_progress (some steps checked)
// CLUSTER-3: streetlight / T.Nagar → Team C → resolved (with proof)
// CLUSTER-4: waste / Adyar    → Team D → overdue (past deadline, no proof)

function makeSteps(type, checkedUpTo = -1) {
  return (RESOLUTION_STEPS[type] ?? []).map((label, i) => ({
    id: i,
    label,
    checked: i <= checkedUpTo,
  }))
}

const SEED_WORK_ORDERS = [
  {
    id:           'WO-0001',
    clusterId:    'CLUSTER-1',
    clusterType:  'pothole',
    teamId:       'team-a',
    assignedAt:   daysAgo(5),
    deadline:     daysFromNow(2),
    status:       'assigned',
    steps:        makeSteps('pothole', -1),
    resolvedAt:   null,
    address:      'Usman Road',
    ward:         'T. Nagar',
    lat:          13.0418,
    lng:          80.2341,
    count:        4,
    avgSeverity:  4,
    priorityScore: 120,
  },
  {
    id:           'WO-0002',
    clusterId:    'CLUSTER-2',
    clusterType:  'drain',
    teamId:       'team-b',
    assignedAt:   daysAgo(3),
    deadline:     daysFromNow(2),
    status:       'in_progress',
    steps:        makeSteps('drain', 2),  // first 3 steps checked
    resolvedAt:   null,
    address:      'LB Road',
    ward:         'Adyar',
    lat:          13.0012,
    lng:          80.2565,
    count:        4,
    avgSeverity:  4,
    priorityScore: 115,
  },
  {
    id:           'WO-0003',
    clusterId:    'CLUSTER-3',
    clusterType:  'streetlight',
    teamId:       'team-c',
    assignedAt:   daysAgo(4),
    deadline:     daysAgo(1),
    status:       'resolved',
    steps:        makeSteps('streetlight', 6),  // all steps checked
    resolvedAt:   daysAgo(1),
    address:      'Sir Thyagaraya Rd',
    ward:         'T. Nagar',
    lat:          13.0450,
    lng:          80.2310,
    count:        4,
    avgSeverity:  2.5,
    priorityScore: 80,
  },
  {
    id:           'WO-0004',
    clusterId:    'CLUSTER-4',
    clusterType:  'waste',
    teamId:       'team-d',
    assignedAt:   daysAgo(4),
    deadline:     daysAgo(2),   // overdue
    status:       'overdue',
    steps:        makeSteps('waste', -1),
    resolvedAt:   null,
    address:      'Thiruvanmiyur Main',
    ward:         'Adyar',
    lat:          13.0030,
    lng:          80.2590,
    count:        4,
    avgSeverity:  3,
    priorityScore: 90,
  },
]

export default SEED_WORK_ORDERS

// Returns initial work orders — seeds if localStorage is empty
export function initWorkOrders() {
  const stored = localStorage.getItem('civiclens_work_orders')
  if (!stored || stored === '[]') {
    localStorage.setItem('civiclens_work_orders', JSON.stringify(SEED_WORK_ORDERS))
    return SEED_WORK_ORDERS
  }
  try {
    return JSON.parse(stored)
  } catch {
    return SEED_WORK_ORDERS
  }
}
