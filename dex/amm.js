import { sum, sub, mul, div, min, lte, lt, gt, neg, sqrt } from '@xrplkit/xfl'
import { amountFromRippled, isSameToken } from '@xrplkit/tokens'
import { withinRelativeDistance } from './utils.js'

export function ammSwapIn(amm, amountIn){
	let { poolPays, poolGets, fee } = ammAlign(amm, amountIn)
	let amountInWithFee = mul(amountIn.value, sub(1, fee))
	let poolGetsFinal = sum(poolGets.value, amountInWithFee)
	let poolPaysFinal = div(mul(poolGets.value, poolPays.value), poolGetsFinal)

	return {
		...poolPays,
		value: sub(poolPays.value, poolPaysFinal)
	}
}

export function ammSwapOut(amm, amountOut){
	let { poolPays: poolGets, poolGets: poolPays, fee } = ammAlign(amm, amountOut)
	let poolPaysFinal = sub(poolPays.value, amountOut.value)
	let poolGetsFindal = div(mul(poolGets.value, poolPays.value), poolPaysFinal)
	
	return {
		...poolGets,
		value: div(sub(poolGetsFindal, poolGets.value), sub(1, fee))
	}
}

export function ammFromRippled(amm){
	return {
		amount1: amountFromRippled(amm.amount),
		amount2: amountFromRippled(amm.amount2),
		fee: div(amm.trading_fee, '100000')
	}
}

export function ammAlign(amm, assetIn){
	let amounts = [amm.amount1, amm.amount2]

	if(isSameToken(assetIn, amounts[1]))
		amounts.reverse()

	return {
		poolGets: amounts[0],
		poolPays: amounts[1],
		fee: amm.fee
	}
}

export function ammGenerateSyntheticOffer(ammInitial, ammCurrent, amountIn, amountOut, minQuality, tfSell){
	let limitQuality

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

		let takerPays = {
			...amountIn,
			value: nTakerPays
		}

		let takerGets = ammSwapIn(ammCurrent, takerPays)
		let buyOfferSizeExceeded = !tfSell && gt(takerGets.value, amountOut.value)
		let quality = limitQuality = div(takerGets.value, takerPays.value)

		if(lt(nTakerPays, amountIn.value) && !buyOfferSizeExceeded){
			return {
				takerPays: takerPays,
				takerGets: takerGets,
				quality,
				limitQuality,
				syntheticAMM: true
			}
		}
	}

	let takerPays = tfSell ? amountIn : ammSwapOut(ammCurrent, amountOut)
	let takerGets = tfSell ? ammSwapIn(ammCurrent, amountIn) : amountOut
	let quality = div(takerGets.value, takerPays.value)

	return {
		takerPays,
		takerGets,
		quality,
		limitQuality: limitQuality || quality,
		syntheticAMM: true
	}
}

const fib = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610, 987,
	1597, 2584, 4181, 6765, 10946, 17711, 28657, 46368, 75025, 121393,
	196418, 317811, 514229, 832040]

export function ammGenerateFibSeqOffer(initial, current, iter, takerGetsAsset){
	let initialAligned = ammAlign(initial, takerGetsAsset)
	let takerPays = {
		...initialAligned.poolGets,
		value: div(initialAligned.poolGets.value, 40000)
	}
	let takerGets = ammSwapIn(initial, takerPays)

	if(iter > 0){
		takerGets.value = mul(takerGets.value, fib[iter - 1])
		takerPays = ammSwapOut(current, takerGets)
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