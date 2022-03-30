import Socket from './socket.js'

export default class BrowserSocket extends Socket{
	createSocket({ url }){
		return new WebSocket(url)
	}
}