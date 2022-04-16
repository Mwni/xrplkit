import XFL from '@xrplworks/xfl'
import { extractBalanceChanges, extractExchanges } from '@xrplworks/tx'
import { compare as isSameCurrency } from '@xrplworks/currency'


export default class{
	constructor(portfolio){
		this.pf = portfolio
		this.valuations = []
		this.tokenAssociations = []
	}

	async reconstruct(){
		let todo = []

		for(let transaction of this.pf.account.transactions){
			let exchanges = extractExchanges(transaction, { collapse: true })
			let balanceChanges = extractBalanceChanges(transaction)
				[this.pf.account.address]

			if(!balanceChanges)
				continue

			for(let exchange of exchanges){
				todo.push(this.registerTokenEvent({
					transaction,
					
				}))
			}

				
			for(let change of balanceChanges){
				if(isSameCurrency(change, this.pf.quoteCurrency))
					continue

				
			}

			if(exchanges.length > 0){
				await this.reconstructTrade({ transaction, balanceChanges })
			}else{
				// deposit or withdrawal

				this.valuations[i] = '0'

				for(let balanceChange of balanceChanges){
					if(isSameCurrency(balanceChange, this.pf.quoteCurrency)){
						this.valuations[i] = XFL.sum(this.valuations[i], balanceChange.change)
							.toString()
					}else{
						todo.push(
							async () => {
								this.valuations[i] = XFL.sum(
									this.valuations[i], 
									await this.pf.history.evaluate({
										currency: balanceChange.currency,
										issuer: balanceChange.issuer,
										units: balanceChange.change,
										ledgerIndex: transaction.tx.ledger_index,
									})
								)
									.toString()
							}
						)
					}
				}
			}
		}
	}

	async registerTokenEvent(){

	}

	async evaluate(){
		let todo = []

		for(let i=0; i<this.pf.account.transactions.length; i++){
			let transaction = this.pf.account.transactions[i]
			let exchanges = extractExchanges(transaction, { collapse: true })
			let balanceChanges = extractBalanceChanges(transaction)
				[this.pf.account.address]

			if(!balanceChanges || balanceChanges.length === 0)
				continue

			if(exchanges.length > 0){
				// trade

				let quoteAmount = balanceChanges
					.find(amount => isSameCurrency(amount, this.pf.quoteCurrency.currency))

				if(quoteAmount){
					this.valuations[i] = quoteAmount.change
				}else{
					this.valuations[i] = '0'
					// todo: consider calculating crypto to crypto value gain / loss
				}
			}else{
				// deposit or withdrawal

				this.valuations[i] = '0'

				for(let balanceChange of balanceChanges){
					if(isSameCurrency(balanceChange, this.pf.quoteCurrency)){
						this.valuations[i] = XFL.sum(this.valuations[i], balanceChange.change)
							.toString()
					}else{
						todo.push(
							async () => {
								this.valuations[i] = XFL.sum(
									this.valuations[i], 
									await this.pf.history.evaluate({
										currency: balanceChange.currency,
										issuer: balanceChange.issuer,
										units: balanceChange.change,
										ledgerIndex: transaction.tx.ledger_index,
									})
								)
									.toString()
							}
						)
					}
				}
			}
		}

		await this.pf.queue(todo.map(func => ({
			stage: 'tx-valuations',
			function: func
		})))
	}
}