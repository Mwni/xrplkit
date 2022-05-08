import Socket from '@xrplkit/socket'
import { Logger } from '@mwni/log'


export function create(name){
	let log = new Logger({ name, color: 'yellow' })
	let nodes = {}
	let faucets = []

	log.info(`*** ${name.toUpperCase()} - XRPL Test Case ***`)

	return {
		log,
		useNode({ id, url }){
			nodes[id] = {
				url,
				socket: new Socket(url)
			}
			
			log.info(`using node (${id}): ${url}`)
		},
		useFaucet({ url }){
			faucets.push(url)
			log.info(`using faucet: ${url}`)
		},
		useAccount({ id, minBalance = 25 }){
			
		}
	}
}