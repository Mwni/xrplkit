import { EventEmitter } from '@mwni/events'
import { fromRippled as amountFromRippled, isSameCurrency, formatCurrency } from '@xrplkit/amount'
import { sum, sub, mul, div } from '@xrplkit/xfl'



export default class Book extends EventEmitter{
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

	async subscribe({ load } = {}){
		if(this.subscribed)
			return

		this.subscribed = true

		if(load)
			await this.load()

		await this.socket.request({
			command: 'subscribe',
			books: [{
				taker_gets: this.takerGets,
				taker_pays: this.takerPays,
				both: true
			}]
		})

		this.socket.on('transaction', this.txh = tx => this.diff(tx))
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

	diff(tx){
		let didChange = false
		let meta = tx?.meta || tx.metaData

		if(!meta?.AffectedNodes)
			return

		for(let wrap of meta.AffectedNodes){
			let key = Object.keys(wrap)[0]
			let node = wrap[key]

			if(node.LedgerEntryType !== 'Offer')
				continue

			let account = node.FinalFields?.Account || node.NewFields?.Account
			let sequence = node.FinalFields?.Sequence || node.NewFields?.Sequence
			let id = `${account}:${sequence}`
			let newOffer = this.#parseOffer(node.NewFields || node.FinalFields)

			if(!isSameCurrency(newOffer.takerPays, this.takerPays))
				continue

			if(!isSameCurrency(newOffer.takerGets, this.takerGets))
				continue

			
			if(key === 'CreatedNode'){
				this.offers = this.offers
					.concat([newOffer])
					.map(offer => ({
						offer, 
						r: div(
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
	}


	fill({ takerPays, takerGets, cushion }){
		let incomplete = true
		let amountPay
		let amountGet = '0'
		let keyPay
		let keyGet

		if(takerPays){
			amountPay = takerPays
			keyPay = 'takerPays'
			keyGet = 'takerGets'
		}else{
			amountPay = takerGets
			keyPay = 'takerGets'
			keyGet = 'takerPays'
		}


		for(let offer of this.offers){
			let payValue = offer[keyPay].value
			let getValue = offer[keyGet].value

			if(amountPay.lt(payValue)){
				let fraction = div(amountPay, payValue)

				amountPay = '0'
				amountGet = sum(amountGet, mul(fraction, getValue))
				incomplete = false
				break
			}

			amountPay = sub(amountPay, payValue)
			amountGet = sum(amountGet, getValue)
		}

		if(cushion){
			amountGet = mul(
				amountGet,
				takerPays
					? 1 - cushion
					: 1 + cushion
			)
		}

		return {
			incomplete,
			partial: amountPay.gt(0),
			takerPays: takerPays
				? sub(takerPays, amountPay)
				: amountGet,
			takerGets: takerPays
				? amountGet
				: sub(takerGets, amountPay)
		}
	}

	async fillLazy({ initial = 3, stride = 5, ...args }){
		let limit = initial
		let steps = 0

		while(true){
			let offerCount = this.offers.length

			await this.load(limit)

			let res = this.fill(args)

			if(!res.incomplete || this.offers.length <= offerCount)
				return res

			limit += stride * ++steps
		}
	}

	get bestPrice(){
		return this.offers.length > 0
			? this.offers[0].price
			: undefined
	}

	toString(){
		return `Book (${formatCurrency(this.takerGets)} / ${formatCurrency(this.takerPays)})`
	}

	#parseOffer(offer){
		let takerGets = amountFromRippled(offer.TakerGets)
		let takerPays = amountFromRippled(offer.TakerPays)

		let takerGetsFunded = offer.taker_gets_funded
			 ? amountFromRippled(offer.taker_gets_funded)
			 : takerGets

		let takerPaysFunded = offer.taker_pays_funded
			 ? amountFromRippled(offer.taker_pays_funded)
			 : takerPays

		return {
			id: `${offer.Account}:${offer.Sequence}`,
			account: offer.Account,
			sequence: offer.Sequence,
			index: offer.index,
			takerGets,
			takerPays,
			takerGetsFunded,
			takerPaysFunded,
			price: div(takerPays.value, takerGets.value),
			priceFunded: takerGetsFunded.value !== '0'
				? div(takerPaysFunded.value, takerGetsFunded.value)
				: undefined
		}
	}
}