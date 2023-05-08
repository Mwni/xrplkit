import { decodeCurrencyCode } from './encoding.js'
import XFL from '@xrplkit/xfl'


export function formatCurrency({ currency, issuer }){
	if(currency === 'XRP')
		return currency
	
	return `${decodeCurrencyCode(currency)}:${issuer}`
}


export function formatValue(value, options){
	let compact = options?.compact
	let decimals = options?.decimals || 2
	let separators = options?.separators
	let absolute = options?.absolute
	let sign = XFL.lt(value, 0) ? -1 : 1
	let absValue: any = XFL.abs(value)
	let prettyValue = value
	let prefix = ''
	let suffix = ''


	if(compact){
		if(XFL.gte(absValue, '1000000000000')){
			prettyValue = toSignificant(XFL.div(absValue, '1000000000000'), 2)
			suffix = 'T'
		}else if(XFL.gte(absValue, '1000000000')){
			prettyValue = toSignificant(XFL.div(absValue, '1000000000'), 2)
			suffix = 'B'
		}else if(XFL.gte(absValue, '1000000')){
			prettyValue = toSignificant(XFL.div(absValue, '1000000'), 2)
			suffix = 'M'
		}else if(XFL.gte(absValue, '1000')){
			prettyValue = toSignificant(XFL.div(absValue, '1000'), 2)
			suffix = 'K'
		}else if(XFL.gte(absValue, '1')){
			prettyValue = toInsignificant(absValue, 0)
		}else if(XFL.gt(absValue, '0')){
			prettyValue = toInsignificant(
				absValue,
				-Math.floor(Math.log10(absValue)) + 1
			)
		}
	}else{
		if(XFL.gte(absValue, '100000000000000')){
			prefix = '>'
			prettyValue = '100'
			suffix = 'T'
		}else if(XFL.gt(absValue, '0')){
			if(XFL.gte(absValue, '1000')){
				prettyValue = toInsignificant(absValue, 0)
			}else if(XFL.gte(absValue, '1')){
				prettyValue = toInsignificant(absValue, decimals)
			}else if(XFL.gt(absValue, '0')){
				prettyValue = toInsignificant(
					absValue,
					-Math.floor(Math.log10(absValue)) + decimals
				)
			}
		}
	}

	let valueString = prettyValue.toString()
	let [int, decimal] = valueString.split('.')
	let formattedInteger = separators !== false 
		? parseInt(int).toLocaleString('en-US') 
		: int

	let formattedValue = formattedInteger

	if(decimal){
		formattedValue += `.${decimal}`
	}

	if(sign === -1 && !absolute){
		formattedValue = `- ${formattedValue}`
	}

	return prefix + formattedValue + suffix
}

function toSignificant(value, digits){
	let str = value.toString()
		.replace(/\.\d+/, '')

	return str
}

function toInsignificant(value, digits){
	let str = value.toString()
	let index = str.indexOf('.')

	if(index === -1)
		return str

	return str.slice(
		0,
		index + digits + (digits > 0 ? 1 : 0)
	)
}
