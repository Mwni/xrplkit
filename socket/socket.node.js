import createSocket from './socket.js'
import WSWebSocket from 'ws'


export default function({ url, apiVersion, autoReconnect = true, autoRetryRequests = true, reconnectDelay, rateLimitBackoff, maxRateLimitBackoff, socketOptions }){
	return createSocket({
		url, 
		apiVersion, 
		autoReconnect, 
		autoRetryRequests, 
		reconnectDelay,
		rateLimitBackoff,
		maxRateLimitBackoff,
		socketOptions,
		socketImpl: ({ url }) => process.versions.bun
			? new WebSocket(url)
			: new WSWebSocket(url)
	})
}