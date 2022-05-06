export function decodeCurrencyCode(code, representation = 'utf-8'){
	if(representation === 'utf-8'){
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
}


export function encodeCurrencyCode(code, representation = 'hex'){
	if(representation === 'hex'){
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
	}else if(representation === 'binary'){
		if(code.length === 3){
			let bytes = Buffer.alloc(20)

			if (code !== 'XRP'){
				bytes.set(
					code.split('').map((c) => c.charCodeAt(0)), 
					12
				)
			}

			return bytes
		}else{
			return Buffer.from(code, 'hex')
		}
	}
}
