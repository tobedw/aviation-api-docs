// Pre-renders the Scalar API reference into static HTML so crawlers and LLM
// bots see endpoints, parameters and examples without executing JavaScript.
// The client bundle (scalar.js) then hydrates the page for interactivity.
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises'
import { parse } from 'yaml'
import { getJsAsset, renderApiReference } from '@scalar/server-side-rendering'

const content = parse(await readFile('openapi.yaml', 'utf8'))

const html = await renderApiReference({
  pageTitle: 'Logostream Aviation API',
  // `servers` come from openapi.yaml (absolute URLs), so "Try it" calls the
  // real APIs instead of this static host.
  config: { content, theme: 'default' },
  cdn: './scalar.js',
})

await mkdir('dist', { recursive: true })
await writeFile('dist/index.html', html)
await writeFile('dist/scalar.js', getJsAsset())
// Keep the raw spec public at /openapi.yaml (linked from llms.txt and
// <link rel="service-desc"> on airline.logostream.dev).
await copyFile('openapi.yaml', 'dist/openapi.yaml')

console.log(`dist/index.html ${(html.length / 1024).toFixed(0)} KB`)
