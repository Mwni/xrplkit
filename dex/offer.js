import { sum, sub, mul, div, eq, lt, lte, gt, gte, neg, min, max, sqrt } from '@xrplkit/xfl'
import { loadBook } from './book.js'
import { isSameToken } from './token.js'
import { amountFromRippled } from './amount.js'
import { ammAlign, ammSwapIn, ammSwapOut } from './amm.js'


export async function simulateOffer({ takerPays, takerGets, tfSell, time, book, socket }){
	let takerPaysInitial
	let takerGetsInitial
	let takerPaysCurrent
	let takerGetsCurrent
	let ammInitial
	let ammCurrent
	let partial = true
	let incomplete = true
	let done = false
	let affectedOffers = []
	let affectedAMM = null
	let minCrossQuality

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
		
		takerPaysInitial = takerPays.value
		takerPaysCurrent = takerPays.value
	}

	if(takerGets?.currency){
		if(!isSameToken(takerGets, book.takerPays))
			throw new Error(`Parameter "takerGets" is different than in the passed book`)
		
		takerGetsInitial = takerGets.value
		takerGetsCurrent = takerGets.value
	}
	
	if(takerPaysInitial && eq(takerPaysInitial, 0))
		throw new Error(`Value of "takerPays" must be greater than zero`)

	if(takerGetsInitial && eq(takerGetsInitial, 0))
		throw new Error(`Value of "takerGets" must be greater than zero`)
	
	if(takerGetsInitial && takerPaysInitial)
		minCrossQuality = div(takerPaysInitial, takerGetsInitial)

	if(tfSell && !takerGetsInitial)
		throw new Error(`Parameter "takerGets" must be set for an offer with tfSell=true`)
	else if(!takerPaysInitial)
		tfSell = true

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
		let bookOffer = fundedBookOffers[bookIndex]
		let ammOffer = ammCurrent
			? generateSyntheticAMMOffer(
				ammInitial, 
				ammCurrent, 
				{ ...book.takerPays, value: takerGetsCurrent },
				{ ...book.takerGets, value: takerPaysCurrent },
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

		if(minCrossQuality && lt(offer.quality, minCrossQuality)){
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
			? gte(takerGetsCurrent, crossingTakerPaysFunded)
			: gte(takerPaysCurrent, crossingTakerGetsFunded)

		if(consumeOfferFully){
			crossingTakerPaysConsumed = crossingTakerPaysFunded
			crossingTakerGetsConsumed = crossingTakerGetsFunded
		}else{
			if(tfSell){
				crossingTakerPaysConsumed = takerGetsCurrent
				crossingTakerGetsConsumed = mul(takerGetsCurrent, offer.quality)
			}else{
				crossingTakerPaysConsumed = div(takerPaysCurrent, offer.quality)
				crossingTakerGetsConsumed = takerPaysCurrent
			}
			done = true
		}

		takerPaysCurrent = sub(takerPaysCurrent, crossingTakerGetsConsumed)
		takerGetsCurrent = sub(takerGetsCurrent, crossingTakerPaysConsumed)

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
				synthetic: true,
			}
		}else{
			bookIndex++
			ownerFunds[offer.account] = sub(ownerFunds[offer.account], mul(crossingTakerGetsConsumed, sum(1, book.transferFee)))
			affectedOffer = {
				index: offer.index,
				sequence: offer.sequence,
				account: offer.account,
				deleted: consumeOfferFully && gte(crossingTakerGetsConsumed, offer.takerGets.value),
				expiration: offer.expiration
			}
		}

		affectedOffers.push({
			...affectedOffer,
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
		
		done = done || (
			tfSell
				? lte(takerGetsCurrent, 0)
				: lte(takerPaysCurrent, 0)
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
		takerPaid: {
			...takerPays,
			value: sub(takerPaysInitial, takerPaysCurrent)
		},
		takerGot: {
			...takerGets,
			value: sub(takerGetsInitial, takerGetsCurrent)
		},
		partial,
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

export function offerFromRippled(offer){
	let takerGets = amountFromRippled(offer.TakerGets)
	let takerPays = amountFromRippled(offer.TakerPays)
	let takerGetsFunded = amountFromRippled(offer.taker_gets_funded || offer.TakerGets)
	let takerPaysFunded = amountFromRippled(offer.taker_pays_funded || offer.TakerPays)
	let unfunded = eq(takerPaysFunded.value, 0)
	
	return {
		index: offer.index,
		account: offer.Account,
		sequence: offer.Sequence,
		expiration: offer.Expiration,
		takerGets: takerGets,
		takerPays: takerPays,
		takerGetsFunded: takerGetsFunded,
		takerPaysFunded: takerPaysFunded,
		unfunded,
		quality: unfunded
			? div(takerGets.value, takerPays.value)
			: div(takerGetsFunded.value, takerPaysFunded.value),
	}
}

function generateSyntheticAMMOffer(ammInitial, ammCurrent, amountIn, amountOut, minQuality, tfSell){
	if(minQuality){
		let poolAligned = ammAlign(ammCurrent, amountIn)
		let poolSPQ = div(poolAligned.poolPays.value, poolAligned.poolGets.value)

		if(lte(poolSPQ, minQuality) || withinRelativeDistance(poolSPQ, minQuality, '0.0000001'))
			return

		let f = sub(1, ammInitial.fee)
		let b = mul(poolAligned.poolGets.value, sum(1, f))
		let c = sub(
			mul(poolAligned.poolGets.value, poolAligned.poolGets.value), 
			div(mul(poolAligned.poolGets.value, poolAligned.poolPays.value), minQuality)
		)

		let res = sub(mul(b, b), mul(mul(4, f), c))

		if(lt(res, 0))
			return

		let nTakerPaysPropose = div(sum(neg(b), sqrt(res)), mul(f, 2))

		if(lte(nTakerPaysPropose, 0))
			return

		let nTakerPaysConstraint = sub(
			div(poolAligned.poolPays.value, minQuality), 
			div(poolAligned.poolGets.value, f)
		)

		let nTakerPays = min(nTakerPaysPropose, nTakerPaysConstraint)

		if(lte(nTakerPays, 0))
			return

		if(lt(nTakerPays, amountIn.value)){
			let takerPays = {
				...amountIn,
				value: nTakerPays
			}
	
			let takerGets = ammSwapIn(ammCurrent, takerPays)
			let quality = div(takerGets.value, takerPays.value)
			let buyOfferSizeExceeded = !tfSell && gt(takerGets.value, amountOut.value)

			if(!buyOfferSizeExceeded){
				return {
					takerPays: takerPays,
					takerGets: takerGets,
					quality,
					syntheticAMM: true
				}
			}
		}
	}

	let takerPays = tfSell ? amountIn : ammSwapOut(ammCurrent, amountOut)
	let takerGets = tfSell ? ammSwapIn(ammCurrent, amountIn) : amountOut

	return {
		takerPays,
		takerGets,
		quality: div(takerGets.value, takerPays.value),
		syntheticAMM: true
	}
}

function withinRelativeDistance(value1, value2, distance){
	if(eq(value1, value2))
		return true

	let valueMin = min(value1, value2)
	let valueMax = max(value1, value2)

	return lt(div(sub(valueMax, valueMin), valueMax), distance)
}


const fib = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610, 987,
	1597, 2584, 4181, 6765, 10946, 17711, 28657, 46368, 75025, 121393,
	196418, 317811, 514229, 832040]

function generateAMMFibSeqOffer(initial, current, iter, takerGetsAsset){
	let initialAligned = ammAlign(initial, takerGetsAsset)
	let takerPays = {
		...initialAligned.poolGets,
		value: div(initialAligned.poolGets.value, 40000)
	}
	let takerGets = swapAssetAMM(initial, takerPays)

	if(iter > 0){
		takerGets.value = mul(takerGets.value, fib[iter - 1])
		takerPays = swapAssetAMM(current, takerGets)
	}

	return { 
		takerPays,
		takerGets,
		takerPaysFunded: takerPays,
		takerGetsFunded: takerGets,
		quality: div(takerGets.value, takerPays.value),
		syntheticAMM: true
	}
}