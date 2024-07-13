import { sum, sub, mul, div, lt, lte, gt, gte } from '@xrplkit/xfl'
import { isSameToken } from '@xrplkit/tokens'

const epsilon = '0.000000001'

export async function simulateExchange({ inMin, inMax, outMin, outMax, tfLimitQuality, time, book }){
	let inCurrent = 0
	let outCurrent = 0
	let ammInitial
	let ammCurrent
	let partial = true
	let incomplete = true
	let done = false
	let affectedOffers = []
	let affectedAMM = null
	let tfSell = !outMax
	let limitQuality = (outMax || outMin) && inMax 
		? div((outMax || outMin).value, inMax.value)
		: undefined

	if(book.amm){
		ammInitial = structuredClone(book.amm)
		ammCurrent = structuredClone(book.amm)
	}

	if(!time){
		time = Math.floor(Date.now() / 1000) - 946684800
	}

	let bookIndex = 0
	let ownerFunds = { ...book.ownerFunds }
	let fundedBookOffers = book.offers
		.filter(offer => !offer.unfunded)
		.filter(offer => !offer.expiration || offer.expiration >= time)

	while(true){
		let inRemaining = inMax && sub(inMax.value, inCurrent)
		let outRemaining = (outMax || outMin) && sub((outMax || outMin).value, outCurrent)
		let stepQuality = inRemaining && outRemaining && div(outRemaining, inRemaining)

		let bookOffer = fundedBookOffers[bookIndex]
		let ammOffer = ammCurrent
			? ammGenerateSyntheticOffer(
				ammInitial, 
				ammCurrent, 
				{ ...book.takerPays, value: inRemaining },
				{ ...book.takerGets, value: outRemaining },
				bookOffer?.quality,
				tfSell
			)
			: null

		let offer = gt(ammOffer?.quality || 0, bookOffer?.quality || 0)
			? ammOffer
			: bookOffer

		if(!offer){
			partial = true
			incomplete = true
			break
		}

		if((limitQuality || stepQuality) && lt(offer.limitQuality || offer.quality, tfLimitQuality ? limitQuality : stepQuality)){
			partial = true
			incomplete = false
			break
		}

		let crossingTakerPaysConsumed
		let crossingTakerGetsConsumed
		let crossingTakerPaysFunded = offer.takerPays.value
		let crossingTakerGetsFunded = offer.takerGets.value
		let affectedOffer
		
		if(offer.account){
			let ownerFundsAvailable = mul(ownerFunds[offer.account], sub(1, book.transferFee))

			if(offer.account && lt(ownerFundsAvailable, crossingTakerGetsFunded)){
				if(lte(ownerFundsAvailable, 0)){
					bookIndex++
					continue
				}
	
				crossingTakerGetsFunded = ownerFundsAvailable
				crossingTakerPaysFunded = div(crossingTakerGetsFunded, offer.quality)
			}
		}

		let consumeOfferFully = tfSell
			? gte(inRemaining, crossingTakerPaysFunded)
			: gte(outRemaining, crossingTakerGetsFunded)

		if(consumeOfferFully){
			crossingTakerPaysConsumed = crossingTakerPaysFunded
			crossingTakerGetsConsumed = crossingTakerGetsFunded
		}else{
			if(tfSell){
				crossingTakerPaysConsumed = inRemaining
				crossingTakerGetsConsumed = mul(inRemaining, offer.quality)
			}else{
				crossingTakerPaysConsumed = div(outRemaining, offer.quality)
				crossingTakerGetsConsumed = outRemaining
			}
			done = true
		}

		inCurrent = sum(inCurrent, crossingTakerPaysConsumed)
		outCurrent = sum(outCurrent, crossingTakerGetsConsumed)

		if(offer.syntheticAMM){
			if(isSameToken(book.takerGets, ammCurrent.amount2)){
				ammCurrent.amount1.value = sum(ammCurrent.amount1.value, crossingTakerPaysConsumed)
				ammCurrent.amount2.value = sub(ammCurrent.amount2.value, crossingTakerGetsConsumed)
			}else{
				ammCurrent.amount2.value = sum(ammCurrent.amount2.value, crossingTakerPaysConsumed)
				ammCurrent.amount1.value = sub(ammCurrent.amount1.value, crossingTakerGetsConsumed)
			}

			affectedAMM = {
				amount1Previous: ammInitial.amount1,
				amount2Previous: ammInitial.amount2,
				amount1Final: ammCurrent.amount1,
				amount2Final: ammCurrent.amount2
			}
			affectedOffer = {
				amm: true,
				limitQuality: offer.limitQuality,
			}
		}else{
			bookIndex++
			ownerFunds[offer.account] = sub(ownerFunds[offer.account], mul(crossingTakerGetsConsumed, sum(1, book.transferFee)))
			affectedOffer = {
				index: offer.index,
				sequence: offer.sequence,
				account: offer.account,
				deleted: consumeOfferFully && gte(crossingTakerGetsConsumed, offer.takerGets.value),
				expiration: offer.expiration,
				limitQuality: offer.quality
			}
		}

		affectedOffers.push({
			...affectedOffer,
			limitQuality: mul(affectedOffer.limitQuality, sub(1, epsilon)),
			takerPaysPrevious: offer.takerPays,
			takerGetsPrevious: offer.takerGets,
			takerPaysFinal: {
				...offer.takerPays,
				value: sub(offer.takerPays.value, crossingTakerPaysConsumed)
			},
			takerGetsFinal: {
				...offer.takerGets,
				value: sub(offer.takerGets.value, crossingTakerGetsConsumed)
			}
		})

		if(tfSell ? lte(sub(inRemaining, crossingTakerPaysConsumed), 0) : lte(sub(outRemaining, crossingTakerGetsConsumed), 0))
			done = true

		if(done){
			partial = false
			incomplete = false
			break
		}
	}

	if(incomplete && partial){
		if(book.incomplete){
			await book.loadMore()
			return await simulateExchange({ inMin, inMax, outMin, outMax, tfLimitQuality, time, book })
		}
	}

	if((inMin && lt(inCurrent, inMin.value)) || (outMin && lt(outCurrent, outMin.value))){
		return {
			pathDry: true
		}
	}

	if(tfSell){
		outCurrent = mul(outCurrent, sub(1, epsilon))
	}else{
		inCurrent = mul(inCurrent, sub(1, epsilon))
	}

	return {
		inFilled: {
			...(inMin || inMax),
			value: inCurrent
		},
		outFilled: {
			...(outMin || outMax),
			value: outCurrent
		},
		partial,
		limitQuality: affectedOffers[affectedOffers.length - 1]?.limitQuality,
		affectedOffers,
		affectedAMM,
		finalBook: {
			takerPays: book.takerPays,
			takerGets: book.takerGets,
			ownerFunds,
			amm: ammCurrent,
			offers: book.offers
				.filter(offer => !affectedOffers.some(
					affected => affected.index === offer.index && affected.deleted
				))
				.map(offer => {
					let affected = affectedOffers.find(affected => affected.index === offer.index)

					if(affected)
						return {
							...offer,
							takerPays: { ...affected.takerPaysFinal },
							takerGets: { ...affected.takerGetsFinal },
							takerGetsFunded: undefined,
							takerPaysFunded: undefined
						}
					else
						return { ...offer }
				})
		}
	}
}