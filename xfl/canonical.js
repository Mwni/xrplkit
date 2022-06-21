import { minExponent, maxExponent, minMantissa, maxMantissa } from './constants.js'

export function canonicalize(xfl){
	if(xfl.mantissa === 0n)
		return xfl

	let sign = xfl.mantissa < 0n ? -1n : 1n
	let mantissa = xfl.mantissa * sign
	
	while (mantissa > maxMantissa){
		mantissa /= 10n
		xfl.exponent++
	}
	
	while (mantissa < minMantissa){
		mantissa *= 10n
		xfl.exponent--
	}

	if (xfl.exponent > maxExponent || xfl.exponent < minExponent)
		throw new Error(`invalid XFL (overflow)`)

	xfl.mantissa = mantissa * sign

	return xfl
}