import { compare as isSameCurrency } from '@xrplworks/currency'


export default class Tokens{
	static key({ currency, issuer }){
		return issuer
			? `${currency}:${issuer}`
			: currency
	}

	constructor(portfolio){
		this.pf = portfolio
		this.map = {}
	}

	create(){
		this.map = {}
		this.map.XRP = {
			key: 'XRP',
			currency: 'XRP',
			balance: this.pf.account.balance,
			timeline: []
		}

		for(let line of this.pf.account.lines){
			if(/(^\-)|(^\0$)/.test(line.balance))
				continue

			let key = Tokens.key({...line, issuer: line.account})

			this.map[key] = {
				key,
				currency: line.currency,
				issuer: line.account,
				balance: line.balance,
				timeline: []
			}
		}
	}

	get array(){
		return Object.values(this.map)
	}

	isQuote(currency){
		return isSameCurrency(currency, this.pf.quoteCurrency)
	}
}