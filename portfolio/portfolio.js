import { EventEmitter } from '@mwni/events'
import Queue from './queue.js'
import Ledgers from './ledgers.js'
import Tokens from './tokens/index.js'


export default class Portfolio extends EventEmitter{
	#tokens

	constructor({ account, socket, quoteCurrency }){
		super()
		this.account = account
		this.socket = socket
		this.quoteCurrency = quoteCurrency || {currency: 'XRP'}

		this.queue = new Queue(this)
		this.ledgers = new Ledgers(this)
		this.#tokens = new Tokens(this)

		this.queue.on('change', () => this.emit('progress', this.progress))
	}

	async sync(){
		await this.queue.add({
			stage: 'account-tx',
			execute: async () => await this.account.loadTx()
		})
		await this.#tokens.sync()
	}

	async subscribe(){
		await this.sync()
		await this.#tokens.live.subscribe()
		this.subscribed = true
	}

	async load({ ledgerIndices, strict }){
		if(!this.subscribed)
			await this.sync()

		await Promise.all([
			this.ledgers.load({ ledgerIndices }),
			this.#tokens.history.load({ ledgerIndices }),
		])

		if(strict){
			await this.ledgers.cull({ excludeLedgerIndices: ledgerIndices })
			await this.#tokens.history.cull({ excludeLedgerIndices: ledgerIndices })
		}
	}

	get networth(){
		return this.#tokens.live.networth
	}

	get performance(){
		return this.#tokens.live.performance
	}

	get tokens(){
		return this.#tokens.live.represent()
	}

	get history(){
		return this.#tokens.history.represent()
	}

	get progress(){
		return Object.entries(this.queue.branches).map(([stage, branch]) => ({
			stage,
			tasks: branch.tasks
		}))
	}

	get data(){
		return {
			ledgers: this.ledgers.data,
			tokens: this.#tokens.data
		}
	}

	set data(data){
		this.ledgers.data = data.ledgers
		this.#tokens.data = data.tokens
	}
}