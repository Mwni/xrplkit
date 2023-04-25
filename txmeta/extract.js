import { fromRippled as fromRippledAmount, isSameCurrency } from '@xrplkit/amount'
import { sum, sub, div, mul, eq, gt, lt } from '@xrplkit/xfl'


export function extractExchanges(tx, options={}){
	let hash = tx.hash || tx.transaction?.hash || tx.tx?.hash
	let taker = tx.Account || tx.transaction?.Account || tx.tx?.Account
	let exchanges = []
	

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
				currency: finalTakerPays.currency, 
				issuer: finalTakerPays.issuer,
				value: sub(previousTakerPays.value, finalTakerPays.value).toString()
			},
			takerGot: {
				currency: finalTakerGets.currency, 
				issuer: finalTakerGets.issuer,
				value: sub(previousTakerGets.value, finalTakerGets.value).toString()
			}
		})
	}

	if(options.collapse){
		let collapsed = []

		for(let e of exchanges){
			let col = collapsed.find(c => 
				isSameCurrency(c.takerPaid, e.takerPaid) 
				&& isSameCurrency(c.takerGot, e.takerGot)
			)

			if(!col){
				collapsed.push({
					takerPaid: e.takerPaid,
					takerGot: e.takerGot
				})
			}else{
				col.takerPaid.value = sum(col.takerPaid.value, e.takerPaid.value).toString()
				col.takerGot.value = sum(col.takerGot.value, e.takerGot.value).toString()
			}
		}

		return collapsed
	}

	return exchanges
}

export function extractBalanceChanges(tx, options={}){
	let parties = {}
	let bookChange = ({currency, issuer, account, previous, final}) => {
		if(previous === final)
			return

		let party = parties[account]

		if(!party)
			party = parties[account] = []

		if(eq(previous, final))
			return

		if(party.some(e => e.currency === currency && e.issuer === issuer))
			throw 'no way'

		party.push({
			currency,
			issuer,
			previous: previous.toString(),
			final: final.toString(),
			change: sub(final, previous).toString()
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
			let final = finalFields?.Balance?.value || '0'
			let previous = previousFields?.Balance?.value || '0'
			let issuer
			let account

			if(gt(previous, 0) || gt(final, 0)){
				issuer = finalFields.HighLimit.issuer
				account = finalFields.LowLimit.issuer
			}else if(lt(previous, 0) || lt(final, 0)){
				issuer = finalFields.LowLimit.issuer
				account = finalFields.HighLimit.issuer
				final = mul(final, -1)
				previous = mul(previous, -1)
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
			let final = div(finalFields?.Balance || '0', '1000000')
			let previous = div(previousFields?.Balance || '0', '1000000')

			if(options.ignoreTxFee)
				final = sum(
					final,
					div(
						tx.tx?.Fee || tx.Fee,
						'1000000'
					)
				)

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

export function extractCurrenciesInvolved(tx){
	let currencies = []
	let add = entry => {
		if(typeof entry === 'string')
			entry = {currency: 'XRP'}

		if(currencies.every(currency => !isSameCurrency(currency, entry))){
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

export function extractAffectedNFT(tx){
	let previousNFTs = []
	let finalNFTs = []
	let firstAccount

	for(let { CreatedNode, ModifiedNode, DeletedNode } of (tx.meta || tx.metaData).AffectedNodes){
		let node = CreatedNode || ModifiedNode || DeletedNode

		if(node.LedgerEntryType !== 'NFTokenPage')
			continue

		let account = node.LedgerIndex.slice(0, 40)

		if(firstAccount && firstAccount !== account)
			continue

		firstAccount = account

		if(node.PreviousFields?.NFTokens)
			previousNFTs.push(...node.PreviousFields.NFTokens.map(({ NFToken }) => NFToken))

		if(node.FinalFields?.NFTokens)
			finalNFTs.push(...node.FinalFields.NFTokens.map(({ NFToken }) => NFToken))
	}

	let [a, b] = finalNFTs.length > previousNFTs.length
		? [finalNFTs, previousNFTs]
		: [previousNFTs, finalNFTs]

	return a.find(
		n1 => b.every(
			n2 => n1.NFTokenID !== n2.NFTokenID
		)
	)
}

// todo improve
export function extractAffectedAccounts(tx){
	let accounts = []

	for(let node of (tx.meta || tx.metaData).AffectedNodes){
		let nodeKey = Object.keys(node)[0]
		let nodeData = node[nodeKey]
		let fields = nodeData.FinalFields || nodeData.NewFields

		if(!fields?.Account)
			continue

		if(!accounts.includes(fields.Account))
			accounts.push(fields.Account)
	}

	return accounts
}