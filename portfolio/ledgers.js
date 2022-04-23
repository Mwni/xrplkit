import { rippleToUnix } from '@xrplworks/time'


export default class{
	constructor(portfolio){
		this.pf = portfolio
		this.suppliers = []
		this.times = {}
	}

	async load({ ledgerIndices }){
		await this.fill(
			ledgerIndices.map(index => ({
				index,
				resolve: time => this.times[index] = time
			}))
		)
	}

	async cull({ excludeLedgerIndices }){
		for(let index of Object.keys(this.times)){
			if(excludeLedgerIndices.includes(parseInt(index)))
				continue

			delete this.times[index]
		}
	}

	async fill(batch){
		for(let request of [...this.suppliers, this.fetchFromXRPL]){
			if(batch.length === 0)
				break

			batch = await request.call(this, batch)
		}
	}

	async fetchFromXRPL(batch){
		for(let { index, resolve } of batch){
			this.pf.queue.add({
				stage: 'ledger-lookup',
				ledgerIndex: index,
				execute: async () => {
					let { ledger } = await this.pf.socket.request({
						command: 'ledger',
						ledger_index: index
					})

					resolve(rippleToUnix(ledger.close_time))
				}
			})
		}

		await this.pf.queue.wait('ledger-lookup')
		return []
	}

	get data(){
		return this.times
	}

	set data(data){
		this.times = data
	}
}