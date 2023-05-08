import { XFL, sum, sub, mul, div, eq, gt, lt, lte, min } from '@xrplkit/xfl'
import { calcOfferValues } from './offer.js'


const defaultCushion = XFL('1e-6')


export function fillOffer({ book, takerPays, takerGets, tfSell, cushion }:any){
	let filledTakerPays = XFL(0)
	let filledTakerGets = XFL(0)
	let filledPartially = true
	let affectedNodes = []
	let minQuality
	let lastQuality

	if(takerGets && eq(takerGets, 0))
		throw new Error(`Parameter "takerGets" must be greater than zero`)
	
	if(takerPays && eq(takerPays, 0))
		throw new Error(`Parameter "takerPays" must be greater than zero`)
	
	if(takerGets && takerPays)
		minQuality = div(takerPays, takerGets)
	
	if(!takerPays)
		tfSell = true

		
	for(let offer of book.offers){
		let values = calcOfferValues(offer)
		let fractionSpendable = 1

		if(!values.funded)
			continue

		if(minQuality && lt(values.quality, minQuality))
			break

		if(tfSell){
			let spendableRemainder = sub(takerGets, filledTakerGets)

			if(lte(spendableRemainder, values.takerPays)){
				fractionSpendable = div(spendableRemainder, values.takerPays)
				filledPartially = false
			}
		}else{
			let fillableRemainder = sub(takerPays, filledTakerPays)

			if(lte(fillableRemainder, values.takerGets)){
				fractionSpendable = div(fillableRemainder, values.takerGets)
				filledPartially = false
			}
		}


		let fractional = lt(fractionSpendable, 1)
		let consumedTakerGets = mul(values.takerGets, fractionSpendable)
		let consumedTakerPays = mul(values.takerPays, fractionSpendable)

		filledTakerPays = sum(filledTakerPays, consumedTakerGets)
		filledTakerGets = sum(filledTakerGets, consumedTakerPays)
		lastQuality = values.quality

		affectedNodes.push({
			[fractional ? 'ModifiedNode' : 'DeletedNode']: {
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

		if(fractional)
			break
	}

	if(tfSell){
		takerGets = filledTakerGets
		takerPays = mul(
			mul(filledTakerGets, lastQuality),
			sub(1, cushion || defaultCushion)
		)
	}else{
		takerPays = filledTakerPays
		takerGets = mul(
			div(filledTakerPays, lastQuality),
			sum(1, cushion || defaultCushion)
		)
	}

	return {
		takerPays,
		takerGets,
		filledTakerPays,
		filledTakerGets,
		filledPartially,
		affectedNodes
	}
}