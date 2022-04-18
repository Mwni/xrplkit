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

			let results = await request.call(this, batch)

			for(let i=0; i<results.length; i++){
				if(results[i]){
					batch[i].resolve(results[i])
					batch[i] = null
				}
			}

			batch = batch.filter(Boolean)
		}
	}

	async fetchFromXRPL(batch){
		let results = Array(batch.length)
			.fill(0)
			.map(() => null)


		for(let i=0; i<batch.length; i++){
			let { ledgerIndex } = batch[i]

			this.tk.pf.queue.add({
				stage: 'ledger-lookup',
				do: async () => {
					let { ledger } = await this.tk.pf.socket.request({
						command: 'ledger',
						ledger_index: ledgerIndex
					})

					results[i] = rippleToUnix(ledger.close_time)
				}
			})
		}

		await this.tk.pf.queue.wait('ledger-lookup')

		return results
	}
}