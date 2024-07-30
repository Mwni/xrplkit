import { lt } from '@xrplkit/xfl'

console.log('should be false:', lt('10', '1'))
console.log('should be true:', lt('1', '10'))
console.log('should be false:', lt('1.2', '1.1'))
console.log('should be true:', lt('1.1', '1.2'))
console.log('should be true:', lt('-10', '-1'))
console.log('should be false:', lt('-1', '-10'))
console.log('should be true:', lt('-1.2', '-1.1'))
console.log('should be false:', lt('-1.1', '-1.2'))