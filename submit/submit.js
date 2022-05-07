import rb from 'ripple-binary-codec'
import { sign, derivePublicKey } from '@xrplkit/wallet'


export async function submitAndWait({ socket, ...args }){
	let result
	
	await socket.request({
		command: 'subscribe',
		streams: ['transactions']
	})

	try{
		result = await submit({ socket, ...args })

		if(result.engine_result.startsWith('tec'))
			return result

		let { transaction, meta } = await new Promise((resolve, reject) => {
			socket.on('transaction', tx => {
				if(tx.transaction.hash === result.tx_json.hash){
					resolve(tx)
				}
			})
		})

		return {
			engine_result: meta.TransactionResult,
			accepted: true,
			applied: true,
			tx_json: transaction,
			meta
		}
	}catch(error){
		throw error
	}finally{
		await socket.request({
			command: 'unsubscribe',
			streams: ['transactions']
		})
	}
}


export async function submit({ socket, tx, seed, privateKey, autofill: autofillEnabled }){
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