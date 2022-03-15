import { EventEmitter } from '@mwni/events'
import Decimal from 'decimal.js'
import { fromRippled as amountFromRippled } from '@xrplworks/amount'
import { compare as compareCurrency } from '@xrplworks/currency'



export class Book extends EventEmitter{
	constructor({ socket, takerPays, takerGets, ledgerIndex }){
		super()
		this.socket = socket
		this.takerPays = takerPays
		this.takerGets = takerGets
		this.ledgerIndex = ledgerIndex || 'validated'
		this.offers = []
	}


	async load(limit = 1000){
		let { offers } = await this.socket.request({
			command: 'book_offers',
			ledger_index: this.ledgerIndex,
			taker_gets: this.takerGets,
			taker_pays: this.takerPays,
			limit
		})

		this.offers = offers.map(this.#parseOffer)
		this.emit('update')
	}

	async subscribe(){
		if(this.subscribed)
			return

		this.subscribed = true

		await this.load()
		await this.socket.request({
			command: 'subscribe',
			books: [{
				taker_gets: this.takerGets,
				taker_pays: this.takerPays,
				both: true
			}]
		})

		this.socket.on('transaction', this.txh = tx => {
			let didChange = false

			//console.log(tx)

			for(let wrap of tx.meta.AffectedNodes){
				let key = Object.keys(wrap)[0]
				let node = wrap[key]

				if(node.LedgerEntryType !== 'Offer')
					continue

				let account = node.FinalFields?.Account || node.NewFields?.Account
				let sequence = node.FinalFields?.Sequence || node.NewFields?.Sequence
				let id = `${account}:${sequence}`
				let newOffer = this.#parseOffer(node.NewFields || node.FinalFields)

				if(!compareCurrency(newOffer.takerPays, this.takerPays))
					continue

				if(!compareCurrency(newOffer.takerGets, this.takerGets))
					continue

				
				if(key === 'CreatedNode'){
					this.offers = this.offers
						.concat([newOffer])
						.map(offer => ({
							offer, 
							r: Decimal.div(
								offer.takerPays.value, 
								offer.takerGets.value
							)
						}))
						.sort((a, b) => 
							!a.r.eq(b.r)
								? a.r.gt(b.r) ? 1 : -1
								: 0
						)
						.map(({ offer }) => offer)

					didChange = true
					continue
				}


				let offerIndex = this.offers.findIndex(offer => offer.id === id)

				if(offerIndex === -1)
					continue

				if(key === 'DeletedNode'){
					this.offers.splice(offerIndex, 1)
				}else{
					Object.assign(
						this.offers[offerIndex], 
						newOffer
					)
				}

				didChange = true
			}

			if(didChange)
				this.emit('update')
		})
	}

	async unsubscribe(){
		if(!this.subscribed)
			return

		this.subscribed = false

		await this.socket.request({
			command: 'unsubscribe',
			books: [{
				taker_gets: this.takerGets,
				taker_pays: this.takerPays
			}]
		})
	}


	fill({ takerPays, takerGets, cushion }){
		if(this.offers.length === 0)
			throw new Error('cannot fill: empty book')

		let incomplete = true
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
				incomplete = false
				break
			}

			amountPay = amountPay.minus(payValue)
			amountGet = amountGet.plus(getValue)
		}

		if(cushion){
			amountGet = amountGet.times(1 - cushion)
		}

		return {
			incomplete,
			partial: amountPay.gt(0),
			takerPays: takerPays
				? Decimal.sub(takerPays, amountPay).toString()
				: amountGet.toString(),
			takerGets: takerPays
				? amountGet.toString()
				: Decimal.sub(takerGets, amountPay).toString()
		}
	}

	async fillLazy({ initial = 3, stride = 10, ...args }){
		let limit = initial

		while(true){
			let offerCount = this.offers.length

			await this.load(limit)

			let res = this.fill(args)

			if(!res.incomplete || this.offers.length <= offerCount)
				return res

			limit += stride
		}
	}


	#parseOffer(offer){
		let takerGets = amountFromRippled(offer.TakerGets)
		let takerPays = amountFromRippled(offer.TakerPays)

		return {
			id: `${offer.Account}:${offer.Sequence}`,
			takerGets,
			takerPays,
			price: Decimal.div(
				takerPays.value, 
				takerGets.value
			).toString()
		}
	}
}