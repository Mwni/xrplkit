import Book from '@xrplworks/book'
import XFL from '@xrplworks/xfl'


export default class{
	constructor(tokens){
		this.tk = tokens
		this.networth = '0'
		this.performance = '0'
		this.books = {}
		this.values = {}
	}

	async sync(){
		let [ xrp, ...tokens ] = this.tk.registry.array

		this.values = {
			[xrp.key]: xrp.balance
		}
		
		for(let token of this.tk.registry.array.slice(1)){
			let book = this.books[token.key]

			if(!book){
				book = this.books[token.key] = new Book({
					socket: this.tk.pf.socket,
					takerGets: this.tk.pf.quoteCurrency,
					takerPays: {
						currency: token.currency,
						issuer: token.issuer
					},
				})
			}

			this.tk.pf.queue.add({
				stage: 'token-live-eval',
				do: async () => {
					this.values[token.key] = (await book.fillLazy({ takerPays: token.balance }))
						.takerGets

					this.updateNetworth()
					this.updatePerformance()
				}
			})
		}

		await this.tk.pf.queue.wait('token-live-eval')
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
				this.updatePerformance()
			})
		}
	}

	represent(){
		return this.tk.registry.array.map(token => ({
			currency: token.currency,
			issuer: token.issuer,
			balance: token.balance,
			networth: this.getTokenNetworth(token),
			performance: this.getTokenPerformance(token),
			timeline: token.timeline
		}))
	}

	getTokenNetworth(token){
		return this.values[token.key]
	}

	getTokenPerformance(token){
		return XFL.sub(this.values[token.key], token.value)
			.toString()
	}

	updateNetworth(){
		let networth = new XFL(0)
		
		for(let token of this.tk.registry.array){
			if(!this.values[token.key])
				continue

			networth = networth.plus(this.values[token.key])
		}
		
		this.networth = networth.toString()
	}

	updatePerformance(){
		let performance = new XFL(0)
		
		for(let token of this.tk.registry.array){
			if(!this.values[token.key])
				continue
			
			performance = performance
				.plus(this.values[token.key])
				.minus(token.value)
		}
		
		this.performance = performance.toString()
	}
}