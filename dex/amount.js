import { div, mul, floor } from '@xrplkit/xfl'
import { currencyHexToUTF8, currencyUTF8ToHex } from './currency.js'


export function amountFromRippled(amount, decodeCurrency){
	if(typeof amount === 'string')
		return {
			currency: 'XRP',
			value: div(amount, '1000000')
		}
	
	return {
		currency: decodeCurrency
			? currencyHexToUTF8(amount.currency)
			: amount.currency,
		issuer: amount.issuer,
		value: amount.value
	}
}


export function amountToRippled(amount){
	if(amount.currency === 'XRP')
		return floor(mul(amount.value, '1000000')).toString()
		
	return {
		currency: currencyUTF8ToHex(amount.currency),
		issuer: amount.issuer,
		value: amount.value.toString()
	}
}