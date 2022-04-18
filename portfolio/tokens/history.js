import XFL from '@xrplworks/xfl'


export default class History{
	constructor(tokens){
		this.tk = tokens
		this.values = {}
		this.ledgers = {}
	}

	async load(ledgerIndices){
		let valuationRequests = []
		let ledgerRequests = []

		for(let ledgerIndex of ledgerIndices){
			let values = this.values[ledgerIndex] = {}

			for(let token of this.tk.registry.array){
				let event = token.timeline
					.slice()
					.reverse()
					.find(event => event.ledgerIndex <= ledgerIndex)

				if(!event)
					continue

				if(this.tk.isQuote(token)){
					values[token.key] = event.balance
				}else{
					values[token.key] = null

					valuationRequests.push({
						amount: {
							currency: token.currency,
							issuer: token.issuer,
							value: event.balance
						},
						ledgerIndex,
						resolve: value => {
							values[token.key] = value
						}
					})
				}
			}

			ledgerRequests.push({
				ledgerIndex,
				resolve: time => {
					this.ledgers[ledgerIndex] = time
				}
			})
		}

		await Promise.all([
			this.tk.valuations.fill(valuationRequests),
			this.tk.ledgers.fill(ledgerRequests)
		])
	}

	represent(){
		let points = []

		for(let ledgerIndex of Object.keys(this.values)){
			if(!this.isPointAvailable(ledgerIndex))
				continue

			points.push(this.representPoint(parseInt(ledgerIndex)))
		}

		return points
	}

	representPoint(ledgerIndex){
		let values = this.values[ledgerIndex]
		let time = this.ledgers[ledgerIndex]
		let networth = new XFL(0)
		let performance = new XFL(0)
		let tokens = []

		for(let token of this.tk.registry.array){
			let event = token.timeline
				.slice()
				.reverse()
				.find(event => event.ledgerIndex <= ledgerIndex)

			if(!event)
				continue

			networth = networth.plus(values[token.key])
			performance = performance
				.plus(values[token.key])
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
		return this.values[ledgerIndex]
			? Object.values(this.values[ledgerIndex]).every(value => value !== null)
			: false
	}
}