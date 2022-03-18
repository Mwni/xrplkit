import Decimal from 'decimal.js'
import { fromRippled as fromRippledAmount } from '@xrplworks/amount'
import { decode as decodeCurrency, compare as compareCurrency } from '@xrplworks/currency'


export function extractExchanges(tx, options={}){
	let hash = tx.hash || tx.transaction?.hash || tx.tx?.hash
	let taker = tx.Account || tx.transaction?.Account || tx.tx?.Account
	let exchanges = []

	console.log(tx)

	for(let affected of (tx.meta || tx.metaData).AffectedNodes){
		let node = affected.ModifiedNode || affected.DeletedNode

		if(!node || node.LedgerEntryType !== 'Offer')
			continue

		if(!node.PreviousFields || !node.PreviousFields.TakerPays || !node.PreviousFields.TakerGets)
			continue

		let maker = node.FinalFields.Account
		let sequence = node.FinalFields.Sequence
		let previousTakerPays = fromRippledAmount(node.PreviousFields.TakerPays)
		let previousTakerGets = fromRippledAmount(node.PreviousFields.TakerGets)
		let finalTakerPays = fromRippledAmount(node.FinalFields.TakerPays)
		let finalTakerGets = fromRippledAmount(node.FinalFields.TakerGets)

		exchanges.push({
			hash,
			maker,
			taker,
			sequence,
			takerPaid: {
				currency: decodeCurrency(finalTakerPays.currency), 
				issuer: finalTakerPays.issuer,
				value: Decimal.sub(previousTakerPays.value, finalTakerPays.value)
					.toString()
			},
			takerGot: {
				currency: decodeCurrency(finalTakerGets.currency), 
				issuer: finalTakerGets.issuer,
				value: Decimal.sub(previousTakerGets.value, finalTakerGets.value)
					.toString()
			}
		})
	}

	if(options.collapse){
		let collapsed = []

		for(let e of exchanges){
			let col = collapsed.find(c => 
				compareCurrency(c.takerPaid, e.takerPaid) 
				&& compareCurrency(c.takerGot, e.takerGot)
			)

			if(!col){
				collapsed.push({
					takerPaid: e.takerPaid,
					takerGot: e.takerGot
				})
			}else{
				col.takerPaid.value = Decimal.sum(col.takerPaid.value, e.takerPaid.value)
					.toString()

				col.takerGot.value = Decimal.sum(col.takerGot.value, e.takerGot.value)
					.toString()
			}
		}

		return collapsed
	}

	return exchanges
}

export function extractBalanceChanges(tx){
	let parties = {}
	let bookChange = ({currency, issuer, account, previous, final}) => {
		if(previous === final)
			return

		let party = parties[account]

		if(!party)
			party = parties[account] = []

		if(party.some(e => e.currency === currency && e.issuer === issuer))
			throw 'no way'

		party.push({
			currency,
			issuer,
			previous,
			final,
			change: Decimal.sub(final, previous)
		})
	}

	for(let affected of (tx.meta || tx.metaData).AffectedNodes){
		let key = Object.keys(affected)[0]
		let node = affected[key]
		let finalFields = node.FinalFields || node.NewFields
		let previousFields = node.PreviousFields


		if(node.LedgerEntryType === 'RippleState'){
			if(key === 'ModifiedNode' && !previousFields.Balance)
				continue

			let currency = finalFields.Balance.currency
			let final = new Decimal(finalFields?.Balance?.value || '0')
			let previous = new Decimal(previousFields?.Balance?.value || '0')
			let issuer
			let account

			if(previous.gt(0) || final.gt(0)){
				issuer = finalFields.HighLimit.issuer
				account = finalFields.LowLimit.issuer
			}else if(previous.lt(0) || final.lt(0)){
				issuer = finalFields.LowLimit.issuer
				account = finalFields.HighLimit.issuer
				final = final.times(-1)
				previous = previous.times(-1)
			}

			bookChange({
				currency, 
				issuer, 
				account, 
				previous,
				final
			})
		}else if(node.LedgerEntryType === 'AccountRoot'){
			if(!finalFields)
				continue

			let account = finalFields.Account
			let final = new Decimal(finalFields?.Balance || '0')
				.div('1000000')
			let previous = new Decimal(previousFields?.Balance || '0')
				.div('1000000')


			bookChange({
				currency: 'XRP',
				issuer: null, 
				account, 
				previous,
				final
			})
		}
	}

	return parties
}

export function extractCurrencies(tx){
	let currencies = []
	let add = entry => {
		if(typeof entry === 'string')
			entry = {currency: 'XRP'}

		if(currencies.every(currency => !compareCurrency(currency, entry))){
			currencies.push(entry)
		}
	}

	for(let node of (tx.meta || tx.metaData).AffectedNodes){
		let nodeKey = Object.keys(node)[0]
		let nodeData = node[nodeKey]
		let fields = nodeData.FinalFields || nodeData.NewFields

		if(fields && fields.TakerGets){
			add(fields.TakerGets)
			add(fields.TakerPays)
		}
	}

	return currencies
}