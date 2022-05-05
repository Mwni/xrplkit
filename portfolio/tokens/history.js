import XFL from '@xrplkit/xfl'


export default class History{
	constructor(tokens){
		this.tk = tokens
	}

	async load({ ledgerIndices }){
		let requests = []

		for(let ledgerIndex of ledgerIndices){
			for(let token of this.tk.registry.array){
				let value = token.valuations[ledgerIndex]
				let event = token.timeline
					.slice()
					.reverse()
					.find(event => event.ledgerIndex <= ledgerIndex)

				if(value || !event)
					continue

				if(this.tk.isQuote(token)){
					token.valuations[ledgerIndex] = event.balance
				}else{
					token.valuations[ledgerIndex] = null

					requests.push({
						ledgerIndex,
						amount: {
							currency: token.currency,
							issuer: token.issuer,
							value: event.balance
						},
						resolve: value => {
							token.valuations[ledgerIndex] = value
						}
					})
				}
			}
		}

		await this.tk.valuations.fill(requests)
	}

	async cull({ excludeLedgerIndices }){
		for(let token of this.tk.registry.array){
			for(let key of Object.keys(token.valuations)){
				if(excludeLedgerIndices.includes(parseInt(key)))
					continue

				delete token.valuations[key]
			}
		}
	}

	represent(){
		let points = []

		for(let ledgerIndex of Object.keys(this.tk.pf.ledgers.times)){
			if(!this.isPointAvailable(ledgerIndex))
				continue

			points.push(this.representPoint(parseInt(ledgerIndex)))
		}

		return points
	}

	representPoint(ledgerIndex){
		let time = this.tk.pf.ledgers.times[ledgerIndex]
		let networth = new XFL(0)
		let performance = new XFL(0)
		let tokens = []

		for(let token of this.tk.registry.array){
			let value = token.valuations[ledgerIndex]
			let event = token.timeline
				.slice()
				.reverse()
				.find(event => event.ledgerIndex <= ledgerIndex)

			if(!value || !event)
				continue

			tokens.push({
				currency: token.currency,
				issuer: token.issuer,
				networth: value,
				performance: new XFL(value)
					.minus(event.value)
					.toString()
			})

			networth = networth.plus(value)
			performance = performance
				.plus(value)
				.minus(event.value)
		}
		
		return {
			ledgerIndex,
			time,
			networth: networth.toString(),
			performance: performance.toString(),
			tokens
		}
	}

	isPointAvailable(ledgerIndex){
		return (
			this.tk.pf.ledgers.times[ledgerIndex]
			&& this.tk.registry.array
				.every(token => token.valuations[ledgerIndex] !== null)
		)
	}
}