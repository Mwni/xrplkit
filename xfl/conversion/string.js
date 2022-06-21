import { minExponent, maxExponent } from '../constants.js'
import { canonicalize } from '../canonical.js'


export function fromString(str){
	if(str === '0')
		return {mantissa: 0n, exponent: 0n}

	let mantissa
	let exponent = 0n
	let negative = false
	let point = str.indexOf('.')
	let e = str.lastIndexOf('e')

	if(str.charAt(0) === '-'){
		str = str.slice(1)
		negative = true
		point--
		e--
	}

	if(e >= 0){
		exponent += BigInt(str.slice(e + 1))
		str = str.slice(0, e)
	}

	if(point > 0){
		mantissa = BigInt(str.slice(0, point) + str.slice(point + 1))
		exponent += BigInt(point - str.length + 1)
	}else{
		mantissa = BigInt(str)
	}

	if(negative)
		mantissa *= -1n

	return canonicalize({mantissa, exponent})
}


export function toString(xfl){
	if(xfl.mantissa === 0n)
		return '0'

	let prefix = ''
	let str = xfl.mantissa.toString()
	let point = Number(xfl.exponent - minExponent - maxExponent)

	if(xfl.mantissa < 0n){
		prefix = '-'
		str = str.slice(1)
	}

	if(point <= 0){
		str = `0.`.padEnd(2 - point, '0') + str
	}else if(point >= str.length){
		str = str.padEnd(point + 1, '0')
	}else{
		str = str.slice(0, point) + '.' + str.slice(point)
	}

	let cap = str.length - 1

	while(cap --> point){
		if(str.charAt(cap) !== '0')
			break
	}

	if(str.charAt(cap) === '.')
		cap--

	return prefix + str.slice(0, cap + 1)
}