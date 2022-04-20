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

			batch = await request.call(this, batch)
		}
	}

	async evaluateFromBooks(batch){
		for(let { amount, ledgerIndex, resolve } of batch){
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

					resolve(
						(await book.fillLazy({ takerPays: amount.value }))
							.takerGets
					)
				}
			})
		}

		await this.tk.pf.queue.wait('token-book-eval')

		return []
	}
}