# wdio-declarative-net-request [![npm version](https://img.shields.io/npm/v/wdio-declarative-net-request.svg)](https://www.npmjs.com/package/wdio-declarative-net-request)

A WebdriverIO utility allowing the use of Chrome's declarativeNetRequest API by dynamically generating an extension at runtime from user-defined rules.

# Example usage:

```ts
// wdio.conf.ts

import { DeclarativeNetRequestRules, getDnrExtensionBase64 } from 'wdio-declarative-net-request'

const rules: DeclarativeNetRequestRules = [
  {
    id: 1,
    priority: 1,
    action: {
      type: 'modifyHeaders',
      requestHeaders: [
        {
          operation: 'set',
          header: 'X-Custom-Header',
          value: 'true',
        },
      ]
    },
    condition: {
      resourceTypes: ['xmlhttprequest'],
    }
  }
]

const extension = await getDnrExtensionBase64(rules)

export const config = {
  runner: 'local',
  framework: 'mocha',
  capabilities: [{
    browserName: 'chrome',
    browserVersion: 'stable',
    acceptInsecureCerts: true,
    'goog:chromeOptions': {
      args: [
        '--no-cache',
        '--no-sandbox',
        '--disable-gpu',
        '--disable-infobars',
        '--ignore-certificate-errors',
      ],
      extensions: [extension]
    },
  }]
},
```

If you are unable to use top-level await due to CJS or any other reason you can use the sync method `getUnpackedDnrExtensionPathSync`.
This will bundle the necessary extension files synchronously but will skip packing it into a `.crx` file and encoding it into base64.
Instead it will return the path to the directory that contains the extension, which you can load into WebdriverIO like so:

```ts
// wdio.conf.ts

const extensionDir = getUnpackedDnrExtensionPathSync(rules)

...
    'goog:chromeOptions': {
      args: [
        '--no-cache',
        '--no-sandbox',
        '--disable-gpu',
        '--disable-infobars',
        '--ignore-certificate-errors',
        '--load-extension=' + extensionDir, // <--- Load extension by path
      ],
    }
...
```