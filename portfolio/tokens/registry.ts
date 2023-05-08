import XFL from '@xrplkit/xfl'
import { compare as isSameCurrency } from '@xrplkit/currency'
import { extractBalanceChanges, extractExchanges } from '@xrplkit/tx'


export default class Registry{
	constructor(tokens){
		this.tk = tokens
		this.map = {}
	}

	get array(){
		return Object.values(this.map)
	}
	
	restore(array){
		for(let token of array){
			let entry = new Entry(token)

			this.map[entry.key] = entry
		}

		this.tk.timelines.fill()
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
		let key = Entry.key(balanceChange)
		let token = this.map[key]

		if(!token){
			token = this.map[key] = new Entry({
				currency: balanceChange.currency,
				issuer: balanceChange.issuer
			})
		}else{
			if(token.timeline.some(event => event.tx === transaction.tx.hash))
				return
		}
		
		token.timeline.push({
			tx: transaction.tx.hash,
			ledgerIndex,
			balanceChange: balanceChange.value,
			valueChange,
		})
	}

	blacklistObligations(){
		// todo
	}
}


class Entry{
	static key({ currency, issuer }){
		return issuer
			? `${currency}:${issuer}`
			: currency
	}


	constructor(data){
		this.timeline = []
		this.valuations = {}
		Object.assign(this, data)
	}

	get key(){
		return Entry.key(this)
	}

	get balance(){
		return this.timeline[this.timeline.length - 1].balance
	}

	get value(){
		return this.timeline[this.timeline.length - 1].value
	}
}