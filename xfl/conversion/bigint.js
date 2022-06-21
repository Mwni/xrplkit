import { minExponent } from '../constants.js'


export function fromBigInt(int){
	let mantissa = int - ((int >> 54n)<< 54n)
	let exponent = ((int >> 54n) & 0xFFn) + minExponent - 1n
	let negative = ((int >> 62n) & 1n) == 1n

	if(negative)
		mantissa *= -1n

	return {mantissa, exponent}
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


export function fromSortSafeBigInt(int){
	let mantissa = int - ((int >> 54n)<< 54n)
	let exponent = ((int >> 54n) & 0xFFn) + minExponent - 1n
	let negative = ((int >> 62n) & 1n) == 1n

	if(negative)
		mantissa *= -1n

	return {mantissa, exponent}
}


export function toSortSafeBigInt(x){
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