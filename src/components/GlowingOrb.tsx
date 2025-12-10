'use client'

export default function GlowingOrb() {

  return (
    <div className="flex items-center justify-center" style={{
      position: 'relative',
      width: '100%',
      marginTop: '8rem',
      zIndex: 15,
    }}>
      {/* Glowing Orb */}
      <div style={{
        position: 'relative',
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, #ff9ff3 0%, #f368e0 30%, #ff6b9d 60%, #c44569 100%)',
        boxShadow: `
          0 0 20px rgba(255, 159, 243, 0.8),
          0 0 40px rgba(243, 104, 224, 0.6),
          0 0 60px rgba(255, 107, 157, 0.4),
          inset 0 0 20px rgba(255, 255, 255, 0.3)
        `,
        animation: 'orbPulse 2s ease-in-out infinite',
        imageRendering: 'pixelated',
      }}>
        {/* Inner glow */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, #ffffff 0%, rgba(255, 255, 255, 0) 70%)',
          opacity: 0.6,
        }} />
      </div>

      <style jsx>{`
        @keyframes orbPulse {
          0%, 100% {
            transform: scale(1);
            box-shadow: 
              0 0 20px rgba(255, 159, 243, 0.8),
              0 0 40px rgba(243, 104, 224, 0.6),
              0 0 60px rgba(255, 107, 157, 0.4),
              inset 0 0 20px rgba(255, 255, 255, 0.3);
          }
          50% {
            transform: scale(1.1);
            box-shadow: 
              0 0 30px rgba(255, 159, 243, 1),
              0 0 60px rgba(243, 104, 224, 0.8),
              0 0 90px rgba(255, 107, 157, 0.6),
              inset 0 0 25px rgba(255, 255, 255, 0.4);
          }
        }
      `}</style>
    </div>
  )
}

