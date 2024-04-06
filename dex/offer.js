import { XFL, sum, sub, mul, div, eq, gt, gte } from '@xrplkit/xfl'
import { loadBook } from './book.js'
import { isSameToken } from './token.js'
import { amountFromRippled } from './amount.js'


export async function simulateOffer({ takerPays, takerGets, tfSell, book, socket }){
	let takerPaysValue
	let takerGetsValue
	let takerPaid = XFL(0)
	let takerGot = XFL(0)
	let partial = true
	let incomplete = true
	let done = false
	let affectedNodes = []
	let maxCrossQuality

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
		
		takerPaysValue = takerPays.value
	}

	if(takerGets?.currency){
		if(!isSameToken(takerGets, book.takerPays))
			throw new Error(`Parameter "takerGets" is different than in the passed book`)
		
		takerGetsValue = takerGets.value
	}
	
	if(takerPaysValue && eq(takerPaysValue, 0))
		throw new Error(`Value of "takerPays" must be greater than zero`)

	if(takerGetsValue && eq(takerGetsValue, 0))
		throw new Error(`Value of "takerGets" must be greater than zero`)
	
	if(takerGetsValue && takerPaysValue)
		maxCrossQuality = div(takerGetsValue, takerPaysValue)

	if(tfSell && !takerGetsValue)
		throw new Error(`Parameter "takerGets" must be set for an offer with tfSell=true`)
	else if(!takerPaysValue)
		tfSell = true
	
	let crossingOfferCandidates = book.offers
		.map(offer => ({ ...offer, aux: createOfferAux(offer) }))
		.filter(offer => !offer.aux.unfunded)

	for(let i=0; i<crossingOfferCandidates.length; i++){
		let { aux, ...offer } = crossingOfferCandidates[i]

		if(maxCrossQuality && gt(aux.quality, maxCrossQuality)){
			partial = true
			incomplete = false
			break
		}

		let crossingTakerPaysFinal
		let crossingTakerGetsFinal
		let takerGetsRemainder = sub(takerGetsValue, takerGot)
		let takerPaysRemainder = sub(takerPaysValue, takerPaid)
		let consumeOfferFully = tfSell
			? gte(takerGetsRemainder, aux.takerPaysFunded)
			: gte(takerPaysRemainder, aux.takerGetsFunded)

		if(consumeOfferFully){
			crossingTakerPaysFinal = sub(aux.takerPays, aux.takerPaysFunded)
			crossingTakerGetsFinal = sub(aux.takerGets, aux.takerGetsFunded)
			takerPaid = sum(takerPaid, aux.takerGetsFunded)
			takerGot = sum(takerGot, aux.takerPaysFunded)
		}else{
			if(tfSell){
				let consumedTakerPays = div(takerGetsRemainder, aux.quality)

				crossingTakerPaysFinal = sub(aux.takerPays, takerGetsRemainder)
				crossingTakerGetsFinal = sub(aux.takerGets, consumedTakerPays)
				takerPaid = sum(takerPaid, consumedTakerPays)
				takerGot = sum(takerGot, takerGetsRemainder)
			}else{
				let consumedTakerGets = mul(takerPaysRemainder, aux.quality)

				crossingTakerPaysFinal = sub(aux.takerPays, consumedTakerGets)
				crossingTakerGetsFinal = sub(aux.takerGets, takerPaysRemainder)
				takerPaid = sum(takerPaid, takerPaysRemainder)
				takerGot = sum(takerGot, consumedTakerGets)
			}

			done = true
		}

		affectedNodes.push({
			[consumeOfferFully ? 'DeletedNode' : 'ModifiedNode']: {
				LedgerEntryType: 'Offer',
				LedgerIndex: offer.index,
				FinalFields: {
					Account: offer.Account,
					Sequence: offer.Sequence,
					TakerPays: {
						...book.takerPays,
						value: crossingTakerPaysFinal.toString()
					},
					TakerGets: {
						...book.takerGets,
						value: crossingTakerGetsFinal.toString()
					}
				},
				PreviousFields: {
					TakerPays: {
						...book.takerPays,
						value: aux.takerPays.toString()
					},
					TakerGets: {
						...book.takerGets,
						value: aux.takerGets.toString()
					}
				}
			}
		})

		done = done || (
			tfSell
				? gte(takerGot, takerGetsValue)
				: gte(takerPaid, takerPaysValue)
		)

		if(done){
			partial = false
			incomplete = false
			break
		}
	}

	if(incomplete && partial){
		if(book.incomplete){
			await book.loadMore()
			return await simulateOffer({ takerPays, takerGets, tfSell, book })
		}
	}

	return {
		takerPaid,
		takerGot,
		partial,
		affectedNodes
	}
}

function createOfferAux(offer){
	let takerGets = amountFromRippled(offer.TakerGets)
	let takerPays = amountFromRippled(offer.TakerPays)
	let takerGetsFunded = amountFromRippled(offer.taker_gets_funded || offer.TakerGets)
	let takerPaysFunded = amountFromRippled(offer.taker_pays_funded || offer.TakerPays)
	
	return {
		takerGets: takerGets.value,
		takerPays: takerPays.value,
		takerGetsFunded: takerGetsFunded.value,
		takerPaysFunded: takerPaysFunded.value,
		unfunded: eq(takerPaysFunded.value, 0),
		quality: eq(takerPaysFunded.value, 0)
			? div(takerPays.value, takerGets.value)
			: div(takerPaysFunded.value, takerGetsFunded.value),
	}
}