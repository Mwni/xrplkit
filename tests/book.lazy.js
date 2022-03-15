import websocket from 'websocket'
import { Book } from '@xrplworks/book'
import { Socket } from '@xrplworks/socket'


global.WebSocket = websocket.w3cwebsocket


//buying USD

const socket = new Socket('wss://xrplcluster.com')
const book = new Book({
	socket,
	takerPays: {currency: 'XRP'},
	takerGets: {currency: 'USD', issuer: 'rhub8VRN55s94qWKDv6jmDy1pUykJzF3wq'}
})

console.log('lazy filling...')

let offer = await book.fillLazy({takerPays: '100000'})

console.log(offer)