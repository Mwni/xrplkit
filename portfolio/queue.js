import { EventEmitter } from '@mwni/events'


export default class extends EventEmitter{
	constructor(portfolio){
		super()
		this.branches = {}
	}

	add(task){
		let branch = this.branches[task.stage]

		if(!branch){
			branch = this.branches[task.stage] = {
				chain: Promise.resolve(),
				progress: { 
					value: 0,
					total: 0
				}
			}

			console.log('CREATE', task.stage)
		}

		branch.progress.total++
		
		return branch.chain = branch.chain
			.then(() => {
				this.emit('change', this.progress)
				return task.do()
			})
			.then(() => {
				branch.progress.value++

				if(branch.progress.value === branch.progress.total){
					this.emit('change', this.progress)
				}
			})
	}

	wait(stage){
		return this.branches[stage].chain
	}
}