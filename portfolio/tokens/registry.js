import XFL from '@xrplworks/xfl'
import { compare as isSameCurrency } from '@xrplworks/currency'
import { extractBalanceChanges, extractExchanges } from '@xrplworks/tx'


export default class Registry{
	static key({ currency, issuer }){
		return issuer
			? `${currency}:${issuer}`
			: currency
	}

	constructor(tokens){
		this.tk = tokens
		this.map = {}
	}

	get array(){
		return Object.values(this.map)
	}

	derive(transaction){
		let exchanges = extractExchanges(transaction, { collapse: true })
		let balanceChanges = extractBalanceChanges(transaction)
			[this.tk.pf.account.address]

		if(!balanceChanges)
			return


		for(let balanceChange of balanceChanges){
			let valueChange
			let exchange = exchanges.find(exchange => {
				if(isSameCurrency(balanceChange, exchange.takerGot) && this.tk.isQuote(exchange.takerPaid))
					return true
				
				if(isSameCurrency(balanceChange, exchange.takerPaid) && this.tk.isQuote(exchange.takerGot))
					return true
			})

			if(exchange){
				let rate = XFL.div(exchange.takerPaid.value, exchange.takerGot.value)

				if(isSameCurrency(balanceChange, exchange.takerPaid))
					rate = new XFL(1).div(rate)

				valueChange = new XFL(balanceChange.change)
					.times(rate)
					.toString()
			}
			

			this.registerEvent({
				transaction,
				balanceChange: {
					currency: balanceChange.currency,
					issuer: balanceChange.issuer,
					value: balanceChange.change
				},
				valueChange,
				ledgerIndex: transaction.tx.ledger_index
			})
		}
	}

	registerEvent({ transaction, balanceChange, valueChange, ledgerIndex }){
		let key = Registry.key(balanceChange)
		let token = this.map[key]

		if(!token){
			token = this.map[key] = {
				key,
				currency: balanceChange.currency,
				issuer: balanceChange.issuer,
				valuations: {},
				timeline: [],
			}

			Object.defineProperties(token, {
				balance: {
					get(){
						return token.timeline[token.timeline.length - 1].balance
					}
				},
				value: {
					get(){
						return token.timeline[token.timeline.length - 1].value
					}
				}
			})
		}

		token.timeline.push({
			tx: transaction.tx.hash,
			balanceChange: balanceChange.value,
			valueChange,
			ledgerIndex
		})
	}

	blacklistObligations(){
		// todo
	}

	
}