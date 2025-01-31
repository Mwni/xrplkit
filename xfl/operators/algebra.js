import { fromAny } from '../conversion/any.js'
import { div, mul, sum } from './arithmetic.js'
import { eq, lt } from './comparison.js'

const xfl_0 = fromAny(0)
const xfl_1 = fromAny(1)
const xfl_2 = fromAny(2)
const sqrt_D = fromAny(105)
const sqrt_a0 = fromAny(18)
const sqrt_a1 = fromAny(144)
const sqrt_a2 = fromAny(-60)

export function sqrt(f){
	if(eq(f, xfl_0) || eq(f, xfl_1))
		return f

	if(lt(f, xfl_0))
		throw new Error('Cannot calculate square root for negative value')

	let e = f.exponent + 16n

	if(e % 2n != 0n)
		e++

	f = { mantissa: f.mantissa, exponent: f.exponent - e }

	let r = div(
		sum(
			sqrt_a0,
			sum(
				mul(sqrt_a1, f),
				mul(sqrt_a2, f),
			)
		),
		sqrt_D
	)

	let rm1 = xfl_0
	let rm2 = xfl_0

	do{
		rm2 = rm1
		rm1 = r
		r = div(sum(r, div(f, r)), xfl_2)
	}while(!eq(r, rm1) && !eq(r, rm2))

	return {
		mantissa: r.mantissa,
		exponent: r.exponent + e / 2n
	}
}