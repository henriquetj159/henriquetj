import type { Config } from 'tailwindcss'
import baseConfig from '@ciclo/config/tailwind/base'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
  presets: [baseConfig as Config],
  plugins: [],
}

export default config
