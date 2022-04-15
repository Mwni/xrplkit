import { EventEmitter } from '@mwni/events'
import Sync from './sync.js'
import Live from './live.js'
import History from './history.js'


export default class Portfolio extends EventEmitter{
	constructor({ account, socket, quoteCurrency, historyLedgerInterval = 150 }){
		super()
		this.account = account
		this.socket = socket
		this.quoteCurrency = quoteCurrency || {currency: 'XRP'}
		this.networth = '0'
		this.tokens = {}
		this.progress = {}

		this.sync = new Sync(this)
		this.live = new Live(this)
		this.history = new History(this)
	}

	async sync(){
		await this.sync.syncLines()
	}

	async subscribe(){
		await this.sync.syncLines()
		await this.live.subscribe()
	}

	async load(){
		await this.sync.syncLines()
		await this.sync.syncTx()

		this.progress = { stage: 'historical-valuations' }

		await Promise.all([
			this.transactions.fill(),
			this.history.reconstruct()
		])
	}
}