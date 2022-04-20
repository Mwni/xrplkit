import Book from '@xrplworks/book'


export default class{
	constructor(tokens){
		this.tk = tokens
		this.suppliers = []
	}


	async fill(batch){
		for(let request of [...this.suppliers, this.evaluateFromBooks]){
			if(batch.length === 0)
				break

			let results = await request.call(this, batch)

			for(let i=0; i<results.length; i++){
				if(results[i]){
					batch[i].resolve(results[i])
					batch[i] = null
				}
			}

			batch = batch.filter(Boolean)
		}
	}

	async evaluateFromBooks(batch){
		let results = Array(batch.length)
			.fill(0)
			.map(() => null)


		for(let i=0; i<batch.length; i++){
			let { amount, ledgerIndex } = batch[i]

			this.tk.pf.queue.add({
				stage: 'token-book-eval',
				ledgerIndex,
				execute: async () => {
					let book = new Book({
						socket: this.tk.pf.socket,
						takerGets: this.tk.pf.quoteCurrency,
						takerPays: {
							currency: amount.currency,
							issuer: amount.issuer
						},
						ledgerIndex
					})

					results[i] = (await book.fillLazy({ takerPays: amount.value }))
						.takerGets
				}
			})
		}

		await this.tk.pf.queue.wait('token-book-eval')

		return results
	}
}