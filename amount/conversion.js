import Decimal from 'decimal.js'
import { decode, encode } from '@xrplkit/currency'


export function fromRippled(amount, decodeCurrency){
	if(typeof amount === 'string')
		return {
			currency: 'XRP',
			value: Decimal.div(amount, '1000000')
				.toString()
		}
	
	return {
		currency: decodeCurrency
			? decode(amount.currency)
			: amount.currency,
		issuer: amount.issuer,
		value: amount.value
	}
}


export function toRippled(amount){
	if(amount.currency === 'XRP')
		return Decimal.mul(amount.value, '1000000')
			.round()
			.toString()
	return {
		currency: encode(amount.currency),
		issuer: amount.issuer,
		value: amount.value.toString()
	}
}