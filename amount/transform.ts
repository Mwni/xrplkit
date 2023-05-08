export function negate(amount){
	let value = amount.value

	if(/^-\d/.test(value))
		value = value.slice(1)
	else if(value !== '0')
		value = `-${value}`

	return {
		...amount,
		value
	}
}