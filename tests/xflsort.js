import { toBigInt, toSortSafeBigInt } from '@xrplkit/xfl'

function dec2bin(dec) {
	return (dec >>> 0).toString(2)
}

console.log(dec2bin(Number.MAX_SAFE_INTEGER - 1053200000))
console.log(dec2bin(~((Number.MAX_SAFE_INTEGER - 1053200000) * -1)))
process.exit()

let array = Array(10).fill(0)
	.map(() => ({ value: Math.random() * 10 - 5 }))

let negShift = array
	.map(({ value }) => {
		let sort = toBigInt(value)

		sort = sort << 1n
		

		return { value, sort }
	})

let negXor = array
	.map(({ value }) => ({ value, sort: toSortSafeBigInt(value) }))

	console.log(negShift)

console.log(
	'using left shift:\n',
	negShift
		.sort((a, b) => Number(a.sort - b.sort))
		.map(({ value }) => value).join('\n')
)

console.log(
	'using xor:\n',
	negXor
		.sort((a, b) => Number(a.sort - b.sort))
		.map(({ value }) => value).join('\n')
)