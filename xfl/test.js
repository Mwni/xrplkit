import { XFL, sum, div, toSortSafeBigInt } from './wrappers/class.js'

let list = []

for(let i=0; i<10; i++){
	list.push(toSortSafeBigInt(
		(Math.random() * 100 + 0.01) * (Math.random() < 0.5 ? -1 : 1)
	))
}

list.sort((a, b) => {
	if(a === b)
		return 0

	return a < b ? 1 : -1
})

console.log(
	list.map(x => XFL(x)).join('\n')
)