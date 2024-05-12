import { currencyUTF8ToHex } from './currency.js'

export function isSameToken(a, b){
	if(typeof a === 'string')
		a = {currency: 'XRP'}
	else
		a = {
			currency: currencyUTF8ToHex(a.currency), 
			issuer: a.issuer || a.account
		}

	if(typeof b === 'string')
		b = {currency: 'XRP'}
	else
		b = {
			currency: currencyUTF8ToHex(b.currency), 
			issuer: b.issuer || a.account
		}

	return true
		&& a.currency === b.currency
		&& a.issuer == b.issuer
}