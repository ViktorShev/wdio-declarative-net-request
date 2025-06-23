import ChromeExtension from 'crx'
import fsSync from 'fs'
import fs from 'fs/promises'
import os from 'os'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename__ = fileURLToPath(import.meta.url);
const __dirname__ = path.dirname(__filename__);

const EXTENSION_DIR = path.join(__dirname__, './extension')

export type DeclarativeNetRequestRule = chrome.declarativeNetRequest.Rule
export type DeclarativeNetRequestRules = DeclarativeNetRequestRule[]

async function writeRulesFile (rules: DeclarativeNetRequestRules, baseDir: string) {
  const rulesFilePath = path.join(baseDir, 'rules.json')
  const rulesContent = JSON.stringify(rules, null, 2)

  await fs.writeFile(rulesFilePath, rulesContent)

  return rulesFilePath
}

function writeRulesFileSync (rules: DeclarativeNetRequestRules, baseDir: string): string {
  const rulesFilePath = path.join(baseDir, 'rules.json')
  const rulesContent = JSON.stringify(rules, null, 2)

  fsSync.writeFileSync(rulesFilePath, rulesContent)
  
  return rulesFilePath
}

async function bundleExtension (rules: DeclarativeNetRequestRules) {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'wdio-dnr-'))

  await fs.copyFile(
    path.join(EXTENSION_DIR, 'manifest.json'),
    path.join(tmpDir, 'manifest.json')
  )

  await writeRulesFile(rules, tmpDir)

  return tmpDir
}

function bundleExtensionSync (rules: DeclarativeNetRequestRules): string {
  const tmpDir = fsSync.mkdtempSync(path.join(os.tmpdir(), 'wdio-dnr-'))

  fsSync.copyFileSync(
    path.join(EXTENSION_DIR, 'manifest.json'),
    path.join(tmpDir, 'manifest.json')
  )

  writeRulesFileSync(rules, tmpDir)

  return tmpDir
}

async function packExtension (bundledExtensionDir: string) {
  const crx = new ChromeExtension({
    privateKey: await fs.readFile(path.join(EXTENSION_DIR, 'dummy-dev-key.pem'))
  })

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

export function getUnpackedDnrExtensionPathSync (rules: DeclarativeNetRequestRules): string {
  const bundledExtensionDir = bundleExtensionSync(rules)

  return bundledExtensionDir
}