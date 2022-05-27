import { toString, toBigInt } from './conversion.js'
import { abs, sum, sub, mul, div, floor, eq, lt, lte, gt, gte } from './operators.js'


export function XFL(input){
	if(this instanceof XFL){
		this.mantissa = BigInt(input.mantissa)
		this.exponent = BigInt(input.exponent)
	}else{
		return new XFL(input)
	}
}

Object.defineProperties(XFL.prototype, {
	toString: {
		value: function(){
			return toString(this)
		}
	},
	[Symbol.toStringTag]: {
		get(){
			return toString(this)
		}
	}
})


export { abs, sum, sub, mul, div, floor, eq, lt, lte, gt, gte, toString, toBigInt }