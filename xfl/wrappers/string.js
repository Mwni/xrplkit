import { fromAny } from '../conversion/any.js'
import { toString as str } from '../conversion/string.js'
import * as arit from '../operators/arithmetic.js'
import * as comp from '../operators/comparison.js'
import * as roun from '../operators/rounding.js'
import * as bigi from '../conversion/bigint.js'
import { canonicalize } from '../canonical.js'


export function XFL(xfl){
	return str(canonicalize(fromAny(xfl)))
}

Object.defineProperties(XFL, {
	fromSortSafeBigInt(bigint){
		return XFL(bigi.fromSortSafeBigInt(bigint))
	}
})

export function abs(x){
	return XFL(arit.abs(fromAny(x)))
}

export function neg(x){
	return XFL(arit.neg(fromAny(x)))
}

export function sum(a, b){
	return XFL(arit.sum(fromAny(a), fromAny(b)))
}

export function sub(a, b){
	return XFL(arit.sub(fromAny(a), fromAny(b)))
}

export function mul(a, b){
	return XFL(arit.mul(fromAny(a), fromAny(b)))
}

export function div(a, b){
	return XFL(arit.div(fromAny(a), fromAny(b)))
}

export function floor(x, decimal = 0){
	return XFL(roun.floor(fromAny(x), decimal))
}

export function eq(a, b){
	return comp.eq(fromAny(a), fromAny(b))
}

export function lt(a, b){
	return comp.lt(fromAny(a), fromAny(b))
}

export function lte(a, b){
	return comp.lte(fromAny(a), fromAny(b))
}

export function gt(a, b){
	return comp.gt(fromAny(a), fromAny(b))
}

export function gte(a, b){
	return comp.gte(fromAny(a), fromAny(b))
}

export function min(...xs){
	return XFL(comp.min(...xs.map(x => fromAny(x))))
}

export function max(...xs){
	return XFL(comp.max(...xs.map(x => fromAny(x))))
}

export function toString(x){
	return XFL(x)
}

export function toBigInt(x){
	return bigi.toBigInt(canonicalize(fromAny(x)))
}

export function toSortSafeBigInt(x){
	return bigi.toSortSafeBigInt(canonicalize(fromAny(x)))
}