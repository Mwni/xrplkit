import { fromAny } from '../conversion/any.js'
import * as arit from '../operators/arithmetic.js'
import * as comp from '../operators/comparison.js'
import * as roun from '../operators/rounding.js'
import * as stri from '../conversion/string.js'
import * as bigi from '../conversion/bigint.js'


export function XFL(xfl){
	if(xfl instanceof XFL)
		return xfl

	if(this instanceof XFL){
		Object.defineProperties(this, {
			exponent: {
				value: xfl.exponent,
				writable: false,
				enumerable: true
			},
			mantissa: {
				value: xfl.mantissa,
				writable: false,
				enumerable: true
			}
		})
	}else{
		return new XFL(fromAny(xfl))
	}
}

Object.defineProperties(XFL, {
	fromSortSafeBigInt: {
		value: function(bigint){
			return new XFL(bigi.fromSortSafeBigInt(bigint))
		}
	}
})

Object.defineProperties(XFL.prototype, {
	toString: {
		value: function(){
			return stri.toString(this)
		}
	},
	[Symbol.toStringTag]: {
		get(){
			return stri.toString(this)
		}
	}
})

export function abs(x){
	return new XFL(arit.abs(fromAny(x)))
}

export function neg(x){
	return new XFL(arit.neg(fromAny(x)))
}

export function sum(a, b){
	return new XFL(arit.sum(fromAny(a), fromAny(b)))
}

export function sub(a, b){
	return new XFL(arit.sub(fromAny(a), fromAny(b)))
}

export function mul(a, b){
	return new XFL(arit.mul(fromAny(a), fromAny(b)))
}

export function div(a, b){
	return new XFL(arit.div(fromAny(a), fromAny(b)))
}

export function floor(x, decimal = 0){
	return new XFL(roun.floor(fromAny(x), decimal))
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
	return new XFL(comp.min(...xs.map(x => fromAny(x))))
}

export function max(...xs){
	return new XFL(comp.max(...xs.map(x => fromAny(x))))
}

export function toString(x){
	return stri.toString(fromAny(x))
}

export function toBigInt(x){
	return bigi.toBigInt(fromAny(x))
}

export function toSortSafeBigInt(x){
	return bigi.toSortSafeBigInt(fromAny(x))
}