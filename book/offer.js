import { div } from '@xrplkit/xfl'
import { amountFromRippled } from '@xrplkit/tokens'


export function offerFromRippled(offer){
	let takerGets = amountFromRippled(offer.TakerGets)
	let takerPays = amountFromRippled(offer.TakerPays)
	let takerGetsFunded = amountFromRippled(offer.taker_gets_funded || offer.TakerGets)
	let takerPaysFunded = amountFromRippled(offer.taker_pays_funded || offer.TakerPays)
	
	return {
		index: offer.index,
		account: offer.Account,
		sequence: offer.Sequence,
		expiration: offer.Expiration,
		takerGets,
		takerPays,
		takerGetsFunded,
		takerPaysFunded,
		quality: div(takerGets.value, takerPays.value),
	}
}