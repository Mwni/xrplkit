import { EventEmitter } from '@mwni/events'
import Decimal from 'decimal.js'


export default class Account extends EventEmitter{
	constructor({ address, socket }){
		super()
		this.address = address
		this.socket = socket
		this.lines = []
		this.transactions = []
	}

	
	async loadInfo(){
		let { account_data } = await this.socket.request({
			command: 'account_info',
			account: this.address
		})

		this.flags = account_data.Flags
		this.sequence = account_data.Sequence
		this.ownerCount = account_data.OwnerCount
		this.balance = Decimal.div(account_data.Balance, '1000000')
				.toString()
	}


	async loadLines({ direction } = {}){
		let lines = []
		let marker

		while(true){
			let { lines: chunk, marker: continuation } = await this.socket.request({
				command: 'account_lines',
				account: this.address,
				marker
			})

			lines.push(...chunk)

			if(continuation)
				marker = continuation
			else
				break
		}

		if(direction === 'inbound'){
			lines = lines.filter(line => line.limit_peer !== '0')
		}else if(direction === 'outbound'){
			lines = lines.filter(line => line.limit !== '0')
		}

		this.lines = lines.map(line => ({
			account: line.account,
			currency: line.currency,
			balance: line.balance,
			limit: line.limit
		}))
	}


	async loadTx(){
		let transactions = []
		let marker
		let forward = this.transactions.length > 0
		let from = forward
			? this.transactions[this.transactions.length - 1].tx.ledger_index
			: undefined

		while(true){
			let { transactions: chunk, marker: continuation } = await this.socket.request({
				command: 'account_tx',
				account: this.address,
				forward,
				ledger_index_min: forward ? from : undefined,
				ledger_index_max: forward ? undefined : from,
				marker,
				limit: 100
			})

			transactions.push(
				...chunk
					.filter(transaction => {
						return this.transactions.every(({ tx }) => transaction.tx.hash !== tx.hash)
					})
			)

			if(continuation)
				marker = continuation
			else
				break
		}

		this.transactions = transactions.sort((a, b) => {
			let aRank = a.tx.ledger_index + a.meta.TransactionIndex * 0.000001
			let bRank = b.tx.ledger_index + b.meta.TransactionIndex * 0.000001

			return aRank - bRank
		})
	}
}