import { mul, div, eq, sub, lt } from '@xrplkit/xfl'
import { cloneBook, getBookSignature, loadBook } from '@xrplkit/book'
import { flow } from './flow.js'

const epsilon = '0.00000000001'
const oneMinusEpsilon = sub('1', epsilon)

export async function simulatePayment({ deliverMax, deliverMin, sendMax, tfPartialPayment, tfLimitQuality, time, book, socket }){
	if(!book){
		if(!socket)
			throw new Error(`Either "book" or "socket" is required`)

		book = await loadBook({ 
			takerPays: sendMax, 
			takerGets: deliverMax, 
			socket 
		})
	}

	if(!sendMax)
		throw new Error(`Parameter "sendMax" is required`)

	if(!deliverMax)
		throw new Error(`Parameter "deliverMax" is required`)

	if(tfPartialPayment && !deliverMin)
		throw new Error(`Parameter "deliverMin" must be set for an offer with tfPartialPayment=true`)

	if(deliverMin){
		if(tfPartialPayment === false)
			throw new Error(`"tfPartialPayment" cannot be false for a payment with "deliverMin"`)

		tfPartialPayment = true
	}

	let { actualIn, actualOut, actualAffected, finalStrands } = await flow({
		deliver: deliverMax,
		sendMax: sendMax,
		strands: [[
			{ book }, 
			{ direct: true, transferRate: book.transferRateOut }
		]],
		limitQuality: tfLimitQuality
			? div(deliverMax.value, sendMax.value)
			: undefined,
		time
	})

	let partial = lt(actualOut.value, mul(deliverMax.value, oneMinusEpsilon))
	let deliveredInsufficient = lt(actualOut.value, mul(deliverMin.value, oneMinusEpsilon))

	if(eq(actualOut.value, 0) || (partial && !tfPartialPayment) || deliveredInsufficient){
		return {
			pathDry: true,
			delivered: {
				...actualOut,
				value: 0
			},
			sent: {
				...actualIn,
				value: 0
			},
			partial,
			affectedOffers: [],
			finalBook: cloneBook(book)
		}
	}

	return {
		sent: actualIn,
		delivered: actualOut,
		partial,
		affectedOffers: actualAffected[getBookSignature(book)],
		finalBook: finalStrands[0][0]
	}
}