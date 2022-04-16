import Book from '@xrplworks/book'


export default class{
	constructor(portfolio){
		this.pf = portfolio
	}
	
	async evaluate({ currency, issuer, units, ledgerIndex }){
		let book = new Book({
			socket: this.pf.socket,
			takerGets: this.pf.quoteCurrency,
			takerPays: {currency, issuer},
			ledgerIndex
		})

		let { takerGets } = await book.fillLazy({ takerPays: units })

		return takerGets
	}
}