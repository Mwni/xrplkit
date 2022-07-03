import { calcOfferValues } from './offer.js'
import { isSameCurrency } from '@xrplkit/amount'
import { gt } from '@xrplkit/xfl'


export function diffLedger({ book, ledger }){
	if(book.ledgerSequence != ledger.ledger_index - 1)
		throw new Error(`Cannot diff book to ledger #${ledger.ledger_index}: Book is at ledger #${book.ledgerSequence}`)

	for(let tx of ledger.transactions){
		diffTx({ book, tx })
	}
}


export function diffTx({ book, tx }){
	let didChange = false
	let meta = tx?.meta || tx.metaData

	if(!meta?.AffectedNodes)
		return

	for(let { CreatedNode, ModifiedNode, DeletedNode } of meta.AffectedNodes){
		let node = CreatedNode || ModifiedNode || DeletedNode

		if(node.LedgerEntryType === 'Offer'){
			if(CreatedNode){
				if(!isSameCurrency(CreatedNode.NewFields.TakerPays, book.takerPays))
					continue

				if(!isSameCurrency(CreatedNode.NewFields.TakerGets, book.takerGets))
					continue

				let { quality } = calcOfferValues(node.NewFields)
				let added = false
				let newOffer = { 
					...CreatedNode.NewFields,
					index: CreatedNode.LedgerIndex
				}

				for(let i=0; i<book.offers.length; i++){
					let offer = book.offers[i]
					let { quality: otherQuality } = calcOfferValues(offer)

					if(gt(quality, otherQuality)){
						book.offers.splice(i, 0, newOffer)
						added = true
						break
					}
				}

				if(!added)
					book.offers.push(newOffer)

			}else if(ModifiedNode){
				Object.assign(
					book.offers.find(
						offer => offer.index === ModifiedNode.LedgerIndex
					),
					ModifiedNode.FinalFields
				)
			}else if(DeletedNode){
				book.offers.splice(
					book.offers.findIndex(
						offer => offer.index === DeletedNode.LedgerIndex
					),
					1
				)
			}

			didChange = true
		}
	}

	if(didChange)
		book.emit('change')
}