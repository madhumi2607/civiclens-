// Demo reports — Chennai (50) + Trichy (7) + Madurai (5)
// city: 'Chennai' | 'Trichy' | 'Madurai'
// area: neighbourhood/suburb (drives AreaPanel grouping)
// confirmedBy: citizens who confirmed the same issue (F5 +5 priority per extra)

function daysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

// ── Cluster A — T. Nagar pothole hotspot (13.0418, 80.2341) ──────────────────
// ── Cluster B — Adyar drain hotspot (13.0012, 80.2565) ───────────────────────
// ── Cluster C — T. Nagar streetlight cluster (13.0450, 80.2310) ──────────────
// ── Cluster D — Adyar waste cluster (13.0030, 80.2590) ───────────────────────
// ── Cluster E — Trichy pothole cluster (10.7903, 78.7044) ────────────────────
// ── Cluster F — Madurai drain cluster (9.9250, 78.1195) ──────────────────────

const REPORTS = [
  // ── Cluster A — T. Nagar pothole (4 reports, tight ~200m spread) ─────────
  { id: 'CL-1000', type: 'pothole',     severity: 4, lat: 13.0418, lng: 80.2341, ward: 'T. Nagar', area: 'T. Nagar', city: 'Chennai', street: 'Usman Road',         status: 'in_progress', reportedAt: daysAgo(2),  confirmedBy: 3 },
  { id: 'CL-1001', type: 'pothole',     severity: 5, lat: 13.0422, lng: 80.2347, ward: 'T. Nagar', area: 'T. Nagar', city: 'Chennai', street: 'Usman Road',         status: 'reported',    reportedAt: daysAgo(1),  confirmedBy: 1 },
  { id: 'CL-1002', type: 'pothole',     severity: 3, lat: 13.0415, lng: 80.2336, ward: 'T. Nagar', area: 'T. Nagar', city: 'Chennai', street: 'North Usman Road',   status: 'verified',    reportedAt: daysAgo(5),  confirmedBy: 2 },
  { id: 'CL-1003', type: 'pothole',     severity: 4, lat: 13.0420, lng: 80.2350, ward: 'T. Nagar', area: 'T. Nagar', city: 'Chennai', street: 'Venkatnarayana Rd',  status: 'assigned',    reportedAt: daysAgo(3),  confirmedBy: 1 },

  // ── Cluster B — Adyar clogged drain (4 reports) ───────────────────────────
  { id: 'CL-1004', type: 'drain',       severity: 4, lat: 13.0012, lng: 80.2565, ward: 'Adyar',    area: 'Adyar',    city: 'Chennai', street: 'LB Road',            status: 'reported',    reportedAt: daysAgo(1),  confirmedBy: 1 },
  { id: 'CL-1005', type: 'drain',       severity: 3, lat: 13.0008, lng: 80.2570, ward: 'Adyar',    area: 'Adyar',    city: 'Chennai', street: 'LB Road',            status: 'reported',    reportedAt: daysAgo(2),  confirmedBy: 1 },
  { id: 'CL-1006', type: 'drain',       severity: 5, lat: 13.0015, lng: 80.2560, ward: 'Adyar',    area: 'Adyar',    city: 'Chennai', street: 'Lattice Bridge Rd',  status: 'verified',    reportedAt: daysAgo(4),  confirmedBy: 1 },
  { id: 'CL-1007', type: 'drain',       severity: 4, lat: 13.0010, lng: 80.2575, ward: 'Adyar',    area: 'Adyar',    city: 'Chennai', street: 'Lattice Bridge Rd',  status: 'assigned',    reportedAt: daysAgo(3),  confirmedBy: 1 },

  // ── Scattered — T. Nagar misc ─────────────────────────────────────────────
  { id: 'CL-1008', type: 'manhole',     severity: 5, lat: 13.0430, lng: 80.2290, ward: 'T. Nagar', area: 'T. Nagar', city: 'Chennai', street: 'Pondy Bazaar',       status: 'reported',    reportedAt: daysAgo(0),  confirmedBy: 1 },
  { id: 'CL-1009', type: 'waste',       severity: 2, lat: 13.0460, lng: 80.2380, ward: 'T. Nagar', area: 'T. Nagar', city: 'Chennai', street: 'GN Chetty Road',     status: 'resolved',    reportedAt: daysAgo(20), confirmedBy: 1 },

  // ── Cluster C — T. Nagar streetlight (4 reports, 13.0450 area) ───────────
  { id: 'CL-1010', type: 'streetlight', severity: 2, lat: 13.0450, lng: 80.2310, ward: 'T. Nagar', area: 'T. Nagar', city: 'Chennai', street: 'Sir Thyagaraya Rd',  status: 'reported',    reportedAt: daysAgo(6),  confirmedBy: 1 },
  { id: 'CL-1011', type: 'streetlight', severity: 3, lat: 13.0455, lng: 80.2315, ward: 'T. Nagar', area: 'T. Nagar', city: 'Chennai', street: 'Sir Thyagaraya Rd',  status: 'verified',    reportedAt: daysAgo(7),  confirmedBy: 1 },
  { id: 'CL-1012', type: 'streetlight', severity: 2, lat: 13.0445, lng: 80.2306, ward: 'T. Nagar', area: 'T. Nagar', city: 'Chennai', street: 'Habibullah Road',    status: 'reported',    reportedAt: daysAgo(5),  confirmedBy: 1 },
  { id: 'CL-1013', type: 'streetlight', severity: 3, lat: 13.0458, lng: 80.2320, ward: 'T. Nagar', area: 'T. Nagar', city: 'Chennai', street: 'Habibullah Road',    status: 'assigned',    reportedAt: daysAgo(8),  confirmedBy: 1 },

  // ── Scattered — Adyar misc ────────────────────────────────────────────────
  { id: 'CL-1014', type: 'pothole',     severity: 3, lat: 13.0050, lng: 80.2520, ward: 'Adyar',    area: 'Adyar',    city: 'Chennai', street: 'Kasturba Nagar',     status: 'in_progress', reportedAt: daysAgo(10), confirmedBy: 1 },
  { id: 'CL-1015', type: 'flood',       severity: 4, lat: 12.9985, lng: 80.2600, ward: 'Adyar',    area: 'Adyar',    city: 'Chennai', street: 'Canal Bank Road',    status: 'reported',    reportedAt: daysAgo(1),  confirmedBy: 1 },
  { id: 'CL-1016', type: 'manhole',     severity: 5, lat: 13.0025, lng: 80.2540, ward: 'Adyar',    area: 'Adyar',    city: 'Chennai', street: 'Adyar Bridge Rd',    status: 'verified',    reportedAt: daysAgo(3),  confirmedBy: 1 },
  { id: 'CL-1017', type: 'waste',       severity: 2, lat: 13.0040, lng: 80.2610, ward: 'Adyar',    area: 'Adyar',    city: 'Chennai', street: 'Besant Nagar 1st St',status: 'resolved',    reportedAt: daysAgo(15), confirmedBy: 1 },
  { id: 'CL-1018', type: 'pothole',     severity: 2, lat: 13.0060, lng: 80.2490, ward: 'Adyar',    area: 'Adyar',    city: 'Chennai', street: 'Gandhi Nagar',       status: 'resolved',    reportedAt: daysAgo(25), confirmedBy: 1 },
  { id: 'CL-1019', type: 'drain',       severity: 3, lat: 12.9970, lng: 80.2580, ward: 'Adyar',    area: 'Adyar',    city: 'Chennai', street: 'Indira Nagar',       status: 'assigned',    reportedAt: daysAgo(9),  confirmedBy: 1 },

  // ── Scattered — T. Nagar misc continued ──────────────────────────────────
  { id: 'CL-1020', type: 'pothole',     severity: 1, lat: 13.0390, lng: 80.2300, ward: 'T. Nagar', area: 'T. Nagar', city: 'Chennai', street: 'Kodambakkam High Rd',status: 'resolved',    reportedAt: daysAgo(28), confirmedBy: 1 },
  { id: 'CL-1021', type: 'flood',       severity: 3, lat: 13.0480, lng: 80.2400, ward: 'T. Nagar', area: 'T. Nagar', city: 'Chennai', street: 'Rangarajapuram',     status: 'reported',    reportedAt: daysAgo(2),  confirmedBy: 1 },
  { id: 'CL-1022', type: 'waste',       severity: 3, lat: 13.0500, lng: 80.2350, ward: 'T. Nagar', area: 'T. Nagar', city: 'Chennai', street: 'Burkit Road',        status: 'in_progress', reportedAt: daysAgo(4),  confirmedBy: 1 },
  { id: 'CL-1023', type: 'manhole',     severity: 4, lat: 13.0410, lng: 80.2280, ward: 'T. Nagar', area: 'T. Nagar', city: 'Chennai', street: 'Nungambakkam HR',    status: 'reported',    reportedAt: daysAgo(1),  confirmedBy: 1 },
  { id: 'CL-1024', type: 'streetlight', severity: 1, lat: 13.0370, lng: 80.2360, ward: 'T. Nagar', area: 'T. Nagar', city: 'Chennai', street: 'Mowbrays Road',      status: 'resolved',    reportedAt: daysAgo(22), confirmedBy: 1 },

  // ── Cluster D — Adyar waste cluster (4 reports, 13.0030 area) ────────────
  { id: 'CL-1025', type: 'waste',       severity: 3, lat: 13.0030, lng: 80.2590, ward: 'Adyar',    area: 'Thiruvanmiyur', city: 'Chennai', street: 'Thiruvanmiyur Main', status: 'reported',    reportedAt: daysAgo(3),  confirmedBy: 1 },
  { id: 'CL-1026', type: 'waste',       severity: 4, lat: 13.0035, lng: 80.2595, ward: 'Adyar',    area: 'Thiruvanmiyur', city: 'Chennai', street: 'Thiruvanmiyur Main', status: 'verified',    reportedAt: daysAgo(5),  confirmedBy: 1 },
  { id: 'CL-1027', type: 'waste',       severity: 3, lat: 13.0026, lng: 80.2585, ward: 'Adyar',    area: 'Thiruvanmiyur', city: 'Chennai', street: 'ECR Junction',       status: 'reported',    reportedAt: daysAgo(2),  confirmedBy: 1 },
  { id: 'CL-1028', type: 'waste',       severity: 2, lat: 13.0032, lng: 80.2600, ward: 'Adyar',    area: 'Thiruvanmiyur', city: 'Chennai', street: 'ECR Junction',       status: 'assigned',    reportedAt: daysAgo(7),  confirmedBy: 1 },

  // ── More scattered Chennai ────────────────────────────────────────────────
  { id: 'CL-1029', type: 'drain',       severity: 2, lat: 13.0075, lng: 80.2455, ward: 'Adyar',    area: 'Adyar',    city: 'Chennai', street: 'Kotturpuram Bridge', status: 'resolved',    reportedAt: daysAgo(18), confirmedBy: 1 },
  { id: 'CL-1030', type: 'pothole',     severity: 3, lat: 13.0395, lng: 80.2410, ward: 'T. Nagar', area: 'T. Nagar', city: 'Chennai', street: 'Cenotaph Road',      status: 'in_progress', reportedAt: daysAgo(6),  confirmedBy: 1 },
  { id: 'CL-1031', type: 'flood',       severity: 5, lat: 12.9960, lng: 80.2555, ward: 'Adyar',    area: 'Adyar',    city: 'Chennai', street: 'Santhome HR',        status: 'reported',    reportedAt: daysAgo(1),  confirmedBy: 1 },
  { id: 'CL-1032', type: 'manhole',     severity: 3, lat: 13.0440, lng: 80.2260, ward: 'T. Nagar', area: 'T. Nagar', city: 'Chennai', street: 'TTK Road',           status: 'verified',    reportedAt: daysAgo(4),  confirmedBy: 1 },
  { id: 'CL-1033', type: 'streetlight', severity: 2, lat: 13.0385, lng: 80.2330, ward: 'T. Nagar', area: 'T. Nagar', city: 'Chennai', street: 'Eldams Road',        status: 'resolved',    reportedAt: daysAgo(12), confirmedBy: 1 },
  { id: 'CL-1034', type: 'pothole',     severity: 4, lat: 13.0020, lng: 80.2630, ward: 'Adyar',    area: 'Adyar',    city: 'Chennai', street: 'Besant Nagar Beach', status: 'assigned',    reportedAt: daysAgo(2),  confirmedBy: 1 },
  { id: 'CL-1035', type: 'waste',       severity: 1, lat: 13.0465, lng: 80.2270, ward: 'T. Nagar', area: 'T. Nagar', city: 'Chennai', street: 'Nagaswamy Road',     status: 'resolved',    reportedAt: daysAgo(29), confirmedBy: 1 },
  { id: 'CL-1036', type: 'drain',       severity: 4, lat: 13.0088, lng: 80.2510, ward: 'Adyar',    area: 'Adyar',    city: 'Chennai', street: 'MRC Nagar',          status: 'in_progress', reportedAt: daysAgo(3),  confirmedBy: 1 },
  { id: 'CL-1037', type: 'flood',       severity: 3, lat: 13.0445, lng: 80.2430, ward: 'T. Nagar', area: 'T. Nagar', city: 'Chennai', street: 'Mahalingapuram',     status: 'verified',    reportedAt: daysAgo(7),  confirmedBy: 1 },
  { id: 'CL-1038', type: 'pothole',     severity: 2, lat: 12.9990, lng: 80.2640, ward: 'Adyar',    area: 'Adyar',    city: 'Chennai', street: 'Foreshore Estate',   status: 'resolved',    reportedAt: daysAgo(24), confirmedBy: 1 },
  { id: 'CL-1039', type: 'manhole',     severity: 5, lat: 13.0405, lng: 80.2320, ward: 'T. Nagar', area: 'T. Nagar', city: 'Chennai', street: 'South Usman Road',   status: 'reported',    reportedAt: daysAgo(0),  confirmedBy: 1 },
  { id: 'CL-1040', type: 'streetlight', severity: 3, lat: 13.0095, lng: 80.2480, ward: 'Adyar',    area: 'Adyar',    city: 'Chennai', street: 'Raja Annamalai Rd',  status: 'assigned',    reportedAt: daysAgo(5),  confirmedBy: 1 },
  { id: 'CL-1041', type: 'pothole',     severity: 4, lat: 13.0510, lng: 80.2290, ward: 'T. Nagar', area: 'T. Nagar', city: 'Chennai', street: 'Valluvar Kottam HR', status: 'in_progress', reportedAt: daysAgo(8),  confirmedBy: 1 },
  { id: 'CL-1042', type: 'drain',       severity: 3, lat: 12.9975, lng: 80.2510, ward: 'Adyar',    area: 'Adyar',    city: 'Chennai', street: 'Kasturba Nagar 2nd', status: 'reported',    reportedAt: daysAgo(2),  confirmedBy: 1 },
  { id: 'CL-1043', type: 'waste',       severity: 2, lat: 13.0360, lng: 80.2390, ward: 'T. Nagar', area: 'T. Nagar', city: 'Chennai', street: 'Poes Garden',        status: 'resolved',    reportedAt: daysAgo(16), confirmedBy: 1 },
  { id: 'CL-1044', type: 'flood',       severity: 4, lat: 13.0070, lng: 80.2640, ward: 'Adyar',    area: 'Adyar',    city: 'Chennai', street: 'Karpagam Avenue',    status: 'verified',    reportedAt: daysAgo(1),  confirmedBy: 1 },
  { id: 'CL-1045', type: 'manhole',     severity: 4, lat: 13.0520, lng: 80.2410, ward: 'T. Nagar', area: 'T. Nagar', city: 'Chennai', street: 'Khader Nawaz Khan Rd',status:'reported',    reportedAt: daysAgo(0),  confirmedBy: 1 },
  { id: 'CL-1046', type: 'streetlight', severity: 1, lat: 13.0015, lng: 80.2650, ward: 'Adyar',    area: 'Adyar',    city: 'Chennai', street: 'Greenways Road',     status: 'resolved',    reportedAt: daysAgo(27), confirmedBy: 1 },
  { id: 'CL-1047', type: 'pothole',     severity: 3, lat: 13.0355, lng: 80.2270, ward: 'T. Nagar', area: 'T. Nagar', city: 'Chennai', street: 'Chamiers Road',      status: 'in_progress', reportedAt: daysAgo(9),  confirmedBy: 1 },
  { id: 'CL-1048', type: 'drain',       severity: 2, lat: 13.0055, lng: 80.2530, ward: 'Adyar',    area: 'Adyar',    city: 'Chennai', street: 'Shastri Nagar',      status: 'resolved',    reportedAt: daysAgo(21), confirmedBy: 1 },
  { id: 'CL-1049', type: 'waste',       severity: 3, lat: 13.0490, lng: 80.2360, ward: 'T. Nagar', area: 'T. Nagar', city: 'Chennai', street: 'Nandanam Main Rd',   status: 'assigned',    reportedAt: daysAgo(4),  confirmedBy: 1 },

  // ── Cluster E — Trichy pothole cluster (10.7900–10.7910, 78.7042–78.7052) ─
  { id: 'CL-2000', type: 'pothole',     severity: 4, lat: 10.7903, lng: 78.7044, ward: 'Thillai Nagar', area: 'Thillai Nagar', city: 'Trichy', street: 'Bharathidasan Rd', status: 'reported',    reportedAt: daysAgo(2),  confirmedBy: 2 },
  { id: 'CL-2001', type: 'pothole',     severity: 3, lat: 10.7908, lng: 78.7049, ward: 'Thillai Nagar', area: 'Thillai Nagar', city: 'Trichy', street: 'Bharathidasan Rd', status: 'reported',    reportedAt: daysAgo(3),  confirmedBy: 1 },
  { id: 'CL-2002', type: 'pothole',     severity: 5, lat: 10.7900, lng: 78.7041, ward: 'Thillai Nagar', area: 'Thillai Nagar', city: 'Trichy', street: 'Karur Bypass Rd',  status: 'verified',    reportedAt: daysAgo(1),  confirmedBy: 1 },
  { id: 'CL-2003', type: 'pothole',     severity: 4, lat: 10.7907, lng: 78.7047, ward: 'Thillai Nagar', area: 'Thillai Nagar', city: 'Trichy', street: 'Karur Bypass Rd',  status: 'reported',    reportedAt: daysAgo(4),  confirmedBy: 1 },
  { id: 'CL-2004', type: 'drain',       severity: 3, lat: 10.7920, lng: 78.7060, ward: 'Srirangam',     area: 'Srirangam',     city: 'Trichy', street: 'Srirangam Main',    status: 'reported',    reportedAt: daysAgo(5),  confirmedBy: 1 },
  { id: 'CL-2005', type: 'waste',       severity: 2, lat: 10.7885, lng: 78.7030, ward: 'Woraiyur',      area: 'Woraiyur',      city: 'Trichy', street: 'Woraiyur High Rd',  status: 'reported',    reportedAt: daysAgo(6),  confirmedBy: 1 },
  { id: 'CL-2006', type: 'streetlight', severity: 3, lat: 10.7895, lng: 78.7055, ward: 'Ariyamangalam', area: 'Ariyamangalam', city: 'Trichy', street: 'Ariyamangalam Rd', status: 'reported',    reportedAt: daysAgo(3),  confirmedBy: 1 },

  // ── Cluster F — Madurai drain cluster (9.9248–9.9255, 78.1192–78.1200) ────
  { id: 'CL-3000', type: 'drain',       severity: 4, lat: 9.9250,  lng: 78.1195, ward: 'Anna Nagar',    area: 'Anna Nagar',    city: 'Madurai', street: 'Anna Nagar Main',  status: 'reported',    reportedAt: daysAgo(1),  confirmedBy: 2 },
  { id: 'CL-3001', type: 'drain',       severity: 3, lat: 9.9253,  lng: 78.1199, ward: 'Anna Nagar',    area: 'Anna Nagar',    city: 'Madurai', street: 'Anna Nagar Main',  status: 'reported',    reportedAt: daysAgo(2),  confirmedBy: 1 },
  { id: 'CL-3002', type: 'drain',       severity: 5, lat: 9.9247,  lng: 78.1192, ward: 'Anna Nagar',    area: 'Anna Nagar',    city: 'Madurai', street: 'KK Nagar Ring Rd', status: 'verified',    reportedAt: daysAgo(3),  confirmedBy: 1 },
  { id: 'CL-3003', type: 'pothole',     severity: 3, lat: 9.9260,  lng: 78.1210, ward: 'KK Nagar',      area: 'KK Nagar',      city: 'Madurai', street: 'KK Nagar Main',    status: 'reported',    reportedAt: daysAgo(4),  confirmedBy: 1 },
  { id: 'CL-3004', type: 'waste',       severity: 2, lat: 9.9240,  lng: 78.1185, ward: 'Teppakulam',    area: 'Teppakulam',    city: 'Madurai', street: 'Teppakulam St',    status: 'reported',    reportedAt: daysAgo(5),  confirmedBy: 1 },

  // ── Custom / Other reports (type: 'other') — excluded from DBSCAN ─────────
  { id: 'CL-M-0012', type: 'other', isCustom: true, customTitle: 'Broken Park Bench', customDescription: 'Wooden bench completely broken, sharp edges exposed — hazard for children.', severity: 2, lat: 13.0460, lng: 80.2380, ward: 'T. Nagar', area: 'T. Nagar', city: 'Chennai', street: 'Valluvar Kottam Park', status: 'reported',    reportedAt: daysAgo(3),  confirmedBy: 1 },
  { id: 'CL-M-0013', type: 'other', isCustom: true, customTitle: 'Fallen Tree Branch', customDescription: 'Large branch blocking half the footpath after last night\'s storm. Pedestrians walking on road.', severity: 3, lat: 13.0022, lng: 80.2600, ward: 'Adyar', area: 'Adyar', city: 'Chennai', street: 'Besant Nagar 3rd Ave', status: 'verified',    reportedAt: daysAgo(1),  confirmedBy: 1 },
  { id: 'CL-M-0014', type: 'other', isCustom: true, customTitle: 'Stray Dog Menace', customDescription: 'Pack of ~8 stray dogs near the school gate, aggressive during morning hours. Animal welfare team needed.', severity: 4, lat: 13.0430, lng: 80.2320, ward: 'T. Nagar', area: 'T. Nagar', city: 'Chennai', street: 'Gopathy Narayanaswamy Rd', status: 'reported', reportedAt: daysAgo(0), confirmedBy: 1 },
]

// Keep backward-compat alias: customType / customDesc → customTitle / customDescription
REPORTS.forEach((r) => {
  if (r.isCustom) {
    r.customType = r.customTitle
    r.customDesc = r.customDescription
  }
})

export default REPORTS
