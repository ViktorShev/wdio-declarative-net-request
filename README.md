# wdio-declarative-net-request

A WebdriverIO utility allowing the use of Chrome's declarativeNetRequest API by dynamically generating an extension at runtime from user-defined rules.

# Example usage:

```
// wdio.conf.ts

import { ALL_RESOURCE_TYPES, DeclarativeNetRequestRules, getDnrExtensionBase64 } from "wdio-declarative-net-request"

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
      resourceTypes: ALL_RESOURCE_TYPES,
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