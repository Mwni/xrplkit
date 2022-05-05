export default function XFL(input){
	
}

function fromString(str){
	let mantissa
	let exponent
	let negative = false
	let point = str.indexOf('.')

	if(str.charAt(0) === '-'){
		str = str.slice(1)
		negative = true
		point--
	}

	if(point > 0){
		console.log(str.slice(0, point) + '/' + str.slice(point+1), point)
		mantissa = BigInt(str.slice(0, point) + str.slice(point + 1))
		exponent = BigInt(point - str.length + 1)
	}else{
		mantissa = BigInt(str)
		exponent = BigInt(0)
	}
	

	console.log('in', exponent, mantissa)

	if(mantissa === 0n)
		return 0n
	
	while (mantissa > maxMantissa){
		mantissa /= 10n
		exponent++
	}

	while (mantissa < minMantissa){
		mantissa *= 10n
		exponent--
	}

	if(mantissa === 0n)
		return 0n

	if (exponent > maxExponent || exponent < minExponent)
		throw new Error(`invalid XFL (overflow)`)
}