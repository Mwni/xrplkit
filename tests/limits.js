import Book from '@xrplkit/book'
import { div } from '@xrplkit/xfl'

const book = Book({
	takerGets: {
		currency: 'XAU',
		issuer: '?',
	},
	takerPays: {
		currency: 'XRP',
	}
})

book.offers.push({
	TakerGets: {
		currency: 'XAU',
		issuer: '?',
		value: '1'
	},
	TakerPays: {
		currency: 'XRP',
		value: '100'
	}
})

book.offers.push({
	TakerGets: {
		currency: 'XAU',
		issuer: '?',
		value: '1'
	},
	TakerPays: {
		currency: 'XRP',
		value: '1000'
	}
})

let filledOffer = book.fill({
	takerGets: '200',
	takerPays: '1.05',
	tfSell: true
})

console.log(div(200, 1.05))
console.log(filledOffer)
console.log(div(filledOffer.takerGets, filledOffer.takerPays))