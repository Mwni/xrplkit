import createSocket from './socket.js'
import WSWebSocket from 'ws'


export default function(conf){
	return createSocket({
		...conf,
		socketImpl: ({ url }) => process.versions.bun
			? new WebSocket(url)
			: new WSWebSocket(url)
	})
}