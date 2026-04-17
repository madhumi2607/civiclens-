// DBSCAN clustering with haversine distance
// eps in metres, minPoints minimum cluster size

function haversineMetres(a, b) {
  const R = 6371000
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const sinLat = Math.sin(dLat / 2)
  const sinLng = Math.sin(dLng / 2)
  const c =
    sinLat * sinLat +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      sinLng * sinLng
  return R * 2 * Math.atan2(Math.sqrt(c), Math.sqrt(1 - c))
}

function regionQuery(points, idx, eps) {
  return points.reduce((acc, _, i) => {
    if (haversineMetres(points[idx], points[i]) <= eps) acc.push(i)
    return acc
  }, [])
}

export function dbscan(points, eps = 500, minPoints = 3) {
  const UNVISITED = -1
  const NOISE     = -2
  const labels    = new Array(points.length).fill(UNVISITED)
  let clusterId   = 0

  for (let i = 0; i < points.length; i++) {
    if (labels[i] !== UNVISITED) continue

    const neighbours = regionQuery(points, i, eps)

    if (neighbours.length < minPoints) {
      labels[i] = NOISE
      continue
    }

    labels[i] = clusterId
    const seed = [...neighbours]

    for (let si = 0; si < seed.length; si++) {
      const q = seed[si]
      if (labels[q] === NOISE) labels[q] = clusterId
      if (labels[q] !== UNVISITED) continue
      labels[q] = clusterId
      const qNeighbours = regionQuery(points, q, eps)
      if (qNeighbours.length >= minPoints) {
        for (const n of qNeighbours) {
          if (!seed.includes(n)) seed.push(n)
        }
      }
    }

    clusterId++
  }

  // Group points by cluster id (drop noise)
  const clusters = []
  for (let c = 0; c < clusterId; c++) {
    const members = points.filter((_, i) => labels[i] === c)
    if (members.length === 0) continue

    const centLat = members.reduce((s, p) => s + p.lat, 0) / members.length
    const centLng = members.reduce((s, p) => s + p.lng, 0) / members.length

    // Dominant type
    const typeCounts = {}
    members.forEach((p) => { typeCounts[p.type] = (typeCounts[p.type] ?? 0) + 1 })
    const dominantType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0][0]

    // Priority score: avg_severity*20 + count*10 + recency_bonus (max 20)
    const avgSeverity = members.reduce((s, p) => s + p.severity, 0) / members.length
    const now = Date.now()
    const recencyBonus = Math.min(
      20,
      members.reduce((s, p) => {
        const daysOld = (now - new Date(p.reportedAt).getTime()) / 86400000
        return s + Math.max(0, 20 - daysOld * 2)
      }, 0) / members.length
    )
    // +5 per extra citizen confirmation (confirmedBy > 1)
    const confirmBonus = members.reduce((s, p) => s + Math.max(0, ((p.confirmedBy ?? 1) - 1) * 5), 0)
    const priorityScore = Math.round(avgSeverity * 20 + members.length * 10 + recencyBonus + confirmBonus)

    // Root cause flag: 3+ same type in cluster
    const maxTypeCount = Math.max(...Object.values(typeCounts))
    const isRootCause = maxTypeCount >= 3

    clusters.push({
      id: `CLUSTER-${c + 1}`,
      members,
      centLat,
      centLng,
      count: members.length,
      dominantType,
      avgSeverity: Math.round(avgSeverity * 10) / 10,
      priorityScore,
      isRootCause,
    })
  }

  // Sort by priority descending
  clusters.sort((a, b) => b.priorityScore - a.priorityScore)
  return clusters
}
