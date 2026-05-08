const { copyFileSync } = require('fs')
const { resolve } = require('path')

const src = resolve(__dirname, '../node_modules/maplibre-gl/dist/maplibre-gl-csp-worker.js')
const dst = resolve(__dirname, '../public/maplibre-gl-csp-worker.js')
copyFileSync(src, dst)
