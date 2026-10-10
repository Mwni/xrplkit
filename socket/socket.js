import { createEmitter } from '@mwni/events'


export default function ({ 
	url, 
	apiVersion, 
	autoReconnect, 
	autoRetryRequests, 
	reconnectDelay = 1000,
	rateLimitBackoff = 5000,
	maxRateLimitBackoff = 300000,
	socketOptions, 
	socketImpl 
}){
	let events = createEmitter()
	let socket
	let requestCounter = 0
	let requestRegistry = []
	let connected = false
	let connectionError
	let rateLimited = false
	let rateLimitHits = 0
	let nextReconnectDelay = reconnectDelay

	function connect(){
		rateLimited = false
		socket = socketImpl({ url, options: socketOptions })
		socket.addEventListener('open', handleOpen)
		socket.addEventListener('close', handleClose)
		socket.addEventListener('error', handleError)
		socket.addEventListener('message', handleMessage)
	}

	function isRateLimitError(event){
		let message = event?.message || event?.error?.message || ''
		return /\b429\b/.test(message)
	}

	function computeReconnectDelay(){
		if(!rateLimited)
			return reconnectDelay

		let delay = Math.min(
			rateLimitBackoff * 2 ** rateLimitHits,
			maxRateLimitBackoff
		)

		rateLimitHits++

		return delay
	}

	function handleOpen(event){
		connected = true
		rateLimited = false
		rateLimitHits = 0
		nextReconnectDelay = reconnectDelay
		events.emit('open', event)
		pushRequests()
	}

	function handleClose(event){
		if(autoReconnect){
			nextReconnectDelay = computeReconnectDelay()

			if(rateLimited){
				events.emit('backoff', { delay: nextReconnectDelay, hits: rateLimitHits })
			}

			setTimeout(connect, nextReconnectDelay)
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

		if(isRateLimitError(event)){
			rateLimited = true
		}

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
				continue

			socket.send(JSON.stringify(request.message))
			request.sent = true
		}
	}

	connect()

	return {
		...events,
		get url(){
			return url
		},
		get apiVersion(){
			return apiVersion
		},
		get autoReconnect(){
			return autoReconnect
		},
		get autoRetryRequests(){
			return autoRetryRequests
		},
		get socketOptions(){
			return socketOptions
		},
		get connected(){
			return connected
		},
		get connectionError(){
			return connectionError
		},
		get rateLimited(){
			return rateLimited
		},
		get nextReconnectDelay(){
			return nextReconnectDelay
		},
		get requests(){
			return requestRegistry
				.filter(request => !!request.id)
				.map(
					request => ({
						id: request.id,
						sent: request.sent
					})
				)
		},
		request(payload){
			let id = ++requestCounter
			let message = {
				api_version: apiVersion,
				...payload, 
				id, 
			}

			return new Promise((resolve, reject) => {
				requestRegistry.push({ id, message, resolve, reject })
				pushRequests()
			})
		},
		close(){
			socket.close()
		}
	}
}