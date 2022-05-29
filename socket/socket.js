import { EventEmitter } from '@mwni/events'


export default class Socket extends EventEmitter{
	constructor(url, options = {stayConnected: true}){
		super()
		this.whenReady = new Promise(
			resolve => this.nowReady = resolve
		)

		if(url)
			this.connect(url, options)
	}

	async connect(url, options){
		if(this.url === url)
			return

		this.url = url
		this.options = options

		await this.createConnection(url, options)
		
		return this
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

	async createConnection(url, options){
		await new Promise(async (resolve, reject) => {
			this.socket = this.createSocket({ url, options })

			console.log('created')
			
			this.socket.addEventListener('open', () => {
				this.connected = true
				this.requestCounter = 0
				this.requestRegistry = []

				console.log('open')

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

				this.nowReady()
				this.emit('connected')

				resolve()
			})

			this.socket.addEventListener('error', error => {
				this.connectionError = error
				this.emit('error', error)
			})

			this.socket.addEventListener('close', async event => {
				this.whenReady = new Promise(
					resolve => this.nowReady = resolve
				)

				if(this.connected){
					for(let { reject } of this.requestRegistry){
						reject(new Error(event.reason))
					}

					this.connected = false
					this.emit('disconnected', event)
				}

				if(this.options.stayConnected){
					await new Promise(resolve => setTimeout(resolve, 1000))
					await this.createConnection(this.url, this.options)
						.catch(error => reject(error))
				}
			})
		})
	}

	isConnected(){
		return this.socket && this.socket.readyState === 1
	}
}