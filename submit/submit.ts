import * as rb from 'ripple-binary-codec'
import * as xw from '@xrplkit/wallet'


const resubmitAfter = 4500


export async function submitAndWait({ tx, socket, ...opts }){
	let blob = rb.encode(await prepare({ tx, socket, ...opts }))
	let first = true

	while(true){
		let result = await socket.request({
			command: 'submit',
			tx_blob: blob
		})
		
		if(!result.accepted)
			throw result

		if(first || result.engine_result !== 'tefPAST_SEQ'){
			if(!result.applied && !result.broadcast && !result.queued)
				return result
		}
		
		let hash = result.tx_json.hash
		let submissionTime = Date.now()
		
		if(result.engine_result.startsWith('tec'))
		return result
		
		first = false
		
		while(true){
			await new Promise(resolve => setTimeout(resolve, 500))

			try{
				var tx = await socket.request({
					command: 'tx',
					transaction: hash
				})
			}catch{
				continue
			}

			if(tx.validated){
				return {
					engine_result: tx.meta.TransactionResult,
					accepted: true,
					applied: true,
					tx_json: tx,
					meta: tx.meta
				}
			}else{
				if(Date.now() - submissionTime > resubmitAfter){
					break
				}
			}
		}
	}
}

export async function submit({ tx, socket, ...opts }){
	let result = await socket.request({
		command: 'submit',
		tx_blob: rb.encode(await prepare({ tx, socket, ...opts }))
	})

	if(result.accepted)
		return result
	else
		throw result
}

export async function prepare({ tx, socket, seed, privateKey, autofill }:any){
	if(autofill)
		tx = await fill({ tx, socket })

	return sign({ tx, seed, privateKey })
}

export async function fill({ tx, socket }){
	let filledTx = {...tx}

	if(!tx.Sequence){
		let { account_data: { Sequence }} = await socket.request({
			command: 'account_info',
			account: tx.Account
		})

		filledTx.Sequence = Sequence
	}

	if(!tx.Fee){
		filledTx.Fee = '12'
	}

	return filledTx
}

export async function sign({ tx, seed, privateKey }){
	if(!seed && !privateKey){
		throw new Error(`Missing "seed" or "privateKey"`)
	}

	tx = {
		...tx,
		SigningPubKey: xw.derivePublicKey({ 
			seed, 
			privateKey 
		})
	}

	return {
		...tx,
		TxnSignature: xw.sign({
			hex: rb.encodeForSigning(tx),
			seed,
			privateKey
		})
	}
}