import { div, eq, sub, mul, lt } from '@xrplkit/xfl'
import { getBookSignature, loadBook } from '@xrplkit/book'
import { isSameToken } from '@xrplkit/tokens'
import { flow } from './flow.js'

const epsilon = '0.00000000001'
const oneMinusEpsilon = sub('1', epsilon)

export async function simulateOffer({ takerPays, takerGets, tfSell, time, book, socket }){
	if(!book){
		if(!socket)
			throw new Error(`Either "book" or "socket" is required`)

		book = await loadBook({ 
			takerPays: takerGets, 
			takerGets: takerPays, 
			socket 
		})
	}

	if(takerPays?.currency){
		if(!isSameToken(takerPays, book.takerGets))
			throw new Error(`Parameter "takerPays" is different than in the passed book`)
	}

	if(takerGets?.currency){
		if(!isSameToken(takerGets, book.takerPays))
			throw new Error(`Parameter "takerGets" is different than in the passed book`)
	}
	
	if(takerPays && eq(takerPays.value, 0))
		throw new Error(`Value of "takerPays" must be greater than zero`)

	if(takerGets && eq(takerGets.value, 0))
		throw new Error(`Value of "takerGets" must be greater than zero`)
	
	if(tfSell && !takerGets)
		throw new Error(`Parameter "takerGets" must be set for an offer with tfSell=true`)
	else if(!takerPays)
		tfSell = true

	let { actualIn, actualOut, actualAffected, finalStrands } = await flow({
		deliver: {
			...takerPays,
			value: tfSell
				? div(`9999999999999999e80`, 2)
				: takerPays.value
		},
		sendMax: takerGets,
		strands: [[{ book }]],
		offerCrossing: tfSell ? 2 : 1,
		limitQuality: takerGets && takerPays
			? div(takerPays.value, takerGets.value)
			: undefined,
		time
	})

	if(eq(actualOut.value, 0)){
		let { loadMore: _, ...sameBook } = book

		return {
			takerGot: {
				...takerGets,
				value: '0'
			},
			takerPaid: {
				...takerPays,
				value: '0'
			},
			partial: true,
			affectedOffers: [],
			affectedAMM: undefined,
			finalBook: structuredClone(sameBook)
		}
	}

	return {
		takerGot: actualIn,
		takerPaid: {
			...actualOut,
			value: mul(actualOut.value, oneMinusEpsilon)
		},
		partial: tfSell
			? lt(actualIn.value, mul(takerGets.value, oneMinusEpsilon))
			: lt(actualOut.value, mul(takerPays.value, oneMinusEpsilon)),
		affectedOffers: actualAffected[getBookSignature(book)],
		finalBook: finalStrands[0][0].book
	}
}