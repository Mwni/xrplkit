import { minMantissa, maxMantissa, minExponent, maxExponent } from '../constants.js'

export function XFL(input){
	if(typeof input === 'object')
		return toString(input)
	else if(typeof input === 'bigint')
		return 'X'
	else
		return input
}

function toString(xfl){
	let str = xfl.mantissa.toString()
	let point = Number(xfl.exponent - minExponent - maxExponent)

	if(point <= 0){
		str = `0.`.padEnd(-point, '0') + str
	}else if(point >= str.length){
		str = str.padEnd(point - str.length, '0')
	}else{
		str = str.slice(0, point) + '.' + str.slice(point)
	}

	let cap = str.length - 1

	while(cap --> point){
		if(str.charAt(cap) !== '0')
			break
	}

	return str.slice(0, cap+1)
}