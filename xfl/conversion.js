import { XFL } from './index.js'
import { minExponent, maxExponent } from './constants.js'


export function fromString(str){
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
		mantissa = BigInt(str.slice(0, point) + str.slice(point + 1))
		exponent = BigInt(point - str.length + 1)
	}else{
		mantissa = BigInt(str)
		exponent = BigInt(0)
	}

	if(negative)
		mantissa *= -1

	return XFL({mantissa, exponent})
}

export function toString(xfl){
	let str = xfl.mantissa.toString()
	let point = Number(xfl.exponent - minExponent - maxExponent)

	if(point <= 0){
		str = `0.`.padEnd(2 - point, '0') + str
	}else if(point >= str.length){
		str = str.padEnd(point + 1, '0')
	}else{
		str = str.slice(0, point) + '.' + str.slice(point)
	}

	let cap = str.length - 1

	while(cap --> point){
		if(str.charAt(cap) !== '0')
			break
	}

	if(str.charAt(cap) === '.')
		cap--

	return str.slice(0, cap + 1)
}



export function fromBigInt(int){
	let mantissa = int - ((int >> 54n)<< 54n)
	let exponent = ((int >> 54n) & 0xFFn) + minExponent - 1n
	let negative = ((int >> 62n) & 1n) == 1n

	if(negative)
		mantissa *= -1n

	return XFL({mantissa, exponent})
}

export function toBigInt(x){
	if(x.mantissa === 0n)
		return 0n

	let mantissa = x.mantissa
	let serialized = 0n

	if(x.mantissa < 0n){
		serialized = 1n
		mantissa *= -1n
	}

	serialized <<= 8n
	serialized |= x.exponent - minExponent + 1n
	serialized <<= 54n
	serialized |= mantissa

	return serialized
}