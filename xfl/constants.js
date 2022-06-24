export const mantissaMin = 1000000000000000n
export const mantissaMax = 9999999999999999n
export const mantissaMask = BigInt('0b111111111111111111111111111111111111111111111111111111')
export const exponentMin = -96n
export const exponentMax = 80n
export const exponentMask = BigInt('0b11111111')
export const valueMin = `${mantissaMin}e${exponentMin}`
export const valueMax = `${mantissaMax}e${exponentMax}`