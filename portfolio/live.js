import Book from '@xrplworks/book'
import XFL from '@xrplworks/xfl'


export default class{
	constructor(portfolio){
		this.pf = portfolio
		this.books = {}
		this.values = {}
	}

	async sync(){
		for(let token of this.pf.tokens.array.slice(1)){
			if(token.currency === 'XRP'){
				this.values[token.key] = token.balance
				continue
			}

			let book = this.books[token.key]

			if(!book){
				book = this.books[token.key] = new Book({
					socket: this.pf.socket,
					takerGets: this.pf.quoteCurrency,
					takerPays: {
						currency: token.currency,
						issuer: token.issuer
					},
				})
			}

			this.pf.queue.add({
				stage: 'balance-valuations',
				do: async () => {
					let { takerGets } = await book.fillLazy({ takerPays: token.balance })
					this.values[token.key] = takerGets
					this.updateNetworth()
				}
			})
		}

		await this.pf.queue.wait('balance-valuations')
	}

	async subscribe(){
		for(let token of this.pf.tokens.array.slice(1)){
			let book = this.books[token.key]

			await book.subscribe()

			book.on('update', () => {
				this.values[token.key] = this.books[token.key]
					.fill({ takerPays: token.balance })
					.takerGets

				this.updateNetworth()
			})
		}
	}

	updateNetworth(){
		let networth = new XFL(0)

		console.log(this.values)
		
		for(let token of this.pf.tokens.array){
			if(this.values[token.key])
				networth = networth.plus(this.values[token.key])
		}
		
		let newNetworth = networth.toString()

		if(this.pf.networth === newNetworth)
			return

		this.pf.networth = newNetworth
		this.pf.emit('update')
	}
}