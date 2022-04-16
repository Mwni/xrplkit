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

		await this.tokens.create()
		await this.tokens.evaluate()
	}

	async syncTx(){
		await this.pf.queue([
			{
				stage: 'account-tx',
				function: async () => await this.pf.account.loadTx()
			}
		])

		await this.pf.transactions.evaluate()
		await this.timelineTokens()
	}

	async createTokens(){
		this.pf.tokens.XRP = {
			currency: 'XRP',
			balance: this.pf.account.balance,
			value: this.pf.account.balance
		}

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
				book,
				timeline: []
			}
		}
	}

	async evaluateTokens(){
		await this.pf.queue(
			Object.values(this.pf.tokens)
				.filter(token => !isSameCurrency(token, this.pf.quoteCurrency))
				.map(token => ({
					stage: 'balance-valuations',
					function: async () => {
						let { takerGets } = await token.book.fillLazy({ takerPays: token.balance })
						token.value = takerGets
					}
				}))
		)

		this.pf.live.updateNetworth()
	}

	async timelineTokens(){
		for(let transaction of this.pf.account.transactions){
			let exchanges = extractExchanges(transaction, { collapse: true })
			let balanceChanges = extractBalanceChanges(transaction)
				[this.pf.account.address]

			if(!balanceChanges)
				continue

			for(let exchange of exchanges){
				this.registerTokenEvent({
					balanceChange: exchange.takerGot,
					inExchangeFor: exchange.takerPaid,
					ledgerIndex: transaction.tx.ledger_index
				})

				this.registerTokenEvent({
					balanceChange: exchange.takerPaid,
					inExchangeFor: exchange.takerGot,
					ledgerIndex: transaction.tx.ledger_index
				})
			}
		}
	}

	registerTokenEvent({ balanceChange, inExchangeFor, ledgerIndex }){
		let token = this.pf.tokens
	}
}