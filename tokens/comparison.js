import { currencyUTF8ToHex } from './currency.js'

export function isSameToken(a, b){
	if(typeof a === 'string')
		a = {currency: 'XRP'}
	else if(a.mpt_issuance_id)
		a = { mpt_issuance_id: a.mpt_issuance_id }
	else
		a = {
			currency: currencyUTF8ToHex(a.currency),
			issuer: a.issuer || a.account
		}

	if(typeof b === 'string')
		b = {currency: 'XRP'}
	else if(b.mpt_issuance_id)
		b = { mpt_issuance_id: b.mpt_issuance_id }
	else
		b = {
			currency: currencyUTF8ToHex(b.currency),
			issuer: b.issuer || a.account
		}

	if(a.mpt_issuance_id || b.mpt_issuance_id)
		return a.mpt_issuance_id === b.mpt_issuance_id

	return true
		&& a.currency === b.currency
		&& a.issuer == b.issuer
}