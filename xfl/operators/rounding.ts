export function floor(x, decimal = 0){
	let { exponent, mantissa } = x
	let shift = -(x.exponent + BigInt(decimal))

	if(shift <= 0n)
		return x
	else if(shift > 16n)
		return 0n

	// @ts-ignore
	let factor = 10n ** shift

	mantissa = (x.mantissa / factor) * factor

	return { exponent, mantissa }
}