import { EventEmitter } from '@mwni/events'


export default function ({ url, autoReconnect = true, autoRetryRequests = true, socketOptions, socketImpl }){
	let socket
	let requestCounter = 0
	let requestRegistry = []
	let connected = false
	let connectionError
	let events = new EventEmitter()

	function connect(){
		socket = socketImpl({ url, options: socketOptions })
		socket.addEventListener('open', handleOpen)
		socket.addEventListener('close', handleClose)
		socket.addEventListener('error', handleError)
		socket.addEventListener('message', handleMessage)
	}

	function handleOpen(event){
		connected = true
		events.emit('open', event)
		pushRequests()
	}

	function handleClose(event){
		if(autoReconnect){
			setTimeout(connect, 1000)
		}

		if(!connected){
			return
		}

		if(autoRetryRequests){
			for(let request of requestRegistry){
				request.sent = false
			}
		}else{
			for(let { reject } of requestRegistry){
				reject(new Error(event.reason))
			}
			requestRegistry.length = 0
		}
		
		connected = false
		events.emit('close', event)
	}

	function handleError(event){
		connectionError = event
		events.emit('error', event)
	}

	function handleMessage(event){
		let payload = JSON.parse(event.data)

		if(payload.id){
			let handlerIndex = requestRegistry.findIndex(({id}) => id === payload.id)

			if(handlerIndex >= 0){
				let handler = requestRegistry[handlerIndex]

				if(payload.result){
					handler.resolve(payload.result)
				}else{
					handler.reject(payload)
				}

				requestRegistry.splice(handlerIndex, 1)
			}
		}else if(payload.type){
			events.emit(payload.type, payload)
		}
	}

	function pushRequests(){
		if(!connected)
			return

		for(let request of requestRegistry){
			if(request.sent)
				return

			socket.send(JSON.stringify(request.message))
			request.sent = true
		}
	}

	connect()

	return Object.assign(
		events,
		{
			status(){
				return {
					connected,
					connectionError,
					openRequests: requestRegistry.map(
						request => ({
							id: request.id,
							sent: request.sent
						})
					)
				}
			},
			request(payload){
				let id = ++requestCounter
				let message = {...payload, id}

				return new Promise((resolve, reject) => {
					requestRegistry.push({ id, message, resolve, reject })
					pushRequests()
				})
			}
		}
	)
}