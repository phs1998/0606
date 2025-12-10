import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // 蒸汽波主题颜色
        'vapor-pink': 'var(--vapor-pink)',
        'vapor-pink-bright': 'var(--vapor-pink-bright)',
        'vapor-pink-dim': 'var(--vapor-pink-dim)',
        'vapor-cyan': 'var(--vapor-cyan)',
        'vapor-cyan-bright': 'var(--vapor-cyan-bright)',
        'vapor-cyan-dim': 'var(--vapor-cyan-dim)',
        'vapor-purple': 'var(--vapor-purple)',
        'vapor-purple-bright': 'var(--vapor-purple-bright)',
        'vapor-purple-dim': 'var(--vapor-purple-dim)',
        'vapor-blue': 'var(--vapor-blue)',
        'vapor-blue-bright': 'var(--vapor-blue-bright)',
        'vapor-blue-dim': 'var(--vapor-blue-dim)',
        'vapor-neon-green': 'var(--vapor-neon-green)',
        'vapor-neon-yellow': 'var(--vapor-neon-yellow)',
        'vapor-neon-orange': 'var(--vapor-neon-orange)',
        'retro-bg-dark': 'var(--retro-bg-dark)',
        'retro-bg-darker': 'var(--retro-bg-darker)',
        'retro-bg-light': 'var(--retro-bg-light)',
      },
      backgroundImage: {
        'vapor-gradient-pink-purple': 'var(--vapor-gradient-pink-purple)',
        'vapor-gradient-cyan-blue': 'var(--vapor-gradient-cyan-blue)',
        'vapor-gradient-rainbow': 'var(--vapor-gradient-rainbow)',
        'vapor-grid': 'var(--grid-bg)',
        'vapor-grid-dense': 'var(--grid-bg-dense)',
        'vapor-scanlines': 'var(--scanlines)',
      },
      boxShadow: {
        'vapor-glow-pink': 'var(--glow-pink)',
        'vapor-glow-cyan': 'var(--glow-cyan)',
        'vapor-glow-purple': 'var(--glow-purple)',
        'vapor-glow-rainbow': 'var(--glow-rainbow)',
        'vapor-neon-pink': 'var(--shadow-neon-pink)',
        'vapor-neon-cyan': 'var(--shadow-neon-cyan)',
        'vapor-neon-purple': 'var(--shadow-neon-purple)',
      },
      backdropBlur: {
        'vapor-glass': 'var(--glass-blur)',
        'vapor-frosted': 'var(--frosted-blur)',
      },
      animation: {
        'neon-flicker': 'neon-flicker 3s infinite',
        'gradient-flow': 'gradient-flow 5s ease infinite',
        'vhs-glitch': 'vhs-glitch 0.3s infinite',
        'scanline-move': 'scanline-move 0.1s linear infinite',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        'rainbow-gradient': 'rainbow-gradient 3s linear infinite',
      },
      keyframes: {
        'neon-flicker': {
          '0%, 100%': { opacity: '1' },
          '41.99%': { opacity: '1' },
          '42%': { opacity: '0.8' },
          '43%': { opacity: '1' },
          '45.99%': { opacity: '1' },
          '46%': { opacity: '0.9' },
          '46.5%': { opacity: '1' },
          '47.99%': { opacity: '1' },
          '48%': { opacity: '0.7' },
          '48.5%': { opacity: '1' },
        },
        'gradient-flow': {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        'vhs-glitch': {
          '0%': { transform: 'translate(0)' },
          '20%': { transform: 'translate(-2px, 2px)' },
          '40%': { transform: 'translate(-2px, -2px)' },
          '60%': { transform: 'translate(2px, 2px)' },
          '80%': { transform: 'translate(2px, -2px)' },
          '100%': { transform: 'translate(0)' },
        },
        'scanline-move': {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(4px)' },
        },
        'glow-pulse': {
          '0%, 100%': { 
            boxShadow: 'var(--glow-pink)',
            opacity: '1',
          },
          '50%': { 
            boxShadow: 'var(--glow-cyan)',
            opacity: '0.8',
          },
        },
        'rainbow-gradient': {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '200% 50%' },
        },
      },
    },
  },
  plugins: [],
}
export default config

