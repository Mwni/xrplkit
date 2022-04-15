import Book from '@xrplworks/book'


export default class{
	constructor(portfolio){
		this.pf = portfolio
	}
	
	async syncLines(){
		await this.pf.queue([
			{
				stage: 'account-lines',
				function: async () => await this.pf.account.loadInfo()
			},
			{
				stage: 'account-lines',
				function: async () => await this.pf.account.loadLines({ direction: 'outbound' })
			}
		])

		await this.createTokens()
		await this.evaluateTokens()
	}

	async syncTx(){
		this.pf.progress = { stage: 'account-tx' }

		await this.pf.account.loadTx()

		await this.timelineTokens()
	}

	async createTokens(){
		for(let line of this.pf.account.lines){
			if(/(^\-)|(^\0$)/.test(line.balance))
				continue

			let book = new Book({
				socket: this.pf.socket,
				takerGets: this.pf.quoteCurrency,
				takerPays: {
					currency: line.currency,
					issuer: line.account
				},
			})

			this.pf.tokens[`${line.currency}:${line.account}`] = {
				currency: line.currency,
				issuer: line.account,
				balance: line.balance,
				value: '0',
				book
			}
		}
	}

	async evaluateTokens(){
		await this.pf.queue(
			Object.values(this.pf.tokens)	
				.map(token => ({
					stage: 'balance-valuations',
					function: async => {
						let { takerGets } = await token.book.fillLazy({ takerPays: token.balance })
						token.value = takerGets
					}
				}))
		)
	}

	async timelineTokens(){
		for(let token of Object.values(this.pf.tokens)){
			token.balanceHistory = [] //todo
		}
	}
}