import { EventEmitter } from '@mwni/events'
import Live from './live.js'


export default class Portfolio extends EventEmitter{
	constructor({ account, socket, quoteCurrency, historyResolution = 150 }){
		super()
		this.account = account
		this.socket = socket
		this.quoteCurrency = quoteCurrency || {currency: 'XRP'}
		this.networth = '0'
		this.tokens = {}

		this.live = new Live(this)
	}

	async load(){
		await this.account.loadInfo()
		await this.account.loadLines({ direction: 'outbound' })
		this.syncWithAccount()
	}

	async subscribe(){
		await this.load()
		await this.live.subscribe()
	}

	syncWithAccount(){
		for(let line of this.account.lines){
			if(/(^\-)|(^\0$)/.test(line.balance))
				continue

			this.tokens[`${line.currency}:${line.account}`] = {
				currency: line.currency,
				issuer: line.account,
				balance: line.balance,
				networth: '0'
			}
		}
	}
}