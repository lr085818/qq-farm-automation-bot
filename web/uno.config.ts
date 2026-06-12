import { defineConfig, presetAttributify, presetIcons, presetUno } from 'unocss'

export default defineConfig({
  safelist: [
    'i-carbon-chart-pie',
    'i-carbon-user',
    'i-fas-paw',
    'i-carbon-user-multiple',
    'i-carbon-store',
    'i-carbon-notebook',
    'i-carbon-analytics',
    'i-carbon-settings',
    'i-carbon-settings-adjust',
    'i-carbon-restaurant',
    'i-carbon-list',
    'i-carbon-box',
    'i-carbon-document',
    'i-carbon-gift',
    'i-carbon-sprout',
    'i-carbon-chemistry',
  ],
  content: {
    pipeline: {
      include: [
        /\.(vue|svelte|[jt]sx|mdx?|astro|elm|php|phtml|html)($|\?)/,
        'src/**/*.{js,ts}',
      ],
    },
  },
  presets: [
    presetUno(),
    presetAttributify(),
    presetIcons({
      scale: 1.2,
      warn: true,
      collections: {
        carbon: () => import('@iconify-json/carbon/icons.json').then(i => i.default),
        fas: () => import('@iconify-json/fa-solid/icons.json').then(i => i.default),
        'svg-spinners': () => import('@iconify-json/svg-spinners/icons.json').then(i => i.default),
      },
    }),
  ],
})
