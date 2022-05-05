import { fromString, fromBigInt, toString, toBigInt } from './conversion.js'
import { sum, sub, mul, div, eq, lt, lte, gt, gte, normalize } from './operators.js'


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
			return toString(this)
		}
	},
	[Symbol.toStringTag]: {
		get(){
			return toString(this)
		}
	}
})


export { sum, sub, mul, div, eq, lt, lte, gt, gte, toString, toBigInt }