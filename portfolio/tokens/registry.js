import XFL from '@xrplworks/xfl'
import { compare as isSameCurrency } from '@xrplworks/currency'
import { extractBalanceChanges, extractExchanges } from '@xrplworks/tx'
import { negate as negateAmount } from '@xrplworks/amount'


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

		for(let exchange of exchanges){
			this.registerEvent({
				transaction,
				balanceChange: exchange.takerGot,
				inExchangeFor: negateAmount(exchange.takerPaid),
				ledgerIndex: transaction.tx.ledger_index
			})

			this.registerEvent({
				transaction,
				balanceChange: negateAmount(exchange.takerPaid),
				inExchangeFor: exchange.takerGot,
				ledgerIndex: transaction.tx.ledger_index
			})

			for(let balanceChange of balanceChanges){
				if(isSameCurrency(balanceChange, exchange.takerGot)){
					balanceChange.change = XFL.sub(balanceChange.change, exchange.takerGot.value).toString()
				}

				if(isSameCurrency(balanceChange, exchange.takerPaid)){
					balanceChange.change = XFL.sum(balanceChange.change, exchange.takerPaid.value).toString()
				}
			}
		}

		for(let balanceChange of balanceChanges){
			if(balanceChange.change === '0')
				continue

			this.registerEvent({
				transaction,
				balanceChange: {
					currency: balanceChange.currency,
					issuer: balanceChange.issuer,
					value: balanceChange.change
				},
				ledgerIndex: transaction.tx.ledger_index
			})
		}
	}

	registerEvent({ transaction, balanceChange, inExchangeFor, ledgerIndex }){
		let key = Registry.key(balanceChange)
		let token = this.map[key]

		if(!token){
			token = this.map[key] = {
				key,
				currency: balanceChange.currency,
				issuer: balanceChange.issuer,
				timeline: []
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
			inExchangeFor,
			ledgerIndex
		})
	}

	blacklistObligations(){
		// todo
	}

	
}