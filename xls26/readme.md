# XLS-26 Parsing Library

This is an implementation of the [XLS-26 Standard](https://github.com/XRPLF/XRPL-Standards/discussions/71).
This package exports one single function called `parse` that converts the string of a `xrp-ledger.toml` file to a JavaScript object.


## Example
Assuming you have a file named `xrp-ledger.toml` in the current working directory. An example file can be found below.

```javascript
import fs from 'fs'
import { parse } from '@xrplkit/xls26'

const tomlString = fs.readFileSync('./xrp-ledger.toml', 'utf-8')
const xls26Data = parse(tomlString)

console.log(xls26Data)
```


### Example File

```toml
[[ISSUERS]]
address = "rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De"
name = "Ripple"
desc = "We're building the Internet of Value."

[[TOKENS]]
issuer = "rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De"
currency = "RLUSD"
name = "Ripple USD"
desc = "Ripple USD (RLUSD) is natively issued on the XRP Ledger and Ethereum blockchains and is enabled with a number of features to ensure strict adherence to compliance standards, flexibility for developers, and security for holders."
icon = "https://ripple.com/assets/rlusd-logo.png"
asset_class = "rwa"
asset_subclass = "stablecoin"

[[TOKENS.URLS]]
url = "https://ripple.com"
type = "website"
title = "Official Website"

[[TOKENS.URLS]]
url = "https://x.com/ripple"
type = "social"
```


### Example Output

```javascript
{
  issuers: [
    {
      address: 'rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De',
      name: 'Ripple',
      desc: "We're building the Internet of Value."
    }
  ],
  tokens: [
    {
      currency: 'RLUSD',
      issuer: 'rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De',
      name: 'Ripple USD',
      desc: 'Ripple USD (RLUSD) is natively issued on the XRP Ledger and Ethereum blockchains and is enabled with a number of features to ensure strict adherence to compliance standards, flexibility for developers, and security for holders.',
      icon: 'https://ripple.com/assets/rlusd-logo.png',
      asset_class: 'rwa',
      asset_subclass: 'stablecoin',
      urls: [
        {
          url: 'https://ripple.com',
          type: 'website',
          title: 'Official Website'
        },
        { url: 'https://x.com/ripple', type: 'social' }
      ]
    }
  ],
  issues: []
}
```