import Socket from './socket.js'
import WebSocket from 'ws'

export default class NodeSocket extends Socket{
	createSocket({ url, options }){
		return new WebSocket(url, options)
	}
}