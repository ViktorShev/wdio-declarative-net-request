import ChromeExtension from 'crx'
import { build } from 'esbuild'
import fs from 'fs/promises'
import os from 'os'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename__ = fileURLToPath(import.meta.url);
const __dirname__ = path.dirname(__filename__);

const EXTENSION_DIR = path.join(__dirname__, './extension')

export type DeclarativeNetRequestRule = chrome.declarativeNetRequest.Rule
export type DeclarativeNetRequestRules = DeclarativeNetRequestRule[]

async function writeRulesFile (rules: DeclarativeNetRequestRules) {
  const rulesFilePath = path.join(EXTENSION_DIR, 'rules.ts')
  const rulesContent = `export default ${JSON.stringify(rules, null, 2)}`

  await fs.writeFile(rulesFilePath, rulesContent)

  return rulesFilePath
}

async function bundleExtension (rules: DeclarativeNetRequestRules) {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'wdio-dnr-'))
  const rulesFilePath = await writeRulesFile(rules)
  
  await fs.copyFile(
    path.join(EXTENSION_DIR, 'manifest.json'),
    path.join(tmpDir, 'manifest.json')
  )

  const result = await build({
    entryPoints: [
      path.join(EXTENSION_DIR, 'background.js'),
      rulesFilePath
    ],
    bundle: true,
    outdir: tmpDir,
    format: 'iife',
    splitting: false,
    minify: true,
    loader: {
      '.ts': 'ts',
    }
  })

  if (result.errors.length > 0) {
    throw new Error(`Failed to bundle extension: ${result.errors.map(e => e.text).join('\n')}`)
  }

  return tmpDir
}

async function packExtension (bundledExtensionDir: string) {
  const crx = new ChromeExtension()
  await crx.load(bundledExtensionDir)
  const crxBuffer = await crx.pack()
  const extensionBase64 = crxBuffer.toString('base64')

  return extensionBase64
}

export async function getDnrExtensionBase64 (
  rules: DeclarativeNetRequestRules
): Promise<string> {
  const bundledExtensionDir = await bundleExtension(rules)
  const extensionBase64 = await packExtension(bundledExtensionDir)

  return extensionBase64
}
