import { fromString } from './string.js'
import { fromBigInt } from './bigint.js'

export function fromAny(input){
	if(typeof input === 'object' && 'exponent' in input && 'mantissa' in input)
		return input

	if(typeof input === 'undefined')
		return fromString('0')

	if(typeof input === 'string')
		return fromString(input)

	if(typeof input === 'number')
		return fromString(input.toString())

	if(typeof input === 'bigint')
		return fromBigInt(input)
	

	throw new Error(`Cannot parse XFL: ${input}`)
}