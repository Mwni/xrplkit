import { fromAny } from '../conversion/any.js'
import { canonicalize } from '../canonical.js'
import * as arit from '../operators/arithmetic.js'
import * as comp from '../operators/comparison.js'
import * as roun from '../operators/rounding.js'
import * as stri from '../conversion/string.js'
import * as bigi from '../conversion/bigint.js'


export function XFL(xfl){
	if(xfl instanceof XFL)
		return xfl

	if(this instanceof XFL){
		canonicalize(xfl)
		
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
		// @ts-ignore
		return new XFL(fromAny(xfl))
	}
}

Object.defineProperties(XFL, {
	fromSortSafeBigInt: {
		value: function(bigint){
			// @ts-ignore
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
	// @ts-ignore
	return new XFL(arit.abs(XFL(x)))
}

export function neg(x){
	// @ts-ignore
	return new XFL(arit.neg(XFL(x)))
}

export function sum(a, b){
	// @ts-ignore
	return new XFL(arit.sum(XFL(a), XFL(b)))
}

export function sub(a, b){
	// @ts-ignore
	return new XFL(arit.sub(XFL(a), XFL(b)))
}

export function mul(a, b){
	// @ts-ignore
	return new XFL(arit.mul(XFL(a), XFL(b)))
}

export function div(a, b){
	// @ts-ignore
	return new XFL(arit.div(XFL(a), XFL(b)))
}

export function floor(x, decimal = 0){
	// @ts-ignore
	return new XFL(roun.floor(XFL(x), decimal))
}

export function eq(a, b){
	return comp.eq(XFL(a), XFL(b))
}

export function lt(a, b){
	return comp.lt(XFL(a), XFL(b))
}

export function lte(a, b){
	return comp.lte(XFL(a), XFL(b))
}

export function gt(a, b){
	return comp.gt(XFL(a), XFL(b))
}

export function gte(a, b){
	return comp.gte(XFL(a), XFL(b))
}

export function min(...xs){
		// @ts-ignore
	return new XFL(comp.min(...xs.map(x => XFL(x))))
}

export function max(...xs){
		// @ts-ignore
	return new XFL(comp.max(...xs.map(x => XFL(x))))
}

export function toString(x){
	return stri.toString(XFL(x))
}

export function toBigInt(x){
	return bigi.toBigInt(XFL(x))
}

export function toSortSafeBigInt(x){
	return bigi.toSortSafeBigInt(XFL(x))
}