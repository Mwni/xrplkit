
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

export function decode(code){
	if(code.length === 3 || !/^[A-Z0-9]{40}$/.test(code))
		return code

	let bytes = new Uint8Array(code.length / 2)

	for (let i = 0; i !== code.length; i++){
		bytes[i] = parseInt(code.substr(i * 2, 2), 16)
	}

	let decoded = new TextDecoder().decode(bytes)
	let tail = decoded.length

	while(decoded.charAt(tail-1) === '\0')
		tail--

	return decoded.slice(0, tail)
}


export function encode(code){
	if(/^[a-zA-Z0-9\?\!\@\#\$\%\^\&\*\<\>\(\)\{\}\[\]\|\]\{\}]{3}$/.test(code))
		return code

	if(/^[A-Z0-9]{40}$/.test(code))
		return code

	let hex = ''

	for(let i=0; i<code.length; i++){
		hex += code.charCodeAt(i).toString(16)
	}

	return hex
		.toUpperCase()
		.padEnd(40, '0')
}
