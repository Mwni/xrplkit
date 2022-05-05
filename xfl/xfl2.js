const minMantissa = 1000000000000000n
const maxMantissa = 9999999999999999n
const minExponent = -96n
const maxExponent = 80n


class XFL extends BigInt{
	static #fromString(str){
		let mantissa
		let exponent
		let negative = false
		let point = str.indexOf('.')

		if(str.charAt(0) === '-'){
			str = str.slice(1)
			negative = true
			point--
		}


		if(point > 0){
			console.log(str.slice(0, point) + '/' + str.slice(point+1), point)
			mantissa = BigInt(str.slice(0, point) + str.slice(point + 1))
			exponent = BigInt(point - str.length + 1)
		}else{
			mantissa = BigInt(str)
			exponent = BigInt(0)
		}
		

		console.log('in', exponent, mantissa)

		if(mantissa === 0n)
			return 0n
		
		while (mantissa > maxMantissa){
			mantissa /= 10n
			exponent++
		}

		while (mantissa < minMantissa){
			mantissa *= 10n
			exponent--
		}

		if(mantissa === 0n)
			return 0n

		if (exponent > maxExponent || exponent < minExponent)
			throw new Error(`invalid XFL (overflow)`)

		let serialized = (negative ? 1n : 0n)
	
		serialized <<= 8n
		serialized |= exponent - minExponent + 1n
		serialized <<= 54n
		serialized |= mantissa

		return serialized
	}

	static #fromBigInt(value){
		return value
	}

	constructor(value){
		if(typeof value === 'number')
			value = XFL.#fromString(value.toString())
		else if(typeof value === 'string')
			value = XFL.#fromString(value)
		else if(typeof value === 'bigint')
			value = XFL.#fromBigInt(value)
		else if(value instanceof XFL)
			return value
		else
			throw new Error(`invalid XFL (${typeof value})`)
		

		return Object.setPrototypeOf(
			Object(value), 
			XFL.prototype
		)
	}

	valueOf(){
		let value = super.valueOf()

		if (value == 0n)
			return 0n

		let str = this.mantissa
			.toString()
			.padEnd(Number(this.exponent - minExponent), '0')
		
		if(this.negative)
			str = `-${str}`

		return BigInt(str)
	}

	toString(){
		let mantissa = this.mantissa
		let exponent = this.exponent
		let negative = this.negative

		let str = mantissa.toString()
		let point = Number(exponent - minExponent - maxExponent)

		if(point <= 0){
			str = `0.`.padEnd(-point, '0') + str
		}else if(point >= str.length){
			str = str.padEnd(point - str.length, '0')
		}else{
			str = str.slice(0, point) + '.' + str.slice(point)
		}

		console.log('str exp', exponent, point)

		return str.replace(/\.0+$/, '')
	}

	/*toString(){
		let str = this.valueOf().toString()

		console.log(str.length, -minExponent)

		if(str.length > -minExponent)
			str = str.slice(0, -minExponent) + '.' + str.slice(-minExponent)

		return str.replace(/0+$/, '')
	}*/

	get mantissa(){
		return super.valueOf() - ((super.valueOf() >> 54n)<< 54n)
	}

	get exponent(){
		return ((super.valueOf() >> 54n) & 0xFFn) + minExponent - 1n
	}

	get negative(){
		return ((super.valueOf() >> 62n) & 1n) == 1n
	}

	get [Symbol.toStringTag]() {
		return this.toString()
	}
}



let x = new XFL(2)
let z = new XFL(123)
let y = new XFL(123.456789)

console.log('---')

console.log(x)
console.log(z)
console.log(y)
console.log(x * z)
//console.log(x, new XFL(x * b).toString(), `${x}`)