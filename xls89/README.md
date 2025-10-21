# XLS-89 Parsing Library

This is a parser for [XLS-89 Standard](https://github.com/XRPLF/XRPL-Standards/tree/master/XLS-0089-multi-purpose-token-metadata-schema).

This package exports one single function called `parse` that converts the hex-encoded Multi-Purpose token metadata schema (`MPTokenMetadata` property of `MPTokenIssuance` ledger object) to a JavaScript object.

  
## Example

Assuming you have a file named `xrp-ledger.toml` in the current working directory. An example file can be found below.

```javascript
import { parse } from  '@xrplkit/xls89'

const  hexMetadata = '7B0A20202274223A20225442494C4C222C0A2020226E223A2022542D42696C6C205969656C6420546F6B656E222C0A20202264223A202241207969656C642D62656172696E6720737461626C65636F696E206261636B65642062792073686F72742D7465726D20552E532E205472656173757269657320616E64206D6F6E6579206D61726B657420696E737472756D656E74732E222C0A20202269223A20226578616D706C652E6F72672F7462696C6C2D69636F6E2E706E67222C0A2020226163223A2022727761222C0A2020226173223A20227472656173757279222C0A202022696E223A20224578616D706C65205969656C6420436F2E222C0A2020227573223A205B0A202020207B0A2020202020202275223A20226578616D706C657969656C642E636F2F7462696C6C222C0A2020202020202263223A202277656273697465222C0A2020202020202274223A202250726F647563742050616765220A202020207D2C0A202020207B0A2020202020202275223A20226578616D706C657969656C642E636F2F646F6373222C0A2020202020202263223A2022646F6373222C0A2020202020202274223A20225969656C6420546F6B656E20446F6373220A202020207D0A20205D2C0A2020226169223A207B0A2020202022696E7465726573745F72617465223A2022352E303025222C0A2020202022696E7465726573745F74797065223A20227661726961626C65222C0A20202020227969656C645F736F75726365223A2022552E532E2054726561737572792042696C6C73222C0A20202020226D617475726974795F64617465223A2022323034352D30362D3330222C0A20202020226375736970223A2022393132373936525830220A20207D0A7D'

const  xls89Data = parse(hexMetadata)

console.log(xls89Data)
```

### Example Output

  

```javascript
{
  "token": {
    "ticker": "TBILL",
    "name": "T-Bill Yield Token",
    "desc": "A yield-bearing stablecoin backed by short-term U.S. Treasuries and money market instruments.",
    "icon": "https://example.org/tbill-icon.png",
    "asset_class": "rwa",
    "asset_subclass": "treasury",
    "issuer_name": "Example Yield Co.",
    "uris": [
      {
        "uri": "https://exampleyield.co/tbill",
        "category": "website",
        "title": "Product Page"
      },
      {
        "uri": "https://exampleyield.co/docs",
        "category": "docs",
        "title": "Yield Token Docs"
      }
    ],
    "additional_info": {
      "interest_rate": "5.00%",
      "interest_type": "variable",
      "yield_source": "U.S. Treasury Bills",
      "maturity_date": "2045-06-30",
      "cusip": "912796RX0"
    }
  },
  "issues": []
}
```