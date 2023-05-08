import { fromAny } from '../conversion/any.js'
import { canonicalize } from '../canonical.js'
import * as arit from '../operators/arithmetic.js'
import * as comp from '../operators/comparison.js'
import * as roun from '../operators/rounding.js'
import * as stri from '../conversion/string.js'
import * as bigi from '../conversion/bigint.js'

export class XFL {
	exponent
	mantissa
	constructor(xfl) {
		if (xfl instanceof XFL) {
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
		} else {
			return new XFL(fromAny(xfl))
		}
	}

	static fromSortSafeBigInt(bigint) {
		return new XFL(bigi.fromSortSafeBigInt(bigint))
	}

	toString() {
		return stri.toString(this)
	}

	[Symbol.toStringTag]() {
		return stri.toString(this)
	}

	static abs(x) {
		return new XFL(arit.abs(new XFL(x)))
	}

	static neg(x) {
		return new XFL(arit.neg(new XFL(x)))
	}

	static sum(a, b) {
		return new XFL(arit.sum(new XFL(a), new XFL(b)))
	}

	static sub(a, b) {
		return new XFL(arit.sub(new XFL(a), new XFL(b)))
	}

	static mul(a, b) {
		return new XFL(arit.mul(new XFL(a), new XFL(b)))
	}

	static div(a, b) {
		return new XFL(arit.div(new XFL(a), new XFL(b)))
	}

	static floor(x, decimal = 0) {
		return new XFL(roun.floor(new XFL(x), decimal))
	}

	static eq(a, b) {
		return comp.eq(new XFL(a), new XFL(b))
	}

	static lt(a, b) {
		return comp.lt(new XFL(a), new XFL(b))
	}

	static lte(a, b) {
		return comp.lte(new XFL(a), new XFL(b))
	}

	static gt(a, b) {
		return comp.gt(new XFL(a), new XFL(b))
	}

	static gte(a, b) {
		return comp.gte(new XFL(a), new XFL(b))
	}

	static min(...xs) {
		return new XFL(comp.min(...xs.map(x => new XFL(x))))
	}

	static max(...xs) {
		return new XFL(comp.max(...xs.map(x => new XFL(x))))
	}

	static toString(x) {
		return stri.toString(new XFL(x))
	}

	static toBigInt(x) {
		return bigi.toBigInt(new XFL(x))
	}

	static toSortSafeBigInt(x) {
		return bigi.toSortSafeBigInt(new XFL(x))
	}
}
