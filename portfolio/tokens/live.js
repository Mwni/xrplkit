import Book from '@xrplworks/book'
import XFL from '@xrplworks/xfl'


export default class{
	constructor(tokens){
		this.tk = tokens
		this.networth = undefined
		this.performance = undefined
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
				execute: async () => {
					this.values[token.key] = (await book.fillLazy({ takerPays: token.balance }))
						.takerGets
				}
			})
		}

		await this.tk.pf.queue.wait('token-live-eval')
		this.calculate()
	}

	async subscribe(){
		for(let token of this.tk.registry.array.slice(1)){
			let book = this.books[token.key]

			await book.subscribe()

			book.on('update', () => {
				this.values[token.key] = this.books[token.key]
					.fill({ takerPays: token.balance })
					.takerGets

				if(this.calculate())
					this.tk.pf.emit('update')
			})
		}
	}

	represent(){
		return this.tk.registry.array
			.filter(token => this.values[token.key])
			.map(token => ({
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

	calculate(){
		let networth = new XFL(0)
		let performance = new XFL(0)

		for(let token of this.tk.registry.array){
			if(!this.values[token.key])
				continue

			networth = networth.plus(this.values[token.key])
			performance = performance
				.plus(this.values[token.key])
				.minus(token.value)
		}

		networth = networth.toString()
		performance = performance.toString()

		if(this.networth !== networth || this.performance !== performance){
			this.networth = networth
			this.performance = performance

			return true
		}
	}
}