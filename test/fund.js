import fs from 'fs'
import fetch from 'node-fetch'
import { submitAndWait } from '@xrplkit/submit'
import { deriveAddress, generateSeed } from '@xrplkit/wallet'
import { mul } from '@xrplkit/xfl'


export default class Fund{
	constructor({ walletFile, socket, faucet, genesis }){
		this.socket = socket
		this.faucet = faucet
		this.genesis = genesis
		this.walletFile = walletFile

		try{
			this.wallets = JSON.parse(
				fs.readFileSync(walletFile, 'utf-8')
			)
		}catch(error){
			console.log(`no wallet file: ${error.message}`)
			this.wallets = {}
		}
	}

	hasWallet({ id }){
		return this.wallets.hasOwnProperty(id)
	}

	async getWallet({ id, balance }){
		if(this.wallets[id])
			return this.wallets[id]

		return this.faucet
			? await this.#fundWalletFromFaucet({ id, balance })
			: await this.#fundWalletFromGenesis({ id, balance })
	}

	async #fundWalletFromFaucet({ id, balance }){
		process.stdout.write(`funding wallet "${id}" ... `)

		let response = await fetch(this.faucet.url, {method: 'POST'})

		if(response.ok){
			let { account } = await response.json()
			let wallet = {
				address: account.address,
				seed: account.secret
			}

			while(true){
				try{
					await this.socket.request({
						command: 'account_info',
						ledger_index: 'validated',
						account: wallet.address
					})
					break
				}catch{
					await new Promise(resolve => setTimeout(resolve, 1000))
				}
			}

			console.log(`success`)
			this.#saveWallet({ id, wallet })

			return wallet
		}else{
			console.log(`failure`)
			throw new Error(`failed to call faucet endpoint (${response.status}): ${await response.text()}`)
		}
	}

	async #fundWalletFromGenesis({ id, balance = '1000' }){
		process.stdout.write(`funding wallet "${id}" ... `)

		let seed = generateSeed()
		let address = deriveAddress({ seed })
		let wallet = { seed, address }

		let result = await submitAndWait({
			socket: this.socket,
			tx: {
				TransactionType: 'Payment',
				Account: deriveAddress(this.genesis),
				Destination: address,
				Amount: mul(balance, '1000000')
			},
			...this.genesis,
			autofill: true
		})

		if(result.engine_result === 'tesSUCCESS'){
			console.log(`success`)
			this.#saveWallet({ id, wallet })

			return wallet
		}else{
			console.log(`failure`)
			throw new Error(`failed to fund wallet from genesis: ${result.engine_result}`)
		}
	}

	async #saveWallet({ id, wallet }){
		this.wallets[id] = wallet

		fs.writeFileSync(
			this.walletFile, 
			JSON.stringify(this.wallets, null, 4)
		)
	}
}