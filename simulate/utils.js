import { sub, div, min, max, eq, lt } from '@xrplkit/xfl'

export function withinRelativeDistance(value1, value2, distance){
	if(eq(value1, value2))
		return true

	let valueMin = min(value1, value2)
	let valueMax = max(value1, value2)

	return lt(div(sub(valueMax, valueMin), valueMax), distance)
}
