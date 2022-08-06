import { XFL, sum, sub, mul, div, eq, lt, lte, min } from '@xrplkit/xfl'
import { calcOfferValues } from './offer.js'


export function fillOffer({ book, takerPays, takerGets, tfSell, cushion }){
	let filledTakerPays = XFL(0)
	let filledTakerGets = XFL(0)
	let affectedNodes = []
	let partial = true
	let minQuality

	if(takerGets && eq(takerGets, 0))
		throw new Error(`Parameter "takerGets" must be greater than zero`)
	
	if(takerPays && eq(takerPays, 0))
		throw new Error(`Parameter "takerGets" must be greater than zero`)
	
	if(takerGets && takerPays)
		minQuality = div(takerPays, takerGets)
	
	if(!takerPays)
		tfSell = true

		
	for(let offer of book.offers){
		let values = calcOfferValues(offer)
		let fractionFinal = 1
		let fractionSpendable = 1
		let fractionAcceptable = 1

		if(!values.funded)
			continue

		if(tfSell){
			let spendableRemainder = sub(takerGets, filledTakerGets)

			if(lte(spendableRemainder, values.takerPays)){
				fractionSpendable = div(spendableRemainder, values.takerPays)
			}
		}else{
			let fillableRemainder = sub(takerPays, filledTakerPays)

			if(lte(fillableRemainder, values.takerGets)){
				fractionSpendable = div(fillableRemainder, values.takerGets)
			}
		}

		if(minQuality && lt(values.quality, minQuality)){
			fractionAcceptable = min(
				1,
				div(
					sub(
						filledTakerPays,
						mul(filledTakerGets, minQuality)
					),
					sub(
						mul(values.takerPays, minQuality),
						values.takerGets,
					)
				)
			)
		}

		if(lt(fractionSpendable, fractionAcceptable)){
			fractionFinal = fractionSpendable
			partial = false
		}else{
			fractionFinal = fractionAcceptable
		}

		if(eq(fractionFinal, 0))
			break

		let consumedTakerGets = mul(values.takerGets, fractionFinal)
		let consumedTakerPays = mul(values.takerPays, fractionFinal)

		filledTakerPays = sum(filledTakerPays, consumedTakerGets)
		filledTakerGets = sum(filledTakerGets, consumedTakerPays)

		affectedNodes.push({
			[eq(fractionFinal, 1) ? 'DeletedNode' : 'ModifiedNode']: {
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
	}

	if(cushion){
		//todo
	}

	return {
		takerPays: filledTakerPays,
		takerGets: filledTakerGets,
		affectedNodes,
		partial
	}
}