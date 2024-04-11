export function floor(x, decimal = 0){
	let { exponent, mantissa } = x
	let shift = -(exponent + BigInt(decimal))

	if(shift <= 0n)
		return x
	else if(shift > 16n)
		return { exponent: 0n, mantissa: 0n }

	let factor = 10n ** shift

	mantissa = (mantissa / factor) * factor

	return { exponent, mantissa }
}