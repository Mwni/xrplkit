import { EventEmitter } from '@mwni/events'
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
		this.networth = '0'
		this.tokens = {}
		this.queueBranches = {}

		this.sync = new Sync(this)
		this.live = new Live(this)
		this.transactions = new Transactions(this)
		this.history = new History(this)
	}

	async load(){
		await this.sync.syncLines()
		await this.sync.syncTx()
		await this.transactions.evaluate()
	}

	async subscribe(){
		await this.sync.syncLines()
		await this.live.subscribe()
	}

	async full(){
		await this.sync.syncLines()
		await this.sync.syncTx()

		/*await Promise.all([
			this.transactions.fill(),
			this.history.reconstruct()
		])*/
	}

	async queue(tasks){
		return new Promise(resolve => {
			for(let task of tasks){
				let branch = this.queueBranches[task.stage]
	
				if(!branch){
					branch = this.queueBranches[task.stage] = {
						chain: Promise.resolve(),
						progress: { 
							value: 0,
							total: 0
						}
					}
				}
	
				branch.progress.total++
				branch.chain = branch.chain
					.then(() => {
						this.emit('progress', this.progress)
						return task.function()
					})
					.then(() => {
						branch.progress.value++
	
						if(branch.progress.value === branch.progress.total){
							this.emit('progress', this.progress)
							resolve()
						}
					})
			}
		})
	}

	get progress(){
		return Object.entries(this.queueBranches).map(([stage, branch]) => ({
			stage,
			...branch.progress
		}))
	}
}