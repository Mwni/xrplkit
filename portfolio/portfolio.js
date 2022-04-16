import { EventEmitter } from '@mwni/events'
import Queue from './queue.js'
import Tokens from './tokens.js'
import Sync from './sync.js'
import Live from './live.js'
import History from './history.js'
import Transactions from './transactions.js'


export default class Portfolio extends EventEmitter{
	constructor({ account, socket, quoteCurrency, historyLedgerInterval = 150 }){
		super()
		this.account = account
		this.socket = socket
		this.quoteCurrency = quoteCurrency || {currency: 'XRP'}

		this.queue = new Queue(this)
		this.tokens = new Tokens(this)
		this.live = new Live(this)
		this.transactions = new Transactions(this)
		this.history = new History(this)

		this.queue.on('change', () => this.emit('progress', this.progress))
	}

	async sync(){
		this.queue.add({
			stage: 'account-lines',
			do: async () => await this.account.loadInfo()
		})

		this.queue.add({
			stage: 'account-lines',
			do: async () => await this.account.loadLines({ direction: 'outbound' })
		})

		await this.queue.wait('account-lines')
		await this.tokens.derive()
		await this.live.sync()
	}

	async subscribe(){
		await this.sync()
		await this.live.subscribe()
	}

	get progress(){
		return Object.entries(this.queue.branches).map(([stage, branch]) => ({
			stage,
			...branch.progress
		}))
	}
}