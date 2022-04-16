import Book from '@xrplworks/book'
import XFL from '@xrplworks/xfl'


export default class{
	constructor(portfolio){
		this.pf = portfolio
		this.books = {}
	}

	async sync(){
		for(let token of this.pf.tokens.array.slice(1)){
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
					token.value = takerGets
				}
			})
		}

		await this.pf.queue.wait('balance-valuations')
		this.updateNetworth()
	}

	async subscribe(){
		for(let token of this.pf.tokens.array.slice(1)){
			let book = this.books[token.key]

			await book.subscribe()
			book.on('update', () => this.updateNetworth())
		}

		this.updateNetworth()
	}

	updateNetworth(){
		let [ xrp, ...tokens ] = this.pf.tokens.array
		let networth = new XFL(xrp.balance)
		
		for(let token of tokens){
			networth = networth.plus(
				this.books[token.key]
					.fill({ takerPays: token.balance })
					.takerGets
			)
		}
		
		let newNetworth = networth.toString()

		if(this.pf.networth === newNetworth)
			return

		this.pf.networth = newNetworth
		this.pf.emit('update')
	}
}