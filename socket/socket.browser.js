import createSocket from './socket.js'


export default function(conf){
	return createSocket({
		...conf,
		socketImpl: ({ url }) => new WebSocket(url)
	})
}