import { EventEmitter } from '@mwni/events'
import Queue from './queue.js'
import Tokens from './tokens/index.js'


export default class Portfolio extends EventEmitter{
	#tokens

	constructor({ account, socket, quoteCurrency, historyLedgerInterval = 150 }){
		super()
		this.account = account
		this.socket = socket
		this.quoteCurrency = quoteCurrency || {currency: 'XRP'}

		this.queue = new Queue(this)
		this.#tokens = new Tokens(this)

		this.queue.on('change', () => this.emit('progress', this.progress))
	}

	async sync(){
		await this.queue.add({
			stage: 'account-tx',
			do: async () => await this.account.loadTx()
		})

		await this.#tokens.sync()

		console.log(this.#tokens.registry.array[0].timeline)
	}

	async subscribe(){
		await this.sync()
		await this.live.subscribe()
	}

	get networth(){
		return this.#tokens.live.networth
	}

	get performance(){
		return this.#tokens.live.performance
	}

	get tokens(){
		return this.#tokens.represent()
	}

	get progress(){
		return Object.entries(this.queue.branches).map(([stage, branch]) => ({
			stage,
			...branch.progress
		}))
	}
}