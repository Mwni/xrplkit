import XFL from '@xrplworks/xfl'


export default class{
	constructor(tokens){
		this.tk = tokens
	}

	async derive(){
		for(let transaction of this.tk.pf.account.transactions){
			this.tk.registry.derive(transaction)
		}

		this.fill()
	}

	async evaluate(){
		let requests = []

		for(let token of this.tk.registry.array){
			for(let event of token.timeline){
				if(event.valueChange)
					continue

				if(this.tk.isQuote(token)){
					event.valueChange = event.balanceChange
				}else{
					requests.push({
						amount: {
							currency: token.currency,
							issuer: token.issuer,
							value: XFL.abs(event.balanceChange).toString()
						},
						ledgerIndex: event.ledgerIndex,
						resolve: value => {
							event.valueChange = new XFL(value)
								.times(XFL.sign(event.balanceChange))
								.toString()
						}
					})
				}
			}
		}

		await this.tk.valuations.fill(requests)

		this.fill()
	}

	fill(){
		for(let token of this.tk.registry.array){
			let movingBalance = new XFL(0)
			let movingValue = new XFL(0)

			for(let event of token.timeline){
				movingBalance = movingBalance.plus(event.balanceChange)
				event.balance = movingBalance.toString()
				
				if(event.valueChange){
					movingValue = movingValue.plus(event.valueChange)
					event.value = movingValue.toString()
				}
			}
		}
	}
}