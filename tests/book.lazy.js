import websocket from 'websocket'
import { Book } from '@xrplworks/book'
import { Socket } from '@xrplworks/socket'


global.WebSocket = websocket.w3cwebsocket


//selling ELS

const socket = new Socket('wss://xrplcluster.com')
const book = new Book({
	socket,
	takerGets: {currency: 'XRP'},
	takerPays: {currency: 'ELS', issuer: 'rHXuEaRYnnJHbDeuBH5w8yPh5uwNVh5zAg'}
})

console.log('lazy filling...')

let offer = await book.fillLazy({takerPays: '1100'})

console.log(offer)