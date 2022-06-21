import { eq, lt } from '../index.js'

export function sort(array, key){
	if(array){
		return array
			.map(item => [item, typeof key === 'function' ? key(item) : item[key]])
			.sort((a, b) => compare(a[1], b[1]))
			.map(([item]) => item)

	}else{
		return array
			.slice()
			.sort(compare)
	}
}

function compare(a, b){
	if(eq(a, b))
		return 0

	return lt(a, b) ? -1 : 1
}