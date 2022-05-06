/*import Decimal from 'decimal.js'


export function formatValue(value, options){
	let sign = Decimal.sign(value)
	let compact = options?.compact
	let decimals = options?.decimals || 2

	value = new Decimal(value).abs()

	let prettyValue = value
	let prefix = ''
	let suffix = ''


	if(compact){
		if(value.greaterThanOrEqualTo('1000000000000')){
			prettyValue = value.div('1000000000000').toSignificantDigits(2)
			suffix = 'T'
		}else if(value.greaterThanOrEqualTo('1000000000')){
			prettyValue = value.div('1000000000').toSignificantDigits(2)
			suffix = 'B'
		}else if(value.greaterThanOrEqualTo('1000000')){
			prettyValue = value.div('1000000').toSignificantDigits(2)
			suffix = 'M'
		}else if(value.greaterThanOrEqualTo('1000')){
			prettyValue = value.div('1000').toSignificantDigits(2)
			suffix = 'K'
		}else if(value.greaterThanOrEqualTo('1')){
			prettyValue = value.toDecimalPlaces(0)
		}else if(value.greaterThan('0')){
			prettyValue = value.toDecimalPlaces(-Math.floor(value.log()) + 1)
		}
	}else{
		if(value.greaterThanOrEqualTo('100000000000000')){
			prefix = '>'
			prettyValue = '100'
			suffix = 'T'
		}else if(value.greaterThan('0')){
			if(value.greaterThanOrEqualTo('1000')){
				prettyValue = value.toDecimalPlaces(0)
			}else if(value.greaterThanOrEqualTo('1')){
				prettyValue = value.toDecimalPlaces(decimals)
			}else if(value.greaterThan('0')){
				prettyValue = value.toDecimalPlaces(-Math.floor(value.log()) + decimals)
			}
		}
	}

	let valueString = typeof prettyValue === 'string' ? prettyValue : prettyValue.toFixed()
	let [int, decimal] = valueString.split('.')
	let formattedInteger = options.separators !== false 
		? parseInt(int).toLocaleString('en-US') 
		: int

	let formattedValue = formattedInteger

	if(decimal){
		formattedValue += `.${decimal}`
	}

	if(sign === -1 && !options.absolute){
		formattedValue = `- ${formattedValue}`
	}

	return prefix + formattedValue + suffix
}*/