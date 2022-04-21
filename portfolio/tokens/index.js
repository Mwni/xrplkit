import Registry from './registry.js'
import Timelines from './timelines.js'
import Valuations from './valuations.js'
import Live from './live.js'
import History from './history.js'
import { compare as isSameCurrency } from '@xrplworks/currency'


export default class Tokens{
	constructor(portfolio){
		this.pf = portfolio
		this.registry = new Registry(this)
		this.timelines = new Timelines(this)
		this.valuations = new Valuations(this)
		this.live = new Live(this)
		this.history = new History(this)
	}

	async sync(){
		await this.timelines.derive()
		await this.timelines.evaluate()
		await this.live.sync()
	}

	async loadHistory({ ledgerIndices }){
		await this.history.load(ledgerIndices)
	}

	historical(){
		return this.history.represent()
	}

	isQuote(currency){
		return isSameCurrency(currency, this.pf.quoteCurrency)
	}

	get data(){
		return this.registry.array.map(token => ({ ...token }))
	}
}