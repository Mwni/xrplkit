import { sub, div, mul } from '@xrplkit/xfl'
import { offerFromRippled } from './offer.js'
import { ammFromRippled } from './amm.js'

export async function loadBook({ takerPays, takerGets, ledgerSequence='validated', limit=100, socket }){
	let count = limit
	let book = {
		takerPays,
		takerGets,
		ledgerSequence,
		offers: [],
		/*transferFee: sub(
			(await Promise.all(
				[takerPays, takerGets]
					.filter(token => token.currency !== 'XRP')
					.map(async token => (await socket.request({ command: 'account_info', account: token.issuer})).account_data.TransferRate)
			))
			.filter(Boolean)
			.map(transferRate => div(transferRate, 1000000000))
			.reduce((total, rate) => mul(total, rate), 1),
			1
		),*/
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
				book.offers.length = 0
				book.offers.push(...result.offers.map(offerFromRippled))
				book.ledgerSequence = result.ledger_index || result.ledger_current_index
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