import { EventEmitter } from '@mwni/events'
import Decimal from 'decimal.js'
import { fromRippled as amountFromRippled } from '@xrplworks/amount'



export class Book{
	constructor({ socket, takerPays, takerGets, ledgerIndex }){
		this.socket = socket
		this.takerPays = takerPays
		this.takerGets = takerGets
		this.ledgerIndex = ledgerIndex || 'validated'
		this.offers = []
	}


	async load(){
		let { offers } = await this.socket.request({
			command: 'book_offers',
			ledger_index: this.ledgerIndex,
			taker_gets: this.takerGets,
			taker_pays: this.takerPays,
			limit: 99999
		})

		this.offers = offers.map(this.#parseOffer)
	}

	async subscribe(){
		
	}


	fill({ takerPays, takerGets, cushion }){
		if(this.offers.length === 0)
			throw new Error('cannot fill: empty book')

		let amountPay
		let amountGet = new Decimal(0)
		let keyPay
		let keyGet

		if(takerPays){
			amountPay = new Decimal(takerPays)
			keyPay = 'takerPays'
			keyGet = 'takerGets'
		}else{
			amountPay = new Decimal(takerGets)
			keyPay = 'takerGets'
			keyGet = 'takerPays'
		}


		for(let offer of this.offers){
			let payValue = offer[keyPay].value
			let getValue = offer[keyGet].value

			if(amountPay.lt(payValue)){
				let fraction = amountPay.div(payValue)

				amountPay = new Decimal(0)
				amountGet = amountGet.plus(fraction.times(getValue))
				break
			}

			amountPay = amountPay.minus(payValue)
			amountGet = amountGet.plus(getValue)
		}

		if(cushion){
			takerGets = takerGets.times(1 - cushion)
		}

		return {
			partial: amountPay.gt(0),
			takerPays: takerPays
				? Decimal.sub(takerPays, amountPay).toString()
				: amountGet.toString(),
			takerGets: takerPays
				? amountGet.toString()
				: Decimal.sub(takerGets, amountPay).toString()
		}
	}


	#parseOffer(offer){
		return {
			takerGets: amountFromRippled(offer.TakerGets),
			takerPays: amountFromRippled(offer.TakerPays),
			id: `${offer.Account}:${offer.Sequence}`
		}
	}
}