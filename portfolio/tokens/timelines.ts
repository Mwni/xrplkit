import XFL from '@xrplkit/xfl'


export default class{
	tk
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
							// @ts-ignore
							event.valueChange = XFL.mul(new XFL(value, XFL.sign(event.balanceChange)))
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
		for (let token of this.tk.registry.array) {
			let movingBalance = new XFL(0)
			let movingValue = new XFL(0)

			for(let event of token.timeline){
				movingBalance = XFL.sum(movingBalance, event.balanceChange)
				event.balance = movingBalance.toString()
				
				if(event.valueChange){
					movingValue = XFL.sum(movingValue,event.valueChange)
					event.value = movingValue.toString()
				}
			}
		}
	}
}
