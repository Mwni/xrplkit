
export async function loadBook({ takerPays, takerGets, ledgerSequence='validated', limit=100, socket }){
	let count = limit
	let book = {
		takerPays,
		takerGets,
		ledgerSequence,
		offers: [],
		amm: null,
		incomplete: true,
		loadMore: async () => {
			let result = await socket.request({
				command: 'book_offers',
				ledger_index: ledgerSequence,
				taker_gets: {
					currency: takerGets.currency,
					issuer: takerGets.issuer
				},
				taker_pays: {
					currency: takerPays.currency,
					issuer: takerPays.issuer
				},
				limit: count
			})

			if(result.offers.length > book.offers.length){
				book.offers.length = 0
				book.offers.push(...result.offers)
				book.ledgerSequence = result.ledger_index || result.ledger_current_index
				count += limit
			}else{
				book.incomplete = false
			}
		}
	}

	await book.loadMore()

	try{
		book.amm = await xrpl.request({
			command: 'amm_info',
			asset: {
				currency: takerGets.currency,
				issuer: takerGets.issuer
			},
			asset2: {
				currency: takerPays.currency,
				issuer: takerPays.issuer
			},
			ledger_index: 'validated'
		}).amm
	}catch{}

	return book
}