import XFL from '@xrplworks/xfl'


export default class Metrics{
	constructor(tokens){
		this.tk = tokens
		this.networth = '0'
		this.performance = '0'
	}

	async update(){
		this.updateNetworth()
		this.updatePerformance()
	}

	updateNetworth(){
		let [ xrp, ...tokens ] = this.tk.registry.array
		let networth = new XFL(xrp.balance)
		
		for(let token of tokens){
			if(this.values[token.key])
				networth = networth.plus(this.values[token.key])
		}
		
		this.networth = networth.toString()
	}

	updatePerformance(){

	}
}