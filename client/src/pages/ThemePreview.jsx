import { Link } from 'react-router-dom'

// ─── Palette Definitions ──────────────────────────────────────────────────────

const PALETTES = [
  {
    id: 'current',
    num: '01',
    label: 'CURRENT',
    name: 'Orange + Dark Gray',
    tagline: 'Energetic · High-contrast · Mobile-first',
    primary: '#f97316',
    accent: '#fb923c',
    btnRadius: '14px',
    cardRadius: '14px',
    headingWeight: 700,
    headingFont: 'Inter, system-ui, sans-serif',
    headingLetterSpacing: 'normal',
    btnLetterSpacing: 'normal',
    btnTextTransform: 'none',
    light: {
      bg: '#ffffff',
      card: '#f3f4f6',
      sidebar: '#f9fafb',
      text: '#111827',
      muted: '#6b7280',
      border: '#e5e7eb',
      primaryBtn: { bg: '#f97316', color: '#fff' },
      secondBtn: { bg: 'transparent', color: '#374151', border: '1.5px solid #d1d5db' },
      badge: { bg: '#fff7ed', color: '#c2410c' },
      cardBorderLeft: null,
      cardShadow: 'none',
      statNumColor: '#f97316',
    },
    dark: {
      bg: '#18181b',
      card: '#27272a',
      sidebar: '#1c1c1f',
      text: '#ffffff',
      muted: '#a1a1aa',
      border: '#3f3f46',
      primaryBtn: { bg: '#f97316', color: '#fff' },
      secondBtn: { bg: 'transparent', color: '#d4d4d8', border: '1.5px solid #52525b' },
      badge: { bg: '#431407', color: '#fb923c' },
      cardBorderLeft: null,
      cardShadow: 'none',
      statNumColor: '#f97316',
    },
  },
  {
    id: 'civic-blue',
    num: '02',
    label: 'CIVIC BLUE',
    name: 'Blue #2563eb + Cyan',
    tagline: 'Trustworthy · Open · Civic-grade',
    primary: '#2563eb',
    accent: '#06b6d4',
    btnRadius: '9999px',
    cardRadius: '10px',
    headingWeight: 800,
    headingFont: 'Inter, system-ui, sans-serif',
    headingLetterSpacing: '-0.03em',
    btnLetterSpacing: 'normal',
    btnTextTransform: 'none',
    light: {
      bg: '#faf8f4',
      card: '#ffffff',
      sidebar: '#eff6ff',
      text: '#1e293b',
      muted: '#64748b',
      border: '#dbeafe',
      primaryBtn: { bg: '#2563eb', color: '#fff' },
      secondBtn: { bg: '#eff6ff', color: '#1d4ed8', border: '1.5px solid #bfdbfe' },
      badge: { bg: '#ecfeff', color: '#0e7490' },
      cardBorderLeft: null,
      cardShadow: '0 1px 4px rgba(37,99,235,0.1)',
      statNumColor: '#2563eb',
    },
    dark: {
      bg: '#0f1420',
      card: '#1e2536',
      sidebar: '#141c2e',
      text: '#e2e8f0',
      muted: '#94a3b8',
      border: '#2d3748',
      primaryBtn: { bg: '#3b82f6', color: '#fff' },
      secondBtn: { bg: 'rgba(59,130,246,0.12)', color: '#93c5fd', border: '1.5px solid #3b82f6' },
      badge: { bg: 'rgba(6,182,212,0.18)', color: '#22d3ee' },
      cardBorderLeft: null,
      cardShadow: 'none',
      statNumColor: '#60a5fa',
    },
  },
  {
    id: 'forest',
    num: '03',
    label: 'FOREST',
    name: 'Emerald #059669 + Lime',
    tagline: 'Grounded · Natural · Decisive action',
    primary: '#059669',
    accent: '#84cc16',
    btnRadius: '4px',
    cardRadius: '6px',
    headingWeight: 900,
    headingFont: 'Inter, system-ui, sans-serif',
    headingLetterSpacing: '0.01em',
    btnLetterSpacing: '0.07em',
    btnTextTransform: 'uppercase',
    light: {
      bg: '#faf9f5',
      card: '#ecfdf5',
      sidebar: '#f0fdf4',
      text: '#064e3b',
      muted: '#4b7a5e',
      border: '#a7f3d0',
      primaryBtn: { bg: '#059669', color: '#fff' },
      secondBtn: { bg: 'transparent', color: '#059669', border: '2px solid #059669' },
      badge: { bg: '#f7fee7', color: '#4d7c0f' },
      cardBorderLeft: '3px solid #059669',
      cardShadow: 'none',
      statNumColor: '#059669',
    },
    dark: {
      bg: '#0d1a14',
      card: '#14261e',
      sidebar: '#101f17',
      text: '#d1fae5',
      muted: '#6ee7b7',
      border: '#166534',
      primaryBtn: { bg: '#10b981', color: '#fff' },
      secondBtn: { bg: 'transparent', color: '#6ee7b7', border: '2px solid #10b981' },
      badge: { bg: 'rgba(132,204,22,0.18)', color: '#a3e635' },
      cardBorderLeft: '3px solid #10b981',
      cardShadow: 'none',
      statNumColor: '#34d399',
    },
  },
  {
    id: 'slate-amber',
    num: '04',
    label: 'SLATE + AMBER',
    name: 'Slate #0f172a + Amber',
    tagline: 'Editorial · Sophisticated · Authoritative',
    primary: '#0f172a',
    accent: '#f59e0b',
    btnRadius: '6px',
    cardRadius: '8px',
    headingWeight: 700,
    headingFont: 'Georgia, "Times New Roman", serif',
    headingLetterSpacing: '-0.01em',
    btnLetterSpacing: 'normal',
    btnTextTransform: 'none',
    light: {
      bg: '#fafaf9',
      card: '#f1f5f9',
      sidebar: '#f8fafc',
      text: '#0f172a',
      muted: '#475569',
      border: '#cbd5e1',
      primaryBtn: { bg: '#0f172a', color: '#fff' },
      secondBtn: { bg: 'transparent', color: '#92400e', border: '1.5px solid #f59e0b' },
      badge: { bg: '#fffbeb', color: '#92400e' },
      cardBorderLeft: null,
      cardShadow: '0 1px 3px rgba(15,23,42,0.07)',
      statNumColor: '#f59e0b',
    },
    dark: {
      bg: '#020617',
      card: '#1e293b',
      sidebar: '#0f172a',
      text: '#f8fafc',
      muted: '#94a3b8',
      border: '#334155',
      primaryBtn: { bg: '#f59e0b', color: '#0f172a' },
      secondBtn: { bg: 'rgba(245,158,11,0.1)', color: '#fcd34d', border: '1.5px solid #f59e0b' },
      badge: { bg: 'rgba(245,158,11,0.14)', color: '#fcd34d' },
      cardBorderLeft: null,
      cardShadow: 'none',
      statNumColor: '#f59e0b',
    },
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function cardBorderProps(t) {
  if (t.cardBorderLeft) {
    return {
      borderTop: `1px solid ${t.border}`,
      borderRight: `1px solid ${t.border}`,
      borderBottom: `1px solid ${t.border}`,
      borderLeft: t.cardBorderLeft,
    }
  }
  return { border: `1px solid ${t.border}` }
}

// ─── Mini Landing Preview ─────────────────────────────────────────────────────

function MiniLanding({ palette: p, dark }) {
  const t = dark ? p.dark : p.light

  const btnBase = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '5px 10px',
    fontSize: '9px',
    fontWeight: 600,
    cursor: 'default',
    whiteSpace: 'nowrap',
    borderRadius: p.btnRadius,
    letterSpacing: p.btnLetterSpacing,
    textTransform: p.btnTextTransform,
    lineHeight: 1,
    flex: 1,
  }

  return (
    <div style={{
      background: t.bg,
      borderRadius: '10px',
      overflow: 'hidden',
      border: `1px solid ${t.border}`,
      fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      {/* Tiny navbar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '5px',
        padding: '6px 10px',
        borderBottom: `1px solid ${t.border}`,
        background: t.sidebar,
      }}>
        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: p.primary }} />
        <span style={{ fontSize: '8px', fontWeight: 800, color: t.text, letterSpacing: '0.06em' }}>CIVICLENS</span>
      </div>

      <div style={{ padding: '11px 12px 10px' }}>
        {/* Headline */}
        <div style={{
          fontFamily: p.headingFont,
          fontWeight: p.headingWeight,
          letterSpacing: p.headingLetterSpacing,
          lineHeight: 1.15,
          marginBottom: '5px',
        }}>
          <span style={{ fontSize: '13px', color: t.text, display: 'block' }}>Report. Track.</span>
          <span style={{ fontSize: '13px', color: p.id === 'slate-amber' ? p.accent : p.primary, display: 'block' }}>
            Resolve.
          </span>
        </div>

        {/* Tagline */}
        <div style={{ fontSize: '8.5px', color: t.muted, marginBottom: '9px', lineHeight: 1.4 }}>
          AI-powered civic reporting for your city.
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '5px', marginBottom: '9px' }}>
          <div style={{ ...btnBase, background: t.primaryBtn.bg, color: t.primaryBtn.color, border: 'none' }}>
            Report Issue
          </div>
          <div style={{
            ...btnBase,
            background: t.secondBtn.bg,
            color: t.secondBtn.color,
            border: t.secondBtn.border,
          }}>
            View Map
          </div>
        </div>

        {/* Stat card */}
        <div style={{
          background: t.card,
          borderRadius: p.cardRadius,
          padding: '7px 9px',
          boxShadow: t.cardShadow,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          ...cardBorderProps(t),
        }}>
          <div style={{
            width: '20px', height: '20px',
            borderRadius: p.btnRadius === '4px' ? '3px' : '7px',
            background: p.id === 'slate-amber' ? p.accent : p.primary,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: p.id === 'slate-amber' ? '#0f172a' : '#fff',
            fontSize: '10px',
            flexShrink: 0,
          }}>
            ✓
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 800, color: t.text, lineHeight: 1 }}>1,247</div>
            <div style={{ fontSize: '7.5px', color: t.muted, marginTop: '1px' }}>issues resolved</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Mini Dashboard Preview ───────────────────────────────────────────────────

function MiniDashboard({ palette: p, dark }) {
  const t = dark ? p.dark : p.light

  const btnBase = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3px 8px',
    fontSize: '8px',
    fontWeight: 600,
    cursor: 'default',
    whiteSpace: 'nowrap',
    borderRadius: p.btnRadius,
    letterSpacing: p.btnLetterSpacing,
    textTransform: p.btnTextTransform,
    lineHeight: 1,
  }

  return (
    <div style={{
      background: t.bg,
      borderRadius: '10px',
      overflow: 'hidden',
      border: `1px solid ${t.border}`,
      fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      {/* Top bar */}
      <div style={{
        padding: '6px 10px',
        borderBottom: `1px solid ${t.border}`,
        background: t.sidebar,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: p.primary }} />
          <span style={{ fontSize: '8px', fontWeight: 800, color: t.text, letterSpacing: '0.06em' }}>DASHBOARD</span>
        </div>
        <div style={{
          fontSize: '7px', padding: '2px 6px', borderRadius: '9999px',
          background: t.badge.bg, color: t.badge.color, fontWeight: 700,
          letterSpacing: '0.04em',
        }}>
          ADMIN
        </div>
      </div>

      {/* Sidebar + main content */}
      <div style={{ display: 'flex', minHeight: '118px' }}>
        {/* Sidebar strip */}
        <div style={{
          width: '34px',
          background: t.sidebar,
          borderRight: `1px solid ${t.border}`,
          padding: '10px 0',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '7px',
        }}>
          <div style={{ width: '16px', height: '3px', borderRadius: '2px', background: p.primary }} />
          <div style={{ width: '16px', height: '3px', borderRadius: '2px', background: t.muted, opacity: 0.4 }} />
          <div style={{ width: '16px', height: '3px', borderRadius: '2px', background: t.muted, opacity: 0.4 }} />
          <div style={{ width: '16px', height: '3px', borderRadius: '2px', background: t.muted, opacity: 0.2 }} />
        </div>

        {/* Main area */}
        <div style={{ flex: 1, padding: '8px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
          {/* Stat card */}
          <div style={{
            background: t.card,
            borderRadius: p.cardRadius,
            padding: '6px 8px',
            boxShadow: t.cardShadow,
            ...cardBorderProps(t),
          }}>
            <div style={{ fontSize: '7.5px', fontWeight: 600, color: t.muted, letterSpacing: '0.06em', marginBottom: '2px' }}>
              OPEN ISSUES
            </div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: t.statNumColor, lineHeight: 1 }}>42</div>
            <div style={{ fontSize: '7px', color: t.muted, marginTop: '2px' }}>↑ 3 new today</div>
          </div>

          {/* Action brief */}
          <div style={{
            background: t.card,
            borderRadius: p.cardRadius,
            padding: '6px 8px',
            boxShadow: t.cardShadow,
            flex: 1,
            ...cardBorderProps(t),
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
              <div style={{
                fontSize: '9px', fontWeight: 700, color: t.text,
                fontFamily: p.id === 'slate-amber' ? p.headingFont : 'Inter, system-ui, sans-serif',
              }}>
                Road Damage
              </div>
              <div style={{
                fontSize: '6.5px', padding: '1px 5px', borderRadius: '9999px',
                background: t.badge.bg, color: t.badge.color, fontWeight: 700,
              }}>
                URGENT
              </div>
            </div>
            <div style={{ fontSize: '7.5px', color: t.muted, marginBottom: '5px' }}>
              Ward 12 · 7 clustered
            </div>
            <div style={{
              ...btnBase,
              background: t.primaryBtn.bg,
              color: t.primaryBtn.color,
              border: 'none',
            }}>
              Assign →
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Palette Column ───────────────────────────────────────────────────────────

function PaletteColumn({ palette: p, last }) {
  const swatches = [
    { color: p.primary, label: 'primary' },
    { color: p.accent,  label: 'accent'  },
    { color: p.light.bg, label: 'bg·☀'  },
    { color: p.dark.bg,  label: 'bg·☾'  },
  ]

  return (
    <div style={{
      borderRight: last ? 'none' : '1px solid #1a2332',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* ── Header ── */}
      <div style={{ padding: '22px 18px 16px', borderBottom: '1px solid #1a2332' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '7px', marginBottom: '4px' }}>
          <span style={{ fontSize: '10px', color: '#3d4f63', fontWeight: 700, fontFamily: 'monospace' }}>
            {p.num}
          </span>
          <span style={{ fontSize: '14px', fontWeight: 800, color: '#f1f5f9', letterSpacing: '0.05em' }}>
            {p.label}
          </span>
        </div>
        <div style={{ fontSize: '11.5px', color: '#94a3b8', marginBottom: '12px', fontWeight: 500 }}>{p.name}</div>

        {/* Color swatches */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
          {swatches.map(s => (
            <div key={s.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <div style={{
                width: '30px', height: '30px', borderRadius: '8px',
                background: s.color,
                border: '1.5px solid rgba(255,255,255,0.08)',
                boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
              }} />
              <span style={{ fontSize: '7px', color: '#3d4f63', fontFamily: 'monospace' }}>{s.label}</span>
            </div>
          ))}
        </div>

        <div style={{ fontSize: '9.5px', color: '#4a5f78', fontStyle: 'italic' }}>{p.tagline}</div>
      </div>

      {/* ── Light Mode ── */}
      <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid #1a2332' }}>
        <div style={{
          fontSize: '9px', fontWeight: 700, letterSpacing: '0.12em',
          color: '#f59e0b', marginBottom: '10px',
          display: 'flex', alignItems: 'center', gap: '5px',
        }}>
          <span>☀</span> LIGHT MODE
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
          <MiniLanding palette={p} dark={false} />
          <MiniDashboard palette={p} dark={false} />
        </div>
      </div>

      {/* ── Dark Mode ── */}
      <div style={{ padding: '14px 18px 22px' }}>
        <div style={{
          fontSize: '9px', fontWeight: 700, letterSpacing: '0.12em',
          color: '#4a5f78', marginBottom: '10px',
          display: 'flex', alignItems: 'center', gap: '5px',
        }}>
          <span>☾</span> DARK MODE
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
          <MiniLanding palette={p} dark={true} />
          <MiniDashboard palette={p} dark={true} />
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ThemePreview() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#070b12',
      fontFamily: 'Inter, system-ui, sans-serif',
      color: '#f1f5f9',
    }}>
      {/* Page header */}
      <div style={{
        padding: '18px 28px',
        borderBottom: '1px solid #1a2332',
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        position: 'sticky',
        top: 0,
        background: '#070b12',
        zIndex: 10,
      }}>
        <Link to="/" style={{
          color: '#4a5f78', textDecoration: 'none', fontSize: '12px',
          display: 'flex', alignItems: 'center', gap: '4px',
          transition: 'color 0.15s',
        }}>
          ← Back to app
        </Link>
        <div style={{ width: '1px', height: '14px', background: '#1a2332' }} />
        <h1 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#f1f5f9' }}>
          Theme Preview
        </h1>
        <span style={{ fontSize: '12px', color: '#3d4f63' }}>·</span>
        <span style={{ fontSize: '12px', color: '#4a5f78' }}>
          4 palette options — nothing changes in the app until you pick one
        </span>

        {/* Legend */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '16px' }}>
          {[
            { symbol: '↻', label: 'btn radius' },
            { symbol: 'T', label: 'type weight' },
            { symbol: '▣', label: 'card style' },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '11px', color: '#3d4f63' }}>{item.symbol}</span>
              <span style={{ fontSize: '10px', color: '#3d4f63' }}>{item.label} varies per palette</span>
            </div>
          ))}
        </div>
      </div>

      {/* Differentiator callouts */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        borderBottom: '1px solid #1a2332',
      }}>
        {[
          { label: 'Buttons', desc: 'Rounded-2xl · Solid orange' },
          { label: 'Buttons', desc: 'Full pill · Tinted secondary' },
          { label: 'Buttons', desc: 'Sharp-4px · Outlined · Uppercase' },
          { label: 'Buttons', desc: 'Rounded-6px · Amber ghost' },
        ].map((d, i) => (
          <div key={i} style={{
            padding: '8px 18px',
            borderRight: i < 3 ? '1px solid #1a2332' : 'none',
            display: 'flex', gap: '8px', alignItems: 'center',
          }}>
            <span style={{ fontSize: '9px', color: '#3d4f63', fontWeight: 600 }}>{d.label}:</span>
            <span style={{ fontSize: '9px', color: '#4a5f78' }}>{d.desc}</span>
          </div>
        ))}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        borderBottom: '1px solid #1a2332',
      }}>
        {[
          { label: 'Cards', desc: 'Flat gray · No shadow' },
          { label: 'Cards', desc: 'White · Blue drop shadow' },
          { label: 'Cards', desc: 'Green-tint · Accent left border' },
          { label: 'Cards', desc: 'Light gray · Thin border' },
        ].map((d, i) => (
          <div key={i} style={{
            padding: '8px 18px',
            borderRight: i < 3 ? '1px solid #1a2332' : 'none',
            display: 'flex', gap: '8px', alignItems: 'center',
          }}>
            <span style={{ fontSize: '9px', color: '#3d4f63', fontWeight: 600 }}>{d.label}:</span>
            <span style={{ fontSize: '9px', color: '#4a5f78' }}>{d.desc}</span>
          </div>
        ))}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        borderBottom: '1px solid #1a2332',
      }}>
        {[
          { label: 'Type', desc: 'Inter 700 · Normal spacing' },
          { label: 'Type', desc: 'Inter 800 · Tight −0.03em' },
          { label: 'Type', desc: 'Inter 900 · Wide +0.01em' },
          { label: 'Type', desc: 'Georgia serif · −0.01em' },
        ].map((d, i) => (
          <div key={i} style={{
            padding: '8px 18px',
            borderRight: i < 3 ? '1px solid #1a2332' : 'none',
            display: 'flex', gap: '8px', alignItems: 'center',
          }}>
            <span style={{ fontSize: '9px', color: '#3d4f63', fontWeight: 600 }}>{d.label}:</span>
            <span style={{ fontSize: '9px', color: '#4a5f78' }}>{d.desc}</span>
          </div>
        ))}
      </div>

      {/* Palette grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        minWidth: '960px',
      }}>
        {PALETTES.map((p, i) => (
          <PaletteColumn key={p.id} palette={p} last={i === PALETTES.length - 1} />
        ))}
      </div>

      {/* Footer */}
      <div style={{
        padding: '20px 28px',
        borderTop: '1px solid #1a2332',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: '12px', color: '#3d4f63' }}>
          Tell me which palette you want and I'll apply it to the full app.
        </span>
        <Link to="/" style={{
          fontSize: '12px', color: '#4a5f78', textDecoration: 'none',
        }}>
          ← Back to CivicLens
        </Link>
      </div>
    </div>
  )
}
