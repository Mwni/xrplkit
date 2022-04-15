import Decimal from 'decimal.js'
import { extractBalanceChanges, extractExchanges } from '@xrplworks/tx'


export default class{
	constructor(portfolio){
		this.pf = portfolio
	}

	async evaluate(){
		let missingValuations = []

		for(let transaction of this.pf.account.transactions){
			let exchanges = extractExchanges(transaction, { collapse: true })
			let balanceChanges = extractBalanceChanges(transaction)
				[this.pf.account.address]

			if(!balanceChanges || balanceChanges.length === 0)
				continue

			if(exchanges.length > 0){
				// trade

				let quoteAmount = balanceChanges
					.find(({ currency }) => currency === this.pf.quoteCurrency.currency)

				if(quoteAmount){
					console.log('yay', quoteAmount.change.replace(/^-/, ''))
				}else{
					missingValuations.push({
						transaction
					})
				}
			}else{
				// deposit or withdrawal
			}
		}

		console.log(missingValuations)
	}
}