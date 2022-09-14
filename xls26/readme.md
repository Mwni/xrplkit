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
address = "rHXuEaRYnnJHbDeuBH5w8yPh5uwNVh5zAg"
name = "Aesthetes"

[[ISSUERS.WEBLINKS]]
url = "https://aesthetes.art"
type = "info"
title = "Official Website"

[[ISSUERS.WEBLINKS]]
url = "https://twitter.com/aesthetes_art"
type = "socialmedia"

[[TOKENS]]
issuer = "rHXuEaRYnnJHbDeuBH5w8yPh5uwNVh5zAg"
currency = "ELS"
name = "Elysian"
desc = "The first Token for the Art and NFT Industry running on the XRPL."
icon = "https://static.xrplmeta.org/icons/els.png"

[[TOKENS.WEBLINKS]]
url = "https://twitter.com/Elysianers"
type = "community"
```


### Example Output

```javascript
{
    issuers: [
        {
            address: 'rHXuEaRYnnJHbDeuBH5w8yPh5uwNVh5zAg',
            name: 'Aesthetes',
            weblinks: [
                {
                    url: 'https://aesthetes.art',
                    type: 'info',
                    title: 'Official Website'
                },
                {
                    url: 'https://twitter.com/aesthetes_art', 
                    type: 'socialmedia' 
                }
            ]
        }
    ],
    tokens: [
        {
            currency: 'ELS',
            issuer: 'rHXuEaRYnnJHbDeuBH5w8yPh5uwNVh5zAg',
            name: 'Elysian',
            desc: 'The first Token for the Art and NFT Industry running on the XRPL.',
            icon: 'https://static.xrplmeta.org/icons/els.png',
            weblinks: [
                {
                    url: 'https://twitter.com/Elysianers', 
                    type: 'community' 
                }
            ]
        }
    ],
    issues: []
}

```