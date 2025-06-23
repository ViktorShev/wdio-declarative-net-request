import ChromeExtension from 'crx'
import { build } from 'esbuild'
import fs from 'fs/promises'
import os from 'os'
import path from 'path'

const EXTENSION_DIR = path.join(__dirname, './extension')

export type DeclarativeNetRequestRules = chrome.declarativeNetRequest.Rule[]

async function writeRulesFile (rules: DeclarativeNetRequestRules) {
  const rulesFilePath = path.join(EXTENSION_DIR, 'rules.ts')
  const rulesContent = `export default ${JSON.stringify(rules, null, 2)}`

  await fs.writeFile(rulesFilePath, rulesContent)

  return rulesFilePath
}

async function bundleExtension (rules: DeclarativeNetRequestRules) {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'wdio-dnr-'))
  const rulesFilePath = await writeRulesFile(rules)

  const result = await build({
    entryPoints: [
      path.join(EXTENSION_DIR, 'background.ts'),
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
