import XFL from '@xrplkit/xfl'
import { calcOfferValues } from './offer.js'


const defaultCushion = new XFL('1e-6')


export function fillOffer({ book, takerPays, takerGets, tfSell, cushion }:any){
	let filledTakerPays = new XFL(0)
	let filledTakerGets = new XFL(0)
	let filledPartially = true
	let affectedNodes = []
	let minQuality
	let lastQuality

	if(takerGets && XFL.eq(takerGets, 0))
		throw new Error(`Parameter "takerGets" must be greater than zero`)
	
	if(takerPays && XFL.eq(takerPays, 0))
		throw new Error(`Parameter "takerPays" must be greater than zero`)
	
	if(takerGets && takerPays)
		minQuality = XFL.div(takerPays, takerGets)
	
	if(!takerPays)
		tfSell = true

		
	for(let offer of book.offers){
		let values = calcOfferValues(offer)
		let fractionSpendable: any = 1

		if(!values.funded)
			continue

		if(minQuality && XFL.lt(values.quality, minQuality))
			break

		if(tfSell){
			let spendableRemainder = XFL.sub(takerGets, filledTakerGets)

			if(XFL.lte(spendableRemainder, values.takerPays)){
				fractionSpendable = XFL.div(spendableRemainder, values.takerPays)
				filledPartially = false
			}
		}else{
			let fillableRemainder = XFL.sub(takerPays, filledTakerPays)

			if(XFL.lte(fillableRemainder, values.takerGets)){
				fractionSpendable = XFL.div(fillableRemainder, values.takerGets)
				filledPartially = false
			}
		}


		let fractional = XFL.lt(fractionSpendable, 1)
		let consumedTakerGets = XFL.mul(values.takerGets, fractionSpendable)
		let consumedTakerPays = XFL.mul(values.takerPays, fractionSpendable)

		filledTakerPays = XFL.sum(filledTakerPays, consumedTakerGets)
		filledTakerGets = XFL.sum(filledTakerGets, consumedTakerPays)
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
						value: XFL.sub(
							values.takerPaysRaw,
							consumedTakerPays
						)
							.toString()
					},
					TakerGets: {
						...book.takerGets,
						value: XFL.sub(
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
		takerPays = XFL.mul(
			XFL.mul(filledTakerGets, lastQuality),
			XFL.sub(1, cushion || defaultCushion)
		)
	}else{
		takerPays = filledTakerPays
		takerGets = XFL.mul(
			XFL.div(filledTakerPays, lastQuality),
			XFL.sum(1, cushion || defaultCushion)
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
