import { fromRippled as amountFromRippled } from '@xrplkit/amount'
import { XFL, div, eq } from '@xrplkit/xfl'


export function calcOfferValues(offer){
	let takerGets = amountFromRippled(offer.TakerGets)
	let takerPays = amountFromRippled(offer.TakerPays)
	let takerGetsFunded = amountFromRippled(offer.taker_gets_funded || offer.TakerGets)
	let takerPaysFunded = amountFromRippled(offer.taker_pays_funded || offer.TakerPays)
	
	return {
		takerGets: takerGetsFunded.value,
		takerGetsRaw: takerGets.value,
		takerPays: takerPaysFunded.value,
		takerPaysRaw: takerPays.value,
		funded: !eq(takerPaysFunded.value, 0),
		quality: eq(takerPaysFunded.value, 0)
			? div(takerGets.value, takerPays.value)
			: div(takerGetsFunded.value, takerPaysFunded.value),
	}
}