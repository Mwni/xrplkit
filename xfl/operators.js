import { XFL } from './index.js'
import { minExponent, maxExponent, maxMantissa, minMantissa } from './constants.js'


export function neg(x){
	x = XFL(x)
	x.mantissa *= -1n

	return x
}

export function sum(a, b){
	a = XFL(a)
	b = XFL(b)

	if (a.mantissa === 0n)
		return b

	if(b.mantissa === 0n)
		return a


	while (a.exponent < b.exponent){
		a.mantissa /= 10n
		a.exponent++
	}

	while (b.exponent < a.exponent){
		b.mantissa /= 10n
		b.exponent++
	}

	a.mantissa += b.mantissa

	if (a.mantissa >= -10n && a.mantissa <= 10n){
		return XFL(0n)
	}

	return normalize(a)
}

export function sub(a, b){
	return sum(a, neg(b))
}

export function mul(a, b){
	a = XFL(a)
	b = XFL(b)

	a.mantissa *= b.mantissa
	a.mantissa /= 100000000000000n
	a.exponent += b.exponent
	a.exponent += 14n

	return normalize(a)
}

export function div(a, b){
	a = XFL(a)
	b = XFL(b)

	a.mantissa *= 100000000000000000n
	a.mantissa /= b.mantissa
	a.exponent -= b.exponent
	a.exponent -= 17n

	return normalize(a)
}

export function eq(a, b){
	a = XFL(a)
	b = XFL(b)

	return a.mantissa === b.mantissa
		&& a.exponent === b.exponent
}

export function lt(a, b){
	a = XFL(a)
	b = XFL(b)

	let aNegative = a.mantissa < 0n
	let bNegative = b.mantissa < 0n

	if(aNegative != bNegative)
		return aNegative

	if(a.mantissa === 0n){
		if(bNegative)
			return false
		
		return b.mantissa !== 0n
	}
	
    if (b.mantissa === 0n)
        return false

    if (a.exponent > b.exponent)
        return aNegative
    if (a.exponent < b.exponent)
        return !aNegative
    if (a.mantissa > b.mantissa)
        return aNegative
    if (a.mantissa < b.mantissa)
        return !aNegative

    return false
}

export function lte(a, b){
	return lt(a, b) || eq(a, b)
}

export function gt(a, b){
	return !lt(a, b) && !eq(a, b)
}

export function gte(a, b){
	return !lt(a, b)
}

export function normalize(xfl){
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