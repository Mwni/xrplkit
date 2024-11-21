import createSocket from './socket.js'


export default function({ url, apiVersion, autoReconnect = true, autoRetryRequests = true, socketOptions }){
	return createSocket({
		url, 
		apiVersion, 
		autoReconnect, 
		autoRetryRequests, 
		socketOptions,
		socketImpl: ({ url }) => new WebSocket(url)
	})
}