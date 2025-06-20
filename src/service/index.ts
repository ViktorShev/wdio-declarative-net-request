import resolve from '@rollup/plugin-node-resolve'
import terser from '@rollup/plugin-terser'
import typescript from '@rollup/plugin-typescript'
import type { Capabilities, Options, Services } from '@wdio/types'
import abind from 'abind'
import Crx from 'crx'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'path'
import { rollup } from 'rollup'
import copy from 'rollup-plugin-copy'

export interface DeclarativeNetRequestExtensionServiceOptions {
  rules: chrome.declarativeNetRequest.Rule[],
  usingMultiremoteCapabilities?: boolean
  instanceNamesToAddExtensionTo?: string[]
}

export default class DeclarativeNetRequestExtensionService implements Services.ServiceInstance {
  constructor (
    public options: DeclarativeNetRequestExtensionServiceOptions,
    public capabilities: Capabilities.ResolvedTestrunnerCapabilities,
    public config: Options.WebdriverIO
  ) {
    abind(this)
    
    if (!options.rules || !Array.isArray(options.rules)) {
      throw new Error('DeclarativeNetRequestExtensionService requires a "rules" option which is an array of declarative net request rules')
    }
  }

  private extensionBase64: string = ''
  private readonly _EXTENSION_DIR: string = path.join(__dirname, '../extension')

  private async _makeRulesFile (rules: chrome.declarativeNetRequest.Rule[]) {
    const rulesFilePath = path.join(this._EXTENSION_DIR, 'rules.ts')
    const rulesContent = `export default ${JSON.stringify(rules, null, 2)}`
    await fs.writeFile(rulesFilePath, rulesContent)

    return rulesFilePath
  }

  private async _bundleExtension () {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'wdio-declarative-net-request-'))
    const rulesFile = await this._makeRulesFile(this.options.rules)

    const bundle = await rollup({
      input: {
        background: path.join(this._EXTENSION_DIR, 'background.ts'),
        rules: rulesFile
      },
      plugins: [
        typescript({tsconfig: path.join(__dirname, '../tsconfig.json')}),
        resolve(),
        terser(),
        copy({
          targets: [
            { src: path.join(this._EXTENSION_DIR, 'manifest.json'), dest: tmpDir },
          ]
        })
      ]
    })

    await bundle.write({
      dir: tmpDir,
      format: 'iife',
      entryFileNames: '[name].js'
    })
    
    await bundle.close()

    return tmpDir
  }

  private async _packExtension (bundledExtensionDir: string) {
    const crx = new Crx()
    await crx.load(bundledExtensionDir)
    const crxBuffer = await crx.pack()
    const extensionBase64 = crxBuffer.toString('base64')

    this.extensionBase64 = extensionBase64
  }

  private _addExtensionToCapability (capability: WebdriverIO.Capabilities) {
    if (capability.browserName?.toLowerCase() !== 'chrome') return

    const originalOptions = capability['goog:chromeOptions'] ?? {}
    const options: Capabilities.ChromeOptions = {
      ...originalOptions,
      extensions: [
        ...(originalOptions.extensions ?? []),
        this.extensionBase64
      ]
    }

    capability['goog:chromeOptions'] = options
  }

  // TODO: Support multiremote capabilities and the different WDIO config shapes.
  private _addExtensionToCapabilities (capabilities: Capabilities.TestrunnerCapabilities) {
    // @ts-expect-error
    for (const cap of capabilities) {
      this._addExtensionToCapability(cap)
    }
  }

  async onPrepare (
    _config: Options.Testrunner, 
    capabilities: Capabilities.TestrunnerCapabilities
  ) {
    const bundledExtensionDir = await this._bundleExtension()

    await this._packExtension(bundledExtensionDir)
    await this._addExtensionToCapabilities(capabilities)
  }
}
