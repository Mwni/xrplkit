import { XFL as StringXFL } from './wrappers/string.js'
import { minMantissa, maxMantissa, minExponent, maxExponent } from './constants.js'


export function XFL(input){
	if(typeof input === 'string')
		input = fromString(input)
	if(typeof input === 'number')
		input = fromString(input.toString())
	else if(typeof input === 'bigint')
		input = fromBigInt(input)
	
	if(this instanceof XFL){
		this.mantissa = BigInt(input.mantissa)
		this.exponent = BigInt(input.exponent)
		normalize(this)
	}else{
		return new XFL(input)
	}
}

Object.defineProperties(XFL.prototype, {
	toString: {
		value: function(){
			return StringXFL(this)
		}
	},
	[Symbol.toStringTag]: {
		get(){
			return StringXFL(this)
		}
	}
})


export function neg(x){
	x = XFL(x)
	x.mantissa *= -1n

	return x
}

export function sum(a, b){
	a = XFL(a)
	b = XFL(b)

	if (a.mantissa === 0n)
		return a

	if(b.mantissa === 0n)
		return b

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
		return toXFL(0n)
	}

	return a
}

export function sub(a, b){
	return sum(a, neg(b))
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
		mantissa = BigInt(str.slice(0, point) + str.slice(point + 1))
		exponent = BigInt(point - str.length + 1)
	}else{
		mantissa = BigInt(str)
		exponent = BigInt(0)
	}

	if(negative)
		mantissa *= -1

	return XFL({mantissa, exponent})
}

function fromBigInt(){

}

function normalize(xfl){
	if(xfl.mantissa === 0n)
		return
	
	while (xfl.mantissa > maxMantissa){
		xfl.mantissa /= 10n
		xfl.exponent++
	}

	while (xfl.mantissa < minMantissa){
		xfl.mantissa *= 10n
		xfl.exponent--
	}

	if (xfl.exponent > maxExponent || xfl.exponent < minExponent)
		throw new Error(`invalid XFL (overflow)`)
}