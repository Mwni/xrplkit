import rb from 'ripple-binary-codec'
import { sign, derivePublicKey } from '@xrplkit/wallet'


const resubmitAfter = 4000


export async function submitAndWait({ socket, ...args }){
	while(true){
		let result = await submit({ socket, ...args })
		let hash = result.tx_json.hash
		let submissionTime = Date.now()

		if(result.engine_result.startsWith('tec'))
			return result

		while(true){
			await new Promise(resolve => setTimeout(resolve, 500))

			let tx = await socket.request({
				command: 'tx',
				transaction: hash
			})

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


export async function submit({ socket, tx, seed, privateKey, autofill: autofillEnabled }){
	if(!seed && !privateKey){
		throw new Error(`Missing "seed" or "privateKey"`)
	}

	tx = autofillEnabled 
		? await autofill({ socket, tx }) : 
		{...tx}
	
	tx = {
		...tx,
		SigningPubKey: derivePublicKey({ 
			seed, 
			privateKey 
		})
	}

	tx = {
		...tx,
		TxnSignature: sign({
			hex: rb.encodeForSigning(tx),
			seed,
			privateKey
		})
	}


	let result = await socket.request({
		command: 'submit',
		tx_blob: rb.encode(tx)
	})

	if(result.accepted)
		return result
	else
		throw result
}

export async function autofill({ socket, tx }){
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