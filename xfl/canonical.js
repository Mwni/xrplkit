import { exponentMin, exponentMax, mantissaMin, mantissaMax } from './constants.js'

const clamp = true

export function canonicalize(xfl){
	if(xfl.mantissa === 0n)
		return xfl

	let sign = xfl.mantissa < 0n ? -1n : 1n
	let mantissa = xfl.mantissa * sign
	
	while (mantissa > mantissaMax){
		mantissa /= 10n
		xfl.exponent++
	}
	
	while (mantissa < mantissaMin){
		mantissa *= 10n
		xfl.exponent--
	}

	xfl.mantissa = mantissa * sign

	if(clamp){
		if (xfl.exponent > exponentMax){
			xfl.exponent = exponentMax
			xfl.mantissa = mantissaMax
		}else if(xfl.exponent < exponentMin){
			xfl.exponent = exponentMin
			xfl.mantissa = mantissaMin
		}
	}else{
		if (xfl.exponent > exponentMax || xfl.exponent < exponentMin)
			throw new Error(`invalid XFL (overflow)`)
	}

	return xfl
}