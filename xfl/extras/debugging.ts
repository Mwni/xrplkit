import { fromAny } from '../conversion/any.js'
import { toBigInt } from '../conversion/bigint.js'

export function toBinaryString(xfl) {
	// @ts-ignore
	let buf = Buffer.alloc(8)

	buf.writeBigInt64BE(toBigInt(fromAny(xfl)))

	let result = []

	for (let b of buf) {
	// @ts-ignore
		result.push(b.toString(2).padStart(8, '0'))
	}

	return result.join(' ')
  }