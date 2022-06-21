export function eq(a, b){
	return a.mantissa === b.mantissa
		&& a.exponent === b.exponent
}

export function lt(a, b){
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

export function min(...xs){
	let min = xs[0]

	for(let x of xs){
		if(lt(x, min))
			min = x
	}

	return min
}

export function max(...xs){
	let max = xs[0]

	for(let x of xs){
		if(gt(x, max))
			max = x
	}

	return max
}