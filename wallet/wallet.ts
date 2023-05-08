import * as rk from 'ripple-keypairs'

export function generateSeed({ entropy, algorithm }: any = {}){
	return rk.generateSeed({ entropy, algorithm })
}

export function deriveAddress({ seed, publicKey }){
	return seed
		? rk.deriveAddress(rk.deriveKeypair(seed).publicKey)
		: rk.deriveAddress(publicKey)
}

export function derivePublicKey({ seed, privateKey }){
	return seed
		? rk.deriveKeypair(seed).publicKey
		: null
}

export function sign({ hex, seed, privateKey }){
	if(!seed && !privateKey)
		throw new Error('must specify either "seed" or "privateKey" for signing')

	if(!privateKey)
		privateKey = rk.deriveKeypair(seed).privateKey

	return rk.sign(hex, privateKey)
}