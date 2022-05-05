# XLS-26 Parsing Library

This is an implementation of the [XLS-26 Standard](https://github.com/XRPLF/XRPL-Standards/discussions/71).
This package exports one single function called `parse` that converts a string of a `xrp-ledger.toml` file to a JavaScript object.

## Example
Assuming you have a file named `xrp-ledger.toml` in the current working directory. [Example File here](http://xrpl.works/.well-known/xrp-ledger.toml)

    import fs from 'fs'
    import { parse } from '@xrplkit/xls26'
    
    const tomlString = fs.readFileSync('./xrp-ledger.toml', 'utf-8')
    const xls26Data = parse(tomlString)
    
    console.log(xls26Data)

### Example Input

    [[ACCOUNTS]]
    address = "rxworksy7717V3w1nSQhUpaGNqydGYCaS"
    name = "XRPL Works"
    websites = ["https://xrpl.works"]
    description = "XRPL Works is a non-profit organization. Our goal is to simplify the ledger."
    
    [[CURRENCIES]]
    code = "58574F524B530000000000000000000000000000"
    issuer = "rxworksy7717V3w1nSQhUpaGNqydGYCaS"
    name = "XWORKS"
    icon = "https://xrpl.works/token/icon.png"
    description = "This token serves the purpose of demonstrating the benefits of the XLS-26 standard."
  

### Example Output

```
{
	"accounts": [
		{
			"address": "rxworksy7717V3w1nSQhUpaGNqydGYCaS",
			"name": "XRPL Works",
			"description": "XRPL Works is a non-profit organization. Our goal is to simplify the ledger."
		}
	],
	"currencies": [
		{
			"code": "58574F524B530000000000000000000000000000",
			"issuer": "rxworksy7717V3w1nSQhUpaGNqydGYCaS",
			"name": "XWORKS",
			"description": "This token serves the purpose of demonstrating the benefits of the XLS-26 standard.",
			"icon": "https://xrpl.works/token/icon.png"
		}
	]
}

```