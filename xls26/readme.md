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
address = "rCSCManTZ8ME9EoLrSHHYKW8PPwWMgkwr"
name = "CasinoCoin"

[[TOKENS]]
issuer = "rCSCManTZ8ME9EoLrSHHYKW8PPwWMgkwr"
currency = "CSC"
name = "CasinoCoin"
desc = "CasinoCoin (CSC) is a digital currency, developed specifically for the regulated gaming industry."
icon = "https://static.xrplmeta.org/icons/csc.png"

[[TOKENS.WEBLINKS]]
url = "https://casinocoin.im"
type = "website"
title = "Official Website"

[[TOKENS.WEBLINKS]]
url = "https://twitter.com/CasinoCoin"
type = "socialmedia"
```


### Example Output

```javascript
{
    issuers: [
        {
            address: 'rCSCManTZ8ME9EoLrSHHYKW8PPwWMgkwr',
            name: 'CasinoCoin'
        }
    ],
    tokens: [
        {
            currency: 'CSC',
            issuer: 'rCSCManTZ8ME9EoLrSHHYKW8PPwWMgkwr',
            name: 'CasinoCoin',
            desc: 'CasinoCoin (CSC) is a digital currency, developed specifically for the regulated gaming industry.',
            icon: 'https://static.xrplmeta.org/icons/csc.png',
            weblinks: [
                {
                    url: 'https://casinocoin.im',
                    type: 'website',
                    title: 'Official Website'
                },
                {
                    url: 'https://twitter.com/CasinoCoin', 
                    type: 'socialmedia' 
                }
            ]
        }
    ],
    issues: []
}

```