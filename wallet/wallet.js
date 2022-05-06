import rk from 'ripple-keypairs'

export function deriveAddress({ seed, publicKey }){
	return seed
		? rk.deriveAddress(rk.deriveKeypair(seed).publicKey)
		: rk.deriveAddress(publicKey)
}