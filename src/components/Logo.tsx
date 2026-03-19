import logoIcon from '../assets/estadia-icon.svg'

interface Props {
  dark?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const sizes = {
  sm: { fontSize: '1.1rem', pinW: 11, pinH: 15 },
  md: { fontSize: '1.4rem', pinW: 13, pinH: 17 },
  lg: { fontSize: '1.7rem', pinW: 15, pinH: 20 },
}

export default function Logo({ dark = false, size = 'md' }: Props) {
  const { pinW, pinH } = sizes[size]
  const textColor = dark ? '#FFFFFF' : '#1B2B3A'
  const pinHole  = dark ? '#1E3E50' : '#fff'
  const iconSize = size === 'sm' ? 32 : size === 'md' ? 38 : 46

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
      {/* Grid de puntos */}
      <img src={logoIcon} alt="" style={{ width: iconSize, height: iconSize, flexShrink: 0 }} />

      {/* Wordmark con pin sobre la i */}
      <div style={{
        display: 'inline-flex',
        alignItems: 'flex-end',
        fontFamily: "'Sora', sans-serif",
        fontWeight: 300,
        fontSize: 22,
        letterSpacing: '0.05em',
        color: textColor,
        lineHeight: 1,
      }}>
        <span>estad</span>
        <span style={{ display:'inline-flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end' }}>
          <svg width={pinW} height={pinH} viewBox="0 0 24 32" fill="none" style={{ marginBottom: -8.5 }}>
            <path d="M12 0C7.6 0 4 3.6 4 8C4 14 12 24 12 24C12 24 20 14 20 8C20 3.6 16.4 0 12 0Z" fill="#C4693A"/>
            <circle cx="12" cy="8.5" r="4" fill={pinHole}/>
          </svg>
          <span style={{ color: '#C4693A', lineHeight: 1 }}>i</span>
        </span>
        <span>a</span>
      </div>
    </div>
  )
}
