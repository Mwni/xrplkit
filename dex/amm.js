import { sum, sub, mul, div } from '@xrplkit/xfl'
import { amountFromRippled } from './amount.js'
import { isSameToken } from './token.js'

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