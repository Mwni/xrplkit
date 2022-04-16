import XFL from '@xrplworks/xfl'
import { compare as isSameCurrency } from '@xrplworks/currency'
import { extractBalanceChanges, extractExchanges } from '@xrplworks/tx'


export default class Tokens{
	static key({ currency, issuer }){
		return issuer
			? `${currency}:${issuer}`
			: currency
	}

	constructor(portfolio){
		this.pf = portfolio
		this.map = {}
	}

	derive(){
		this.map = {}
		
		this.deriveFromLines()
		this.deriveFromTx()
		this.blacklistObligations()
		this.reconstructBalances()
	}

	deriveFromLines(){
		this.registerEvent({
			balanceChange: {
				currency: 'XRP',
				value: this.pf.account.balance
			}
		})

		for(let line of this.pf.account.lines){
			this.registerEvent({
				balanceChange: {
					currency: line.currency,
					issuer: line.account,
					value: line.balance
				}
			})
		}
	}

	deriveFromTx(){
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

	registerEvent({ balanceChange, inExchangeFor, ledgerIndex }){
		let key = Tokens.key(balanceChange)
		let token = this.map[key]

		if(!token){
			token = this.map[key] = {
				key,
				currency: balanceChange.currency,
				issuer: balanceChange.issuer,
				timeline: []
			}

			Object.defineProperty(token, 'balance', {
				get(){
					return token.timeline[token.timeline.length - 1].balance
				}
			})
		}

		token.timeline.push({
			balanceChange: balanceChange.value,
			inExchangeFor,
			ledgerIndex
		})
	}

	blacklistObligations(){
		
	}

	reconstructBalances(){
		for(let token of this.array){
			let movingBalance = new XFL(0)

			for(let event of token.timeline){
				movingBalance = movingBalance.plus(event.balanceChange)
				event.balance = movingBalance.toString()
			}
		}
	}

	get array(){
		return Object.values(this.map)
	}

	isQuote(currency){
		return isSameCurrency(currency, this.pf.quoteCurrency)
	}
}