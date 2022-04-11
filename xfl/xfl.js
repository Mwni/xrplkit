import Decimal from 'decimal.js'

const minMantissa = 1000000000000000n
const maxMantissa = 9999999999999999n
const minExponent = -96
const maxExponent = 80




export default class XFL extends Decimal{
	static fromString(str){
		if(typeof str !== 'string'){
			throw new Error(`supplied value must be of type String`)
		}

		return new this(str)
	}

	static fromSerialized(serialized){
		if(!serialized instanceof BigInt){
			throw new Error(`supplied value must be of type BigInt`)
		}

		if (serialized < 0n)
			throw new Error(`invalid XFL`)

		if (serialized == 0n)
			return new XFL(0)

		let mantissa = serialized - ((serialized >> 54n)<< 54n)
		let exponent = ((serialized >> 54n) & 0xFFn) - 97n
		let negative = ((serialized >> 62n) & 1n) == 1n
		
		let xfl = new XFL(`${negative ? '-' : ''}${mantissa}e${exponent}`)

		//xfl.e = Number(exponent)
		//xfl.d = [Math.abs(Number(mantissa))]
		//xfl.s = negative ? -1 : 1

		console.log('from serialized:', `${mantissa}e${exponent}`, exponent, mantissa, negative, '->', xfl.e, xfl.d, xfl.s)

		return xfl
	}


	serialize(){
		let exponent = this.e
		let mantissa = this.d[0]
		let negative = this.s < 0

		for(let d of this.d){
			//mantissa += BigInt(d)
			//mantissa *= BigInt(1e7)
		}

		exponent -= Math.floor(Math.log10(mantissa))

		console.log('will serialize (', this.toString(), '):', exponent, mantissa, negative)

		// convert types as needed
		if (typeof(exponent) != 'bigint')
			exponent = BigInt(exponent)

		if (typeof(mantissa) != 'bigint')
			mantissa = BigInt(mantissa)

		// canonical zero
		if (mantissa == 0n)
			return 0n

		while (mantissa > maxMantissa)
		{
			mantissa /= 10n
			exponent++
		}

		while (mantissa < minMantissa)
		{
			mantissa *= 10n
			exponent--
		}

		console.log('seralize adjusted:', exponent, mantissa, negative)

		// canonical zero on mantissa underflow
		if (mantissa == 0)
			return 0n

		if (exponent > maxExponent || exponent < minExponent)
			throw new Error(`invalid XFL (overflow)`)

		exponent += 97n

		let xfl = (negative ? 1n : 0n)

		xfl <<= 8n
		xfl |= BigInt(exponent)
		xfl <<= 54n
		xfl |= BigInt(mantissa)

		return xfl
	}
}



console.log('recycled:', XFL.fromSerialized(XFL.fromString('0.1').serialize()).toString())
console.log('recycled:', XFL.fromSerialized(XFL.fromString('1').serialize()).toString())
console.log('recycled:', XFL.fromSerialized(XFL.fromString('999').serialize()).toString())





function make_xfl(exponent, mantissa)
{
	// convert types as needed
	if (typeof(exponent) != 'bigint')
		exponent = BigInt(exponent);

	if (typeof(mantissa) != 'bigint')
		mantissa = BigInt(mantissa);

	// canonical zero
	if (mantissa == 0n)
		return 0n;

	// normalize
	let is_negative = mantissa < 0;
	if (is_negative)
		mantissa *= -1n;

	while (mantissa > maxMantissa)
	{
		mantissa /= 10n;
		exponent++;
	}
	while (mantissa < minMantissa)
	{
		mantissa *= 10n;
		exponent--;
	}

	// canonical zero on mantissa underflow
	if (mantissa == 0)
		return 0n;

	// under and overflows
	if (exponent > maxExponent || exponent < minExponent)
		return -1; // note this is an "invalid" XFL used to propagate errors

	exponent += 97n;

	let xfl = (is_negative ? 0n : 1n);
	xfl <<= 8n;
	xfl |= BigInt(exponent);
	xfl <<= 54n;
	xfl |= BigInt(mantissa);

	return xfl;
}

function get_exponent(xfl)
{
	if (xfl < 0n)
		throw "Invalid XFL";
	if (xfl == 0n)
		return 0n;
	return ((xfl >> 54n) & 0xFFn) - 97n;
}

function get_mantissa(xfl)
{
	if (xfl < 0n)
		throw "Invalid XFL";
	if (xfl == 0n)
		return 0n;
	return xfl - ((xfl >> 54n)<< 54n);
}

function is_negative(xfl)
{
	if (xfl < 0n)
		throw "Invalid XFL";
	if (xfl == 0n)
		return false;
	return ((xfl >> 62n) & 1n) == 0n;
}

function to_string(xfl)
{
	if (xfl < 0n)
		throw "Invalid XFL";
	if (xfl == 0n)
		return "<zero>";
	return (is_negative(xfl) ? "-" : "+") +
			get_mantissa(xfl) + " * 10^(" + get_exponent(xfl) + ")";

}


console.log(to_string(make_xfl(0, 999)))