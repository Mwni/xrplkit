import { EventEmitter } from '@mwni/events'
import { unixNow, rippleToUnix } from '@xrplworks/time'
import { extractBalanceChanges } from '@xrplworks/tx'
import { decode as decodeCurrency } from '@xrplworks/currency'
import Decimal from 'decimal.js'
import { promised } from '../common/async.js'
import createLog from '../platform/browser/log.js'



export default class extends EventEmitter{
	static key(address){
		return address
	}

	constructor(app, address){
		super()

		this.app = app
		this.log = createLog(`account-${address.slice(0, 4)}`)

		this.address = address
		this.xrp = 0
		this.ownerCount = 0
		this.balances = []
		this.tx = []
		this.liveReady = promised()
		this.historyReady = promised()
	}

	holds(trustline){
		return this.trusts(trustline) && this.balance(trustline) !== '0'
	}

	trusts(trustline){
		return this.balance(trustline) !== undefined
	}

	balance({ currency, issuer }){
		return this.balances.find(balance => 
			balance.currency === currency && balance.issuer == issuer)
				?.balance
	}

	async open({ full, storage }){
		this.log(`open`)

		if(storage){
			this.store = this.app.storage.get(`account-${this.address}`)

			if(this.store.data){
				for(let [key, value] of Object.entries(this.store.data)){
					this[key] = value
				}

				this.updateMetrics()
			}
		}

		await this.refreshInfo()
		await this.refreshLines()
		this.liveReady.resolved()
		this.emit('live-ready')

		if(full){
			await this.refreshTX()
			this.historyReady.resolved()
			this.emit('history-ready')
		}
		
		this.log(`ready`)
	}

	async refresh(){
		this.log(`refresh`)

		await this.refreshInfo()
		await this.refreshLines()

		this.emit('refreshed')
	}

	async refreshInfo(){
		this.log(`refresh info`)

		let { account_data } = await this.app.xrpl.socket.request({
			command: 'account_info',
			account: this.address
		})

		let balance = Decimal.div(account_data.Balance, '1000000')
				.toString()

		this.store.data.xrp = this.xrp = balance
		this.store.data.ownerCount = this.ownerCount = account_data.OwnerCount
		this.log(`new info (balance: ${this.xrp}, owning: ${this.ownerCount})`)
		this.store.flush()
		this.emit('update')
	}

	async refreshLines(){
		this.log(`refresh lines`)

		let { lines } = await this.app.xrpl.socket.request({
			command: 'account_lines',
			account: this.address
		})

		this.store.data.balances = this.balances = [
			{currency: 'XRP', balance: await this.xrp},
			...lines
				.filter(({ limit_peer }) => limit_peer === '0')
				.filter(({ balance }) => !balance.startsWith('-'))
				.map(({ currency, account, balance }) => ({
					currency: decodeCurrency(currency),
					issuer: account,
					balance
				}))
		]
		

		this.log(`${lines.length} lines`)
		this.store.flush()
		this.emit('update')

		for(let balance of this.balances.slice(1)){
			this.app.token.registry
				.get(balance)
				.use()
		}
	}

	async refreshTX(){
		this.log(`refresh tx`)

		let txn = this.tx.slice()

		for(let forward of [true, false]){
			if(forward && txn.length === 0)
				continue

			if(!forward && txn.length > 0 && txn[0].first)
				continue

			while(true){
				if(txn.length > 0)
					this.log(`fetch transactions ${forward ? `upwards ledger ${txn[txn.length - 1].ledger}` : `downwards ledger ${txn[0].ledger}`}`)
				else
					this.log(`first fetch transactions`)

				let { transactions } = await this.app.xrpl.socket.request({
					command: 'account_tx',
					account: this.address,
					forward,
					ledger_index_min: forward ? txn[txn.length - 1]?.ledger : undefined,
					ledger_index_max: forward ? undefined : txn[0]?.ledger,
					limit: 250
				})

				transactions = transactions
					.filter(({ tx }) => txn.every(({ hash }) => hash !== tx.hash))

				if(transactions.length === 0){
					if(!forward){
						this.tx[0].first = true
						this.store.flush()
					}

					this.log(`reached end of transaction records`)
					break
				}

				for(let { tx, meta } of transactions){
					let balanceChanges = extractBalanceChanges({meta})[this.address]
					let time = rippleToUnix(tx.date)
					let ledger = tx.ledger_index

					if(balanceChanges){
						balanceChanges = balanceChanges
							.filter(change => !change.change.eq(0))
							.map(change => ({
								currency: decodeCurrency(change.currency),
								issuer: change.issuer,
								change: change.change.toString()
							}))
					}

					txn.push({
						hash: tx.hash,
						type: tx.TransactionType,
						time,
						ledger,
						seq: meta.TransactionIndex,
						balanceChanges
					})

					this.app.xrpl.timetable.add({
						index: ledger,
						time
					})
				}

				txn.sort((a, b) => a.ledger - b.ledger)

				this.store.data.tx = this.tx = txn
				this.updateMetrics()

				this.log(`transaction history size now ${txn.length}`)
				this.store.flush()
				this.emit('update')
			}
		}
	}

	updateMetrics(){
		if(this.tx.length > 0)
			this.ageInSeconds = unixNow() - this.tx[0].time
	}
}