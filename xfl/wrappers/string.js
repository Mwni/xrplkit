import { toNative, toString, toBigInt as nativeToBigInt } from '../conversion.js'
import * as op from '../operators.js'

export function XFL(input){
	return toString(toNative(input))
}

export function abs(x){
	return toString(op.abs(x))
}

export function neg(x){
	return toString(op.neg(x))
}

export function sum(a, b){
	return toString(op.sum(a, b))
}

export function sub(a, b){
	return toString(op.sub(a, b))
}

export function mul(a, b){
	return toString(op.mul(a, b))
}

export function div(a, b){
	return toString(op.div(a, b))
}

export function floor(x, decimal = 0){
	return toString(op.floor(x, decimal))
}

export function eq(a, b){
	return op.eq(a, b)
}

export function lt(a, b){
	return op.lt(a, b)
}

export function lte(a, b){
	return op.lte(a, b)
}

export function gt(a, b){
	return op.gt(a, b)
}

export function gte(a, b){
	return op.gte(a, b)
}

export function toBigInt(x){
	return nativeToBigInt(toNative(x))
}