import { XFL } from './index.js'
import { toNative } from './conversion.js'
import { minExponent, maxExponent, maxMantissa, minMantissa } from './constants.js'


export function abs(x){
	x = clone(x)
	
	if(x.mantissa < 0n)
		x.mantissa *= -1n

	return x
}

export function neg(x){
	x = clone(x)
	x.mantissa *= -1n

	return x
}

export function sum(a, b){
	a = clone(a)
	b = clone(b)

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
	a = clone(a)
	b = clone(b)

	if(a === 0n || b === 0n)
		return 0n

	a.mantissa *= b.mantissa
	a.mantissa /= 100000000000000n
	a.exponent += b.exponent
	a.exponent += 14n

	return normalize(a)
}

export function div(a, b){
	a = clone(a)
	b = clone(b)

	if(a.mantissa === 0n)
		return 0n

	if(b.mantissa === 0n)
		throw new RangeError('Division by zero')

	a.mantissa *= 100000000000000000n
	a.mantissa /= b.mantissa
	a.exponent -= b.exponent
	a.exponent -= 17n

	return normalize(a)
}

export function floor(x, decimal = 0){
	x = clone(x)

	let shift = -(x.exponent + BigInt(decimal))

	if(shift <= 0n)
		return x
	else if(shift > 16n)
		return 0n

	let factor = 10n ** shift

	x.mantissa = (x.mantissa / factor) * factor

	return normalize(x)
}

export function min(...xs){
	xs = xs.map(x => toNative(x))

	let min = xs[0]

	for(let x of xs){
		if(lt(x, min))
			min = x
	}

	return min
}

export function max(...xs){
	xs = xs.map(x => toNative(x))

	let max = xs[0]

	for(let x of xs){
		if(gt(x, max))
			max = x
	}

	return max
}

export function eq(a, b){
	a = toNative(a)
	b = toNative(b)

	return a.mantissa === b.mantissa
		&& a.exponent === b.exponent
}

export function lt(a, b){
	a = toNative(a)
	b = toNative(b)

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

	/*if(xfl.exponent < minExponent){
		xfl.exponent = minExponent
		mantissa = minMantissa
	}else if(xfl.exponent > maxExponent){
		xfl.exponent = maxExponent
		mantissa = maxMantissa
	}*/

	if (xfl.exponent > maxExponent || xfl.exponent < minExponent)
		throw new Error(`invalid XFL (overflow)`)

	xfl.mantissa = mantissa * sign

	return xfl
}


function clone(x){
	return XFL(toNative(x))
}