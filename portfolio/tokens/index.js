import Registry from './registry.js'
import Timelines from './timelines.js'
import Valuations from './valuations.js'
import Live from './live.js'
import { compare as isSameCurrency } from '@xrplworks/currency'


export default class Tokens{
	constructor(portfolio){
		this.pf = portfolio
		this.registry = new Registry(this)
		this.timelines = new Timelines(this)
		this.valuations = new Valuations(this)
		this.live = new Live(this)
	}

	async sync(){
		await this.timelines.reconstruct()
		await this.timelines.evaluate()
		await this.live.sync()
	}

	represent(){
		return this.registry.array.map(token => ({
			currency: token.currency,
			issuer: token.issuer,
			balance: token.balance,
			networth: this.live.getTokenNetworth(token),
			performance: this.live.getTokenPerformance(token),
			timeline: token.timeline
		}))
	}

	isQuote(currency){
		return isSameCurrency(currency, this.pf.quoteCurrency)
	}
}