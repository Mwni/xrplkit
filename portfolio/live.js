import Book from '@xrplworks/book'
import Decimal from 'decimal.js'


export default class{
	constructor(portfolio){
		this.pf = portfolio
		this.books = {}
	}

	async subscribe(){
		for(let token of Object.values(this.pf.tokens)){
			let book = new Book({
				socket: this.pf.socket,
				takerGets: this.pf.quoteCurrency,
				takerPays: {
					currency: token.currency,
					issuer: token.issuer
				},
			})
			
			this.books[`${token.currency}:${token.issuer}`] = book

			book.on('update', () => this.updateTokenValuation(token))
			
			await book.subscribe()

			this.updateTokenValuation(token)
		}
	}

	updateTokenValuation(token){
		let book = this.books[`${token.currency}:${token.issuer}`]

		if(book.offers.length === 0)
			return

		token.networth = book
			.fill({ takerPays: token.balance })
			.takerGets

		this.updateNetworth()
	}

	updateNetworth(){
		let networth = new Decimal(this.pf.account.balance)
		
		for(let token of Object.values(this.pf.tokens)){
			networth = networth.plus(token.networth)
		}
		
		let newNetworth = networth.toString()

		if(this.pf.networth === newNetworth)
			return

		this.pf.networth = newNetworth
		this.pf.emit('update')
	}
}