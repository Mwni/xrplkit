import * as lib from '@xrplkit/submit'
import { div } from '@xrplkit/xfl'
import { fromRippled } from '@xrplkit/amount'


export async function submitAndWait(args){
	process.stdout.write(`submitting ${summarize(args.tx)} ... `)


	let result = await lib.submitAndWait(args)

	console.log(result.engine_result)

	if(!result.applied){
		throw result
	}

	return result
}

export async function submit(args){
	process.stdout.write(`submitting ${summarize(args.tx)} ... `)

	let result = await lib.submit(args)

	console.log(result.engine_result)

	if(!result.applied){
		throw result
	}

	return result
}

export function summarize(tx){
	switch(tx.TransactionType){
		case 'OfferCreate':
			let takerPays = fromRippled(tx.TakerPays)
			let takerGets = fromRippled(tx.TakerGets)
			let rate = div(takerPays.value, takerGets.value)

			return `[OfferCreate: ${takerGets.value} ${takerGets.currency} -> ${takerPays.value} ${takerPays.currency} = ${rate}]`

		case 'Payment':
			let amount = fromRippled(tx.Amount)

			return `[Payment: ${amount.value} ${amount.currency}]`

		default:
			return `[${tx.TransactionType}]`
	}
}