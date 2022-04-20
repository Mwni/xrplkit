import { rippleToUnix } from '@xrplworks/time'


export default class{
	constructor(tokens){
		this.tk = tokens
		this.suppliers = []
	}


	async fill(batch){
		for(let request of [...this.suppliers, this.fetchFromXRPL]){
			if(batch.length === 0)
				break

			batch = await request.call(this, batch)
		}
	}

	async fetchFromXRPL(batch){
		for(let { ledgerIndex, resolve } of batch){
			this.tk.pf.queue.add({
				stage: 'ledger-lookup',
				ledgerIndex,
				execute: async () => {
					let { ledger } = await this.tk.pf.socket.request({
						command: 'ledger',
						ledger_index: ledgerIndex
					})

					resolve(rippleToUnix(ledger.close_time))
				}
			})
		}

		await this.tk.pf.queue.wait('ledger-lookup')

		return []
	}
}