import { EventEmitter } from '@mwni/events'


export default class extends EventEmitter{
	constructor(url){
		super()
		this.whenReady = new Promise(
			resolve => this.nowReady = resolve
		)

		if(url)
			this.connect(url)
	}

	async request(payload){
		await this.whenReady

		let id = ++this.requestCounter
		let message = {...payload, id}

		return new Promise((resolve, reject) => {
			this.requestRegistry.push({id, resolve, reject})
			this.socket.send(JSON.stringify(message))
		})
	}

	connect(url){
		this.url = url
		this.connectRelentlessly()
		
		return this
	}


	async connectRelentlessly(){
		while(true){
			try{
				await this.createSocketConnection()

				this.nowReady()
				this.emit('connected')

				break
			}catch(error){
				await new Promise(resolve => setTimeout(resolve, 1000))
			}
		}
	}


	async createSocketConnection(){
		await new Promise(async (resolve, reject) => {
			this.socket = new WebSocket(this.url)
			this.socket.addEventListener('open', () => {
				this.connected = true
				this.requestCounter = 0
				this.requestRegistry = []

				this.socket.addEventListener('message', event => {
					let payload = JSON.parse(event.data)

					if(payload.id){
						let handlerIndex = this.requestRegistry.findIndex(({id}) => id === payload.id)

						if(handlerIndex >= 0){
							let handler = this.requestRegistry[handlerIndex]

							if(payload.result){
								handler.resolve(payload.result)
							}else{
								handler.reject(payload)
							}

							this.requestRegistry.splice(handlerIndex, 1)
						}
					}else if(payload.type){
						this.emit(payload.type, payload)
					}
				})

				this.socket.addEventListener('close', async () => {
					this.whenReady = new Promise(resolve => this.nowReady = resolve)
					this.emit('disconnected')

					await new Promise(resolve => setTimeout(resolve, 1000))
					await this.connectRelentlessly()
				})

				resolve()
			})


			this.socket.addEventListener('error', error => {
				this.connectionError = error
				reject(error)
			})
		})
	}

	isConnected(){
		return this.socket && this.socket.readyState === 1
	}
}