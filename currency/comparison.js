
export function compare(a, b){
	if(typeof a === 'string')
		a = {currency: 'XRP'}
	else
		a = {
			currency: encode(a.currency), 
			issuer: a.issuer
		}

	if(typeof b === 'string')
		b = {currency: 'XRP'}
	else
		b = {
			currency: encode(b.currency), 
			issuer: b.issuer
		}

	return true
		&& a.currency === b.currency
		&& a.issuer == b.issuer
}