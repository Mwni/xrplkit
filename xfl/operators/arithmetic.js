import { canonicalize } from '../canonical.js'


export function abs(x){
	return {
		exponent: x.exponent,
		mantissa: x.mantissa < 0n
			? -x.mantissa
			: x.mantissa
	}
}

export function neg(x){
	return {
		exponent: x.exponent,
		mantissa: -x.mantissa
	}
}

export function sum(a, b){
	let { exponent: ae, mantissa: am } = a
	let { exponent: be, mantissa: bm } = b

	if(am === 0n)
		return b

	if(bm === 0n)
		return a


	while (ae < be){
		am /= 10n
		ae++
	}

	while (be < ae){
		bm /= 10n
		be++
	}

	am += bm

	return canonicalize({
		exponent: ae,
		mantissa: am
	})
}

export function sub(a, b){
	return sum(a, neg(b))
}

export function mul(a, b){
	if(a.mantissa === 0n || b.mantissa === 0n)
		return { exponent: 0n, mantissa: 0n }

	let { exponent: ae, mantissa: am } = a

	am *= b.mantissa
	am /= 100000000000000n
	ae += b.exponent
	ae += 14n

	return canonicalize({ 
		exponent: ae, 
		mantissa: am 
	})
}

export function div(a, b){
	if(a.mantissa === 0n)
		return a

	if(b.mantissa === 0n)
		throw new RangeError('Division by zero')

	let { exponent: ae, mantissa: am } = a

	am *= 100000000000000000n
	am /= b.mantissa
	ae -= b.exponent
	ae -= 17n

	return canonicalize({
		exponent: ae, 
		mantissa: am
	})
}