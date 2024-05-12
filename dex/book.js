import { XFL, div, max, mul, sub } from '@xrplkit/xfl'
import { tokenFromAmount } from '@xrplkit/tokens'
import { offerFromRippled } from './offer.js'
import { ammAlign, ammFromRippled } from './amm.js'

export function bookFromRippled(book, amm){
	let takerPays
	let takerGets
	let offers = []
	let ownerFunds = {}

	if(book.offers.length === 0 && !amm){
		throw new Error(`Book is empty and no AMM passed`)
	}

	if(amm)
		amm = ammFromRippled(amm)

	for(let raw of book.offers){
		let offer = offerFromRippled(raw)

		if(raw.owner_funds){
			ownerFunds[raw.Account] = offer.takerGets.currency === 'XRP'
				? div(raw.owner_funds, '1000000')
				: XFL(raw.owner_funds)
		}

		offers.push(offer)
	}

	return {
		takerGets: tokenFromAmount(offers[0] ? offers[0].takerGets : amm.amount1),
		takerPays: tokenFromAmount(offers[0] ? offers[0].takerPays : amm.amount2),
		offers,
		ownerFunds,
		amm,
		ledgerSequence: book.ledger_index || book.ledger_current_index
	}
}

export async function loadBook({ takerPays, takerGets, ledgerSequence='validated', limit=100, socket }){
	let count = limit
	let book = {
		takerPays,
		takerGets,
		ledgerSequence,
		offers: [],
		transferFee: sub(
			(await Promise.all(
				[takerPays, takerGets]
					.filter(token => token.currency !== 'XRP')
					.map(async token => (await socket.request({ command: 'account_info', account: token.issuer})).account_data.TransferRate)
			))
			.filter(Boolean)
			.map(transferRate => div(transferRate, 1000000000))
			.reduce((total, rate) => mul(total, rate), 1),
			1
		),
		amm: null,
		incomplete: true,
		loadMore: async () => {
			let result = await socket.request({
				command: 'book_offers',
				ledger_index: ledgerSequence,
				taker_gets: {
					currency: takerGets.currency,
					issuer: takerGets.issuer
				},
				taker_pays: {
					currency: takerPays.currency,
					issuer: takerPays.issuer
				},
				limit: count
			})

			if(result.offers.length > book.offers.length){
				Object.assign(book, bookFromRippled(result))
				count += limit
			}else{
				book.incomplete = false
			}
		}
	}

	
	await book.loadMore()

	try{
		book.amm = ammFromRippled(
			(await socket.request({
				command: 'amm_info',
				asset: {
					currency: takerGets.currency,
					issuer: takerGets.issuer
				},
				asset2: {
					currency: takerPays.currency,
					issuer: takerPays.issuer
				},
				ledger_index: ledgerSequence
			})).amm
		)
	}catch{}

	return book
}

export function getBookSpotPrice(book){
	if(book.offers.length === 0 && !book.amm)
		return

	let quality = book.offers[0]?.quality
	
	if(book.amm){
		let ammAligned = ammAlign(book.amm, book.takerPays)
		let poolQuality = div(ammAligned.poolPays.value, ammAligned.poolGets.value)

		quality = quality
			? max(quality, poolQuality)
			: poolQuality
	}

	return div(1, quality)
}