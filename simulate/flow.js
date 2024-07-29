// This implementation is derived from
// https://ripple.com/reports/Payment-Engine-System-Design.pdf

import { div, eq, gt, lt, lte, sum, sub, mul, neg, sqrt, min } from '@xrplkit/xfl'
import { getBookSignature, cloneBook, filterExpiredBookOffers, getBookSpotQuality } from '@xrplkit/book'
import { isSameToken } from '@xrplkit/tokens'
import { alignAMM, swapInAMM, swapOutAMM } from '@xrplkit/amm'
import { withinRelativeDistance } from './utils.js'

const maxAmount = div(`9999999999999999e80`, 2)

export async function flow({ deliver, sendMax, strands, offerCrossing, limitQuality, time }){
	let remainingOut = deliver.value
	let remainingIn = sendMax.value
	let actualOut = 0
	let actualIn = 0
	let actualAffected = {}

	while(gt(remainingOut, 0) && (!remainingIn || gt(remainingIn, 0))){
		let activeStrands = sortStrands(strands)
		let isMultiPath = activeStrands.length > 1
		let best

		if(activeStrands.length === 1 && limitQuality){
			remainingOut = limitOut(activeStrands[0], remainingOut, limitQuality)
		}

		for(let strand of activeStrands){
			if(offerCrossing && limitQuality){
				if(lt(qualityUpperBound(strand, offerCrossing), limitQuality))
					continue
			}

			let { valueIn, valueOut, finalStrand } = executeStrand(
				{ offerCrossing, limitQuality, isMultiPath, time }, 
				strand, 
				remainingIn, 
				remainingOut
			)

			if(eq(valueOut, 0))
				continue

			if(limitQuality && lt(div(valueOut, valueIn), limitQuality))
				continue

			best = { strand, finalStrand }
			actualOut = sum(actualOut, valueOut)
			actualIn = sum(actualIn, valueIn)
			remainingOut = sub(deliver.value, actualOut)
			remainingIn = sub(sendMax.value, actualIn)
			break
		}
		
		if(best){
			strands.splice(strands.indexOf(best.strand), 1, best.finalStrand)

			for(let step of best.finalStrand){
				if(step.book){
					let signature = getBookSignature(step.book)

					actualAffected[signature] = [
						...(actualAffected[signature] || []),
						...(step.affected || [])
					]
				}
			}
		}else{
			break
		}
	}

	return {
		actualIn: {
			...sendMax,
			value: actualIn
		},
		actualOut: {
			...deliver,
			value: actualOut
		},
		actualAffected: Object.entries(actualAffected).reduce(
			(affected, [signature, entries]) => ({
				...affected,
				[signature]: entries.filter(
					(x, i, list) => list.findIndex(z => z === x) === i
				)
			}),
			{}
		),
		finalStrands: strands
	}
}

function executeStrand(ctx, strand, maxIn, out){
	let originalStrand = cloneStrand(strand)
	let limitingStep = strand.length
	let limitStepOut = 0
	let stepOut = out
	let stepIn

	strand = cloneStrand(strand)

	for(let i=strand.length-1; i>=0; i--){
		let [ valueIn, valueOut ] = stepReverse(ctx, strand[i], stepOut)

		if(eq(valueOut, 0))
			return { valueOut: 0 }

		if(i === 0 && lt(maxIn, valueIn)){
			strand = cloneStrand(originalStrand)
			limitingStep = i

			;([ valueIn, valueOut ] = stepForward(ctx, strand[i], maxIn))
			
			limitStepOut = valueOut

			if(eq(valueOut, 0) || !eq(valueIn, maxIn))
				return { valueOut: 0 }

		}else if(!eq(valueOut, stepOut)){
			strand = cloneStrand(originalStrand)
			limitingStep = i
			stepOut = valueOut
			
			;([ valueIn, out ] = stepReverse(ctx, strand[i], stepOut))

			if(!eq(out, stepOut))
				return { valueOut: 0 }

			stepOut = valueIn
			limitStepOut = valueOut
		}

		stepOut = valueIn
	}

	stepIn = limitStepOut

	for(let i=limitingStep+1; i<strand.length; i++){
		let [ valueIn, valueOut ] = stepForward(ctx, strand[i], stepIn)

		if(eq(valueOut, 0) || !eq(valueIn, stepIn))
			return { valueOut: 0 }

		stepIn = valueOut
	}

	return {
		valueIn: strand[0].result[0], 
		valueOut: strand[strand.length - 1].result[1], 
		finalStrand: strand
	}
}

function stepReverse(ctx, step, out){
	if(step.book)
		return bookStepReverse(ctx, step, out)
	else
		return directStepReverse(ctx, step, out)
}

function stepForward(ctx, step, in_){
	if(step.book)
		return bookStepForward(ctx, step, in_)
	else
		return directStepForward(ctx, step, in_)
}

function bookStepReverse(ctx, step, out){
	step.reverse = true
	step.targetOut = out
	step.remainingOut = out
	step.savedIn = 0
	step.savedOut = 0
	step.result = [0, 0]
	step.ofrQ = null

	forEachOffer(ctx, step, eachOfferRev)

	return step.result
}

function bookStepForward(ctx, step, in_){
	step.reverse = false
	step.targetIn = in_
	step.remainingIn = in_
	step.savedIn = 0
	step.savedOut = 0
	step.result = [0, 0]
	step.ofrQ = null

	forEachOffer(ctx, step, eachOfferFwd)

	return step.result
}

function directStepReverse(ctx, step, out){
	return step.result = [
		mul(out, step.transferRate), 
		out
	]
}

function directStepForward(ctx, step, in_){
	return step.result = [
		in_, 
		div(in_, step.transferRate)
	]
}

function forEachOffer(ctx, step, callback){
	let offers = step.book.offers.filter(
		offer => gt(step.book.ownerFunds[offer.account], 0)
	)

	if(ctx.time)
		offers = filterExpiredBookOffers(offers, ctx.time)
	
	if(offers.length > 0){
		if(tryAMM(ctx, step, offers[0].quality, callback)){
			for(let offer of offers){
				if(!execOffer(ctx, step, offer, callback))
					break
			}
		}
	}else{
		tryAMM(ctx, step, null, callback)
	}
}

function eachOfferRev(step, offer, ofrAmt, stpAmt, ownerGives, rates){
	if(lte(step.remainingOut, 0))
		return false

	if(lte(stpAmt[1], step.remainingOut)){
		step.savedIn = sum(step.savedIn, stpAmt[0])
		step.savedOut = sum(step.savedOut, stpAmt[1])
		step.remainingOut = sub(step.remainingOut, stpAmt[1])

		consumeOffer(step, offer, ofrAmt, stpAmt, ownerGives)

		step.result = [step.savedIn, step.savedOut]
		return true
	}else{
		({ ofrAmt, stpAmt, ownerGives } = limitStepOut(step, offer, stpAmt, ofrAmt, ownerGives, rates));

		step.savedIn = sum(step.savedIn, stpAmt[0])
		step.savedOut = sum(step.savedOut, step.remainingOut)

		consumeOffer(step, offer, ofrAmt, stpAmt, ownerGives)

		step.result = [step.savedIn, step.targetOut]

		return offerFullyConsumed(step, offer)
	}
}

function eachOfferFwd(step, offer, ofrAmt, stpAmt, ownerGives, rates){
	let processMore

	if(lte(step.remainingIn, 0))
		return false

	if(lte(stpAmt[0], step.remainingIn)){
		step.savedIn = sum(step.savedIn, stpAmt[0])
		step.savedOut = sum(step.savedOut, stpAmt[1])
		step.result = [step.savedIn, step.savedOut]

		processMore = true

		return true
	}else{
		({ ofrAmt, stpAmt, ownerGives } = limitStepIn(step, offer, stpAmt, ofrAmt, ownerGives, rates));

		step.savedIn = sum(step.savedIn, step.remainingIn)
		step.savedOut = sum(step.savedOut, stpAmt[1])
		step.result = [step.targetIn, step.savedOut]

		processMore = false
	}

	step.remainingIn = sub(step.targetIn, step.result[0])

	consumeOffer(step, offer, ofrAmt, stpAmt, ownerGives)

	return processMore || offerFullyConsumed(step, offer)
}

function execOffer(ctx, step, offer, callback){
	let offerQuality = div(offer.takerGets.value, offer.takerPays.value)

	if(!step.ofrQ)
		step.ofrQ = offerQuality
	else if(!eq(step.ofrQ, offerQuality))
		return false

	if(ctx.limitQuality && lt(offerQuality, ctx.limitQuality))
		return false

	let rates = adjustRates(step, offer)
	let ofrAmt = [offer.takerPays.value, offer.takerGets.value]
	let stpAmt = [mul(ofrAmt[0], rates.in), ofrAmt[1]]
	let ownerGives = mul(ofrAmt[1], rates.out)

	if(!offer.amm){
		let funds = step.book.ownerFunds[offer.account]

		if(lt(funds, ownerGives)){
			ownerGives = funds
			stpAmt[1] = div(ownerGives, rates.out)
			ofrAmt = limitOfferOut(step, offer, ofrAmt, stpAmt[1])
			stpAmt[0] = mul(ofrAmt[0], rates.in)
		}
	}

	return callback(step, offer, ofrAmt, stpAmt, ownerGives, rates)
}

function consumeOffer(step, offer, ofrAmt, stpAmt, ownerGives){
	let affected
	let takerGetsPrevious = offer.takerGets
	let takerPaysPrevious = offer.takerPays

	offer.takerPays = {
		...offer.takerPays,
		value: sub(offer.takerPays.value, stpAmt[0])
	}

	offer.takerGets = {
		...offer.takerGets,
		value: sub(offer.takerGets.value, stpAmt[1])
	}

	if(offer.amm){
		if(isSameToken(step.book.takerGets, step.book.amm.amount2)){
			step.book.amm.amount1.value = sum(step.book.amm.amount1.value, stpAmt[0])
			step.book.amm.amount2.value = sub(step.book.amm.amount2.value, stpAmt[1])
		}else{
			step.book.amm.amount2.value = sum(step.book.amm.amount2.value, stpAmt[0])
			step.book.amm.amount1.value = sub(step.book.amm.amount1.value, stpAmt[1])
		}

		affected = {
			amm: true
		}
	}else{
		step.book.ownerFunds[offer.account] = sub(step.book.ownerFunds[offer.account], ownerGives)
		affected = {
			index: offer.index,
			sequence: offer.sequence,
			account: offer.account,
			expiration: offer.expiration,
			deleted: offerFullyConsumed(step, offer),
		}
	}

	step.affected = [
		...(step.affected || []),
		{
			...affected,
			quality: div(takerGetsPrevious.value, takerPaysPrevious.value),
			takerPaysPrevious,
			takerGetsPrevious,
			takerPaysFinal: { ...offer.takerPays },
			takerGetsFinal: { ...offer.takerGets }
		}
	]

	if(affected.deleted){
		step.book.offers.splice(step.book.offers.indexOf(offer), 1)
	}
}

function limitStepIn(step, offer, stpAmt, ofrAmt, ownerGives, rates){
	if(lt(step.remainingIn, stpAmt[0])){
		stpAmt = [step.remainingIn, stpAmt[1]]

		let inLimit = mul(stpAmt[0], rates.in)

		ofrAmt = limitOfferIn(step, offer, ofrAmt, inLimit)
		stpAmt[1] = ofrAmt[1]
		ownerGives = mul(ofrAmt[1], rates.out)
	}

	return { stpAmt, ofrAmt, ownerGives }
}

function limitStepOut(step, offer, stpAmt, ofrAmt, ownerGives, rates){
	if(lt(step.remainingOut, stpAmt[1])){
		stpAmt = [stpAmt[0], step.remainingOut]
		ownerGives = mul(stpAmt[1], rates.out)
		ofrAmt = limitOfferOut(step, offer, ofrAmt, stpAmt[1])
		stpAmt[0] = mul(ofrAmt[0], rates.in)
	}

	return { stpAmt, ofrAmt, ownerGives }
}

function limitOfferIn(step, offer, ofrAmt, limit){
	return offer.amm
		? [limit, swapInAMM(step.book.amm, { ...offer.takerPays, value: limit }).value]
		: [limit, mul(ofrAmt[1], div(limit, ofrAmt[0]))]
}

function limitOfferOut(step, offer, ofrAmt, limit){
	return offer.amm
		? [swapOutAMM(step.book.amm, { ...offer.takerGets, value: limit }).value, limit]
		: [mul(ofrAmt[0], div(limit, ofrAmt[1])), limit]
}

function tryAMM(ctx, step, quality, callback){
	let ammOffer = getAMMOffer(ctx, step, quality)

	if(ammOffer && !execOffer(ctx, step, ammOffer, callback))
		return false

	return true
}

function getAMMOffer(ctx, step, quality){
	if(!step.book.amm)
		return

	let { poolGets, poolPays } = alignAMM(step.book.amm, step.book.takerPays)
	let spotPriceQ = div(poolPays.value, poolGets.value)

	if(quality){
		if(lte(spotPriceQ, quality) || withinRelativeDistance(spotPriceQ, quality, '0.0000001'))
			return
	}

	if(ctx.isMultiPath){
		// todo
	}else if(!quality){
		let out = mul(poolPays.value, '0.99')

		return {
			amm: true,
			takerPays: {
				...poolGets,
				value: swapOutAMM(step.book.amm, {
					...step.book.takerGets,
					value: out
				}).value
			},
			takerGets: {
				...poolPays,
				value: out
			}
		}
	}else{
		let f = sub(1, step.book.amm.fee)
		let b = mul(poolGets.value, sum(1, f))
		let c = sub(
			mul(poolGets.value, poolGets.value), 
			div(mul(poolGets.value, poolPays.value), quality)
		)

		let res = sub(mul(b, b), mul(mul(4, f), c))

		if(lt(res, 0))
			return

		let nTakerPaysPropose = div(sum(neg(b), sqrt(res)), mul(f, 2))

		if(lte(nTakerPaysPropose, 0))
			return

		let nTakerPaysConstraint = sub(
			div(poolPays.value, quality), 
			div(poolGets.value, f)
		)

		let nTakerPays = min(nTakerPaysPropose, nTakerPaysConstraint)

		if(lte(nTakerPays, 0))
			return

		let takerPays = {
			...step.book.takerPays,
			value: nTakerPays
		}

		return {
			amm: true,
			takerPays,
			takerGets: swapInAMM(step.book.amm, takerPays)
		}
	}
}

function adjustRates(step, offer){
	let rates = false//!step.reverse
		? { in: step.book.transferRateOut, out: step.book.transferRateIn }
		: { in: step.book.transferRateIn, out: step.book.transferRateOut }

	return offer.amm
		? { ...rates, out: 1 }
		: rates
}

function sortStrands(strands){
	return strands
}

function limitOut(strand, remainingOut, limitQuality){
	return remainingOut
}

function qualityUpperBound(strand, offerCrossing){
	let quality = 1

	for(let step of strand){
		quality = mul(quality, getBookSpotQuality(step.book, !offerCrossing))
	}

	return quality
}

function offerFullyConsumed(step, offer){
	return lte(offer.takerPays.value, 0) || lte(offer.takerGets.value, 0)
}

function cloneStrand(strand){
	return strand.map(
		step => step.book
			? {
				...step,
				affected: step.affected ? [...step.affected] : undefined,
				book: cloneBook(step.book)
			}
			: { ...step }
	)
}