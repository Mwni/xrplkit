import createSocket from './socket.js'
import WebSocket from 'ws'


export default function(conf){
	return createSocket({
		...conf,
		socketImpl: ({ url }) => new WebSocket(url)
	})
}