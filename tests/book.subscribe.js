import websocket from 'websocket'
import { Book } from '@xrplworks/book'
import { Socket } from '@xrplworks/socket'


global.WebSocket = websocket.w3cwebsocket


const socket = new Socket('wss://xrplcluster.com')
const book = new Book({
	socket,
	takerPays: {currency: 'XRP'},
	takerGets: {currency: 'USD', issuer: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B'}
})

console.log('subscribing to book...')

await book.subscribe()
console.log('subscribed to book. waiting for changes...')

book.on('update', () => {
	let offer = book.fill({takerPays: '1000'})
	console.log(offer)
})