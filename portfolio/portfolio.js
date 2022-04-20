import { EventEmitter } from '@mwni/events'
import Queue from './queue.js'
import Tokens from './tokens/index.js'


export default class Portfolio extends EventEmitter{
	#tokens

	constructor({ account, socket, quoteCurrency }){
		super()
		this.account = account
		this.socket = socket
		this.quoteCurrency = quoteCurrency || {currency: 'XRP'}

		this.queue = new Queue(this)
		this.#tokens = new Tokens(this)

		this.queue.on('change', () => this.emit('progress', this.progress))
	}

	async sync(){
		if(this.inSync)
			return

		await this.queue.add({
			stage: 'account-tx',
			execute: async () => await this.account.loadTx()
		})
		await this.#tokens.sync()
	}

	async subscribe(){
		await this.sync()
		await this.live.subscribe()

		this.inSync = true
	}

	async load({ ledgerIndices }){
		await this.sync()
		await this.#tokens.loadHistory({ ledgerIndices })
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
			...branch.progress
		}))
	}
}