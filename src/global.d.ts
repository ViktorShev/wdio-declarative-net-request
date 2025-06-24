declare module 'crx' {
  interface CrxOptions {
    appId?: string | null,
    rootDirectory?: string | null,
    publicKey?: Buffer | string | null,
    privateKey?: Buffer | string | null,
    codebase?: string | null,
    path?: string | null,
    src?: string | null,
    version?: number | null,
  }
  
  export default class Crx {
    constructor(options?: CrxOptions)
    load(path: string): Promise<void>
    pack(): Promise<Buffer>
  }
}
