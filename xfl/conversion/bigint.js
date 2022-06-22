import { minExponent, exponentMask, mantissaMask } from '../constants.js'



export function toBigInt(x){
	if(x.mantissa === 0n)
		return 0n

	let exponent = x.exponent - minExponent + 1n
	let mantissa = x.mantissa
	let serialized = 0n

	if(x.mantissa < 0n){
		serialized = 1n
		mantissa *= -1n
	}

	serialized <<= 8n
	serialized |= exponent 
	serialized <<= 54n
	serialized |= mantissa

	return serialized
}

export function fromBigInt(int){
	if(((int >> 63n) & 1n) !== 0n)
		throw new Error(`This BigInt is not a valid XFL: ${int}`)

	let negative = ((int >> 62n) & 1n) == 1n
	let mantissa = int - ((int >> 54n)<< 54n)
	let exponent = ((int >> 54n) & 0xFFn) + minExponent - 1n

	if(negative)
		mantissa *= -1n

	return {mantissa, exponent}
}



export function toSortSafeBigInt(x){
	if(x.mantissa === 0n)
		return 0n

	let exponent = x.exponent - minExponent + 1n
	let mantissa = x.mantissa
	let serialized = 0n


	if(x.mantissa < 0n){
		exponent = exponent ^ exponentMask
		mantissa = -mantissa ^ mantissaMask
	}else{
		serialized = 1n
	}

	serialized <<= 8n
	serialized |= exponent 
	serialized <<= 54n
	serialized |= mantissa


	return serialized
}

export function fromSortSafeBigInt(int){
	if(int === 0n)
		return {mantissa: 0n, exponent: 0n}

	if(((int >> 63n) & 1n) !== 0n)
		throw new Error(`This BigInt is not a valid XFL: ${int}`)

	let negative = ((int >> 62n) & 1n) == 0n
	let mantissa = int - ((int >> 54n)<< 54n)
	let exponent = ((int >> 54n) & 0xFFn)

	if(negative){
		mantissa = -(mantissa ^ mantissaMask)
		exponent = exponent ^ exponentMask
	}

	exponent += minExponent - 1n

	return {mantissa, exponent}
}