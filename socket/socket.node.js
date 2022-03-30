import Socket from './socket.js'
import websocket from 'websocket'

export default class NodeSocket extends Socket{
	createSocket({ url }){
		return new websocket.w3cwebsocket(url)
	}
}