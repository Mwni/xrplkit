import { toBigInt, toSortSafeBigInt } from '@xrplkit/xfl'

let array = Array(10).fill(0)
	.map(() => ({ value: Math.random() * 10 - 5 }))

let negShift = array
	.map(({ value }) => ({ value, sort: toBigInt(value) << 1n }))

let negXor = array
	.map(({ value }) => ({ value, sort: toSortSafeBigInt(value) }))


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