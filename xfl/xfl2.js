const minMantissa = 1000000000000000n
const maxMantissa = 9999999999999999n
const minExponent = -96n
const maxExponent = 80n


class XFL extends BigInt{
	static #create(value){
		return Object.setPrototypeOf(
			Object(BigInt(value)), 
			XFL.prototype
		)
	}

	constructor(value){
		if(typeof value === 'number')
			value = value.toString()

		if(typeof value === 'string'){
			let negative = 1
			let e = value.indexOf('.')

			if(value.charAt(0) === '-'){
				negative = true
				e--
			}

			if(e > 0)
				e = value.length - e
			else
				e = value.length

			let mantissa = BigInt(value.slice(0, e) + value.slice(e+1))
			let exponent = BigInt(e - (value.length - e))

			if(mantissa === 0n)
				return XFL.#create(0)
			
			while (mantissa > maxMantissa){
				mantissa /= 10n
				exponent++
			}

			while (mantissa < minMantissa){
				mantissa *= 10n
				exponent--
			}

			if(mantissa === 0n)
				return XFL.#create(0)

			if (exponent > maxExponent || exponent < minExponent)
				throw new Error(`invalid XFL (overflow)`)


			let serialized = (negative ? 1n : 0n)
		
			serialized <<= 8n
			serialized |= exponent + 97n
			serialized <<= 54n
			serialized |= mantissa
		
			return XFL.#create(serialized)
		}else if(typeof value === 'bigint'){
			
		}else if(value instanceof XFL){
			return value
		}

		
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
		return this.mantissa
	}

	get mantissa(){
		return super.valueOf() - ((super.valueOf() >> 54n)<< 54n)
	}

	get exponent(){
		return ((super.valueOf() >> 54n) & 0xFFn) - 97n
	}

	get negative(){
		return ((super.valueOf() >> 62n) & 1n) == 1n
	}

	get [Symbol.toStringTag]() {
		return this.toString()
	}
}



let x = new XFL(123)
let b = new XFL(2)


console.log(x, x * b, `${x}`)