import { XFL, div, gt, lt} from '@xrplkit/xfl'
import { ammFromRippled, alignAMM } from '@xrplkit/amm'
import { tokenFromAmount } from '@xrplkit/tokens'
import { offerFromRippled } from './offer.js'

export function bookFromRippled(book, amm, issuers){
	let offers = []
	let ownerFunds = {}
	let rates = {
		transferRateIn: 1,
		transferRateOut: 1
	}

	if(book.offers.length === 0 && !amm){
		throw new Error(`Book is empty and no AMM passed`)
	}

	if(amm)
		amm = ammFromRippled(amm)

	for(let raw of book.offers){
		let offer = offerFromRippled(raw)

		if(raw.owner_funds){
			ownerFunds[raw.Account] = offer.takerGets.currency === 'XRP'
				? div(raw.owner_funds, '1000000')
				: XFL(raw.owner_funds)
		}

		offers.push(offer)
	}

	let takerGets = tokenFromAmount(offers[0] ? offers[0].takerGets : amm.amount1)
	let takerPays = tokenFromAmount(offers[0] ? offers[0].takerPays : amm.amount2)

	if(issuers){
		for(let token of [takerPays, takerGets]){
			if(token.currency === 'XRP')
				continue

			let issuer = issuers.find(issuer => issuer.Account === token.issuer)

			if(!issuer)
				continue

			rates[token === takerPays ? 'transferRateIn' : 'transferRateOut'] = (
				(issuer.TransferRate || 1000000000) / 1000000000
			)
		}
	}

	return {
		takerGets,
		takerPays,
		offers,
		ownerFunds,
		amm,
		ledgerSequence: book.ledger_index || book.ledger_current_index,
		...rates
	}
}

export async function loadBook({ takerPays, takerGets, ledgerSequence='current', limit=100, socket }){
	let promises = []
	let book = {
		takerPays,
		takerGets,
		ledgerSequence,
		offers: [],
		transferRateIn: 1,
		transferRateOut: 1,
		amm: null,
		incomplete: true,
	}

	for(let token of [takerPays, takerGets]){
		if(token.currency === 'XRP')
			continue

		promises.push(
			socket.request({ command: 'account_info', account: token.issuer})
				.then(info => info.account_data.TransferRate || 1000000000)
				.then(rate => rate / 1000000000)
				.then(fee => book[token === takerPays ? 'transferRateIn' : 'transferRateOut'] = fee)
		)
	}

	promises.push(loadMoreBookOffers({ book, limit, socket }))
	promises.push(
		socket.request({
			command: 'amm_info',
			asset: {
				currency: takerGets.currency,
				issuer: takerGets.issuer
			},
			asset2: {
				currency: takerPays.currency,
				issuer: takerPays.issuer
			},
			ledger_index: ledgerSequence
		})
			.then(info => ammFromRippled(info.amm))
			.then(amm => book.amm = amm)
			.catch(e => void e)
	)

	await Promise.all(promises)

	return book
}

async function loadMoreBookOffers({ book, limit=100, socket }){
	let offerCount = (book.requestedOfferCount || 0) + limit
	let result = await socket.request({
		command: 'book_offers',
		ledger_index: book.ledgerSequence,
		taker_gets: {
			currency: book.takerGets.currency,
			issuer: book.takerGets.issuer
		},
		taker_pays: {
			currency: book.takerPays.currency,
			issuer: book.takerPays.issuer
		},
		limit: offerCount
	})

	if(result.offers.length > book.offers.length){
		Object.assign(book, bookFromRippled(result))
		book.requestedOfferCount = offerCount
	}else{
		book.incomplete = false
	}
}

export function addOfferToBook({ book, offer, ownerFunds }){
	if(!offer.quality)
		offer.quality = div(offer.takerGets.value, offer.takerPays.value)

	for(let i=0; i<book.offers.length; i++){
		if(lt(book.offers[i].quality, offer.quality)){
			book.offers.splice(i, 0, offer)
			break
		}
	}

	if(!book.offers.includes(offer))
		book.offers.push(offer)

	book.ownerFunds[offer.account] = ownerFunds === undefined
		? (offer.takerGetsFunded?.value || offer.takerGets.value)
		: ownerFunds
}

export function cloneBook(book){
	return {
		...book,
		ownerFunds: {...book.ownerFunds},
		amm: book.amm ? {
			...book.amm,
			amount1: { ...book.amm.amount1 },
			amount2: { ...book.amm.amount2 },
		} : undefined,
		offers: book.offers.map(
			offer => ({
				...offer,
				takerGets: { ...offer.takerGets },
				takerPays: { ...offer.takerPays },
				takerGetsFunded: { ...offer.takerGetsFunded },
				takerPaysFunded: { ...offer.takerPaysFunded },
			})
		)
	}
}

export function getBookSpotQuality(book, includeFees){
	if(book.offers.length === 0 && !book.amm)
		return

	let quality = book.offers[0]?.quality
	
	if(book.amm){
		let ammAligned = alignAMM(book.amm, book.takerPays)
		let poolQuality = div(ammAligned.poolPays.value, ammAligned.poolGets.value)

		if(!quality || gt(poolQuality, quality))
			return poolQuality
	}

	if(includeFees){
		quality = div(quality, book.transferRateOut)
	}

	return quality
}

export function getBookSpotPrice(book){
	let quality = getBookSpotQuality(book)

	return quality ? div(1, quality) : undefined
}

export function getBookSignature(book){
	return [book.takerGets, book.takerPays]
		.map(token => token.currency === 'XRP' ? `XRP` : `${token.currency}:${token.issuer}`)
		.join('/')
}

export function filterExpiredBookOffers(offers, time){
	return offers.filter(offer => !offer.expiration || offer.expiration >= time)
}