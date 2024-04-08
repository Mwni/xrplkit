import { fromAny } from '../conversion/any.js'
import { div, mul, sum } from './arithmetic.js'
import { eq, lt } from './comparison.js'

const sqrt_D = fromAny(105)
const sqrt_a0 = fromAny(18)
const sqrt_a1 = fromAny(144)
const sqrt_a2 = fromAny(-60)

export function sqrt(f){
	if(eq(f, 1) || eq(f, 0))
		return f

	if(lt(f, 0))
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

	let rm1 = fromAny()
	let rm2 = fromAny()

	do{
		rm2 = rm1
		rm1 = r
		r = div(sum(r, div(f, r)), fromAny(2))
	}while(!eq(r, rm1) && !eq(r, rm2))

	return {
		mantissa: r.mantissa,
		exponent: r.exponent + e / 2n
	}
}


/*
Number
root2(Number f)
{
    if (f == one)
        return f;
    if (f < Number{})
        throw std::overflow_error("Number::root nan");
    if (f == Number{})
        return f;

    // Scale f into the range (0, 1) such that f's exponent is a multiple of d
    auto e = f.exponent() + 16;
    if (e % 2 != 0)
        ++e;
    f = Number{f.mantissa(), f.exponent() - e};  // f /= 10^e;

    // Quadratic least squares curve fit of f^(1/d) in the range [0, 1]
    auto const D = 105;
    auto const a0 = 18;
    auto const a1 = 144;
    auto const a2 = -60;
    Number r = ((Number{a2} * f + Number{a1}) * f + Number{a0}) / Number{D};

    //  Newton–Raphson iteration of f^(1/2) with initial guess r
    //  halt when r stops changing, checking for bouncing on the last iteration
    Number rm1{};
    Number rm2{};
    do
    {
        rm2 = rm1;
        rm1 = r;
        r = (r + f / r) / Number(2);
    } while (r != rm1 && r != rm2);

    //  return r * 10^(e/2) to reverse scaling
    return Number{r.mantissa(), r.exponent() + e / 2};
}
*/