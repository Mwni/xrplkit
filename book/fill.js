import { XFL, sum, sub, mul, div, eq, lt, lte } from '@xrplkit/xfl'
import { calcOfferValues } from './offer.js'


export function fillOffer({ book, takerPays, takerGets, tfSell, cushion }){
	let filledTakerPays = XFL(0)
	let filledTakerGets = XFL(0)
	let affectedNodes = []
	let partial = true
	let minQuality
	
	if(takerGets && takerPays)
		minQuality = div(takerPays, takerGets)
	
	if(!takerPays)
		tfSell = true

	

	for(let offer of book.offers){
		let values = calcOfferValues(offer)
		let fractionConsume = 1

		if(minQuality && lt(values.quality, minQuality))
			continue

		if(tfSell){
			let spendableRemainder = sub(takerGets, filledTakerGets)

			if(lte(spendableRemainder, values.takerPays)){
				fractionConsume = div(spendableRemainder, values.takerPays)
				partial = false
			}
		}else{
			let fillableRemainder = sub(takerPays, filledTakerPays)

			if(lte(fillableRemainder, values.takerGets)){
				fractionConsume = div(fillableRemainder, values.takerGets)
				partial = false
			}
		}

		let consumedTakerGets = mul(values.takerGets, fractionConsume)
		let consumedTakerPays = mul(values.takerPays, fractionConsume)

		filledTakerPays = sum(filledTakerPays, consumedTakerGets)
		filledTakerGets = sum(filledTakerGets, consumedTakerPays)

		affectedNodes.push({
			[eq(fractionConsume, 1) ? 'DeletedNode' : 'ModifiedNode']: {
				LedgerEntryType: 'Offer',
				LedgerIndex: offer.index,
				FinalFields: {
					Account: offer.Account,
					Sequence: offer.Sequence,
					TakerPays: {
						...book.takerPays,
						value: sub(
							values.takerPaysRaw,
							consumedTakerPays
						)
							.toString()
					},
					TakerGets: {
						...book.takerGets,
						value: sub(
							values.takerGetsRaw,
							consumedTakerGets
						)
							.toString()
					}
				},
				PreviousFields: {
					TakerPays: {
						...book.takerPays,
						value: values.takerPaysRaw
							.toString()
					},
					TakerGets: {
						...book.takerGets,
						value: values.takerGetsRaw
							.toString()
					}
				}
			}
		})

		if(!partial)
			break
	}

	if(cushion){
		//todo
	}

	return {
		takerPays: filledTakerPays,
		takerGets: filledTakerGets,
		affectedNodes,
		partial,
	}
}