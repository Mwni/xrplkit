import { EventEmitter } from '@mwni/events'
import { formatCurrency } from '@xrplkit/amount'
import { div } from '@xrplkit/xfl'
import { fillOffer } from './fill.js'
import { diffLedger, diffTx } from './diff.js'
import { calcOfferValues } from './offer.js'


export default function Book({ socket, takerPays, takerGets }){
	let book = new EventEmitter()

	takerPays = {
		currency: takerPays.currency,
		issuer: takerPays.issuer
	}

	takerGets = {
		currency: takerGets.currency,
		issuer: takerGets.issuer
	}


	return Object.assign(
		book,
		{
			offers: [],
			takerPays,
			takerGets,

			async load({ limit = 1000, ledgerSequence = 'current' } = {}){
				let result = await socket.request({
					command: 'book_offers',
					ledger_index: ledgerSequence,
					taker_gets: this.takerGets,
					taker_pays: this.takerPays,
					limit
				})
		
				book.offers.length = 0
				book.offers.push(...result.offers)
				book.ledgerSequence = result.ledger_current_index
				events.emit('update')
			},

			async fillLazy({ initial = 5, stride = 10, ...args }){
				let limit = initial
				let steps = 0

				while(true){
					let offerCount = offers.length

					await book.load(limit)

					let res = fillOffer({ book, ...args })

					if(!res.incomplete || offers.length <= offerCount)
						return res

					limit += stride * ++steps
				}
			},

			fill({ takerGets, takerPays, tfSell = false, cushion = 0 }){
				return fillOffer({ book, takerPays, takerGets, tfSell, cushion })
			},

			diffLedger(ledger){
				diffLedger({ book, ledger })
			},

			diffTx(tx){
				diffTx({ book, tx })
			},

			getBestPrice(){
				for(let offer of book.offers){
					let { funded, quality } = calcOfferValues(offer)

					if(funded)
						return div(1, quality)
				}
			},

			toString(){
				return `Book (${formatCurrency(takerGets)} / ${formatCurrency(takerPays)})`
			}
		}
	)
}