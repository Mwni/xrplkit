import Decimal from 'decimal.js'

const minMantissa = 1000000000000000n
const maxMantissa = 9999999999999999n
const minExponent = -96
const maxExponent = 80


export default class XFL extends Decimal{
	constructor(value){
		if(typeof value === 'bigint'){
			if (value < 0n)
				throw new Error(`invalid XFL`)

			if (value == 0n)
				super(0)

			let mantissa = value - ((value >> 54n)<< 54n)
			let exponent = ((value >> 54n) & 0xFFn) - 97n
			let negative = ((value >> 62n) & 1n) == 1n
			
			super(`${negative ? '-' : ''}${mantissa}e${exponent}`)
		}else{
			super(value)
		}
	}


	toNative(){
		let exponent = BigInt(this.e)
		let mantissa = BigInt(0)
		let negative = this.s < 0

		for(let d of this.d){
			mantissa += BigInt(d)
			mantissa *= BigInt(1e7)
			exponent -= 7n
		}

		exponent -= BigInt(Math.floor(Math.log10(this.d[0])))

		if (mantissa == 0n)
			return 0n

		while (mantissa > maxMantissa)
		{
			mantissa /= 10n
			exponent++
		}

		while (mantissa < minMantissa)
		{
			mantissa *= 10n
			exponent--
		}

		if (mantissa == 0)
			return 0n

		if (exponent > maxExponent || exponent < minExponent)
			throw new Error(`invalid XFL (overflow)`)

		exponent += 97n

		let native = (negative ? 1n : 0n)

		native <<= 8n
		native |= BigInt(exponent)
		native <<= 54n
		native |= BigInt(mantissa)

		return native
	}
}