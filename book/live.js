export async function subscribe({ loadBefore = false } = {}){
	// todo: implement this to respect balance changes as well (oof)

	/*if(subscribed)
		return

	subscribed = true

	if(loadBefore)
		await book.load()

	await socket.request({
		command: 'subscribe',
		books: [{
			taker_gets: takerGets,
			taker_pays: takerPays,
			both: true
		}]
	})

	socket.on('transaction', this.txh = tx => this.diff(tx))*/
}

export async function unsubscribe(){
	if(!subscribed)
		return

	subscribed = false

	await socket.request({
		command: 'unsubscribe',
		books: [{
			taker_gets: takerGets,
			taker_pays: takerPays
		}]
	})
}
