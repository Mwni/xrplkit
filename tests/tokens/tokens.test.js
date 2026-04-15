import { expect } from 'chai'
import { amountFromRippled, amountToRippled, tokenFromAmount, isSameToken } from '@xrplkit/tokens'

describe('amountFromRippled', () => {
	it('should return undefined for undefined', () => {
		expect(amountFromRippled(undefined)).to.equal(undefined)
	})

	it('should parse XRP drops string', () => {
		let result = amountFromRippled('10000000')
		expect(result.currency).to.equal('XRP')
		expect(result.value.toString()).to.equal('10')
	})

	it('should parse IOU object', () => {
		let result = amountFromRippled({ currency: 'USD', issuer: 'rXxx', value: '100' })
		expect(result.currency).to.equal('USD')
		expect(result.issuer).to.equal('rXxx')
		expect(result.value.toString()).to.equal('100')
	})

	it('should parse MPT object', () => {
		let result = amountFromRippled({ mpt_issuance_id: '0000ABC123', value: '500' })
		expect(result.mpt_issuance_id).to.equal('0000ABC123')
		expect(result.currency).to.equal(undefined)
		expect(result.issuer).to.equal(undefined)
		expect(result.value.toString()).to.equal('500')
	})
})

describe('amountToRippled', () => {
	it('should return undefined for undefined', () => {
		expect(amountToRippled(undefined)).to.equal(undefined)
	})

	it('should convert XRP to drops string', () => {
		expect(amountToRippled({ currency: 'XRP', value: '10' })).to.equal('10000000')
	})

	it('should convert IOU', () => {
		let result = amountToRippled({ currency: 'USD', issuer: 'rXxx', value: '100' })
		expect(result.value).to.equal('100')
		expect(result.issuer).to.equal('rXxx')
		expect(result.currency).to.equal('USD')
	})

	it('should convert MPT', () => {
		let result = amountToRippled({ mpt_issuance_id: '0000ABC123', value: '500' })
		expect(result.mpt_issuance_id).to.equal('0000ABC123')
		expect(result.value).to.equal('500')
		expect(result.currency).to.equal(undefined)
	})
})

describe('tokenFromAmount', () => {
	it('should return undefined for undefined', () => {
		expect(tokenFromAmount(undefined)).to.equal(undefined)
	})

	it('should extract IOU token', () => {
		let result = tokenFromAmount({ currency: 'USD', issuer: 'rXxx', value: '100' })
		expect(result.currency).to.equal('USD')
		expect(result.issuer).to.equal('rXxx')
		expect(result.mpt_issuance_id).to.equal(undefined)
	})

	it('should extract MPT token', () => {
		let result = tokenFromAmount({ mpt_issuance_id: '0000ABC123', value: '500' })
		expect(result.mpt_issuance_id).to.equal('0000ABC123')
		expect(result.currency).to.equal(undefined)
		expect(result.issuer).to.equal(undefined)
	})
})

describe('isSameToken', () => {
	it('should match two XRP strings', () => {
		expect(isSameToken('XRP', 'XRP')).to.equal(true)
	})

	it('should match same IOU', () => {
		expect(isSameToken(
			{ currency: 'USD', issuer: 'rXxx' },
			{ currency: 'USD', issuer: 'rXxx' }
		)).to.equal(true)
	})

	it('should not match different IOU issuer', () => {
		expect(isSameToken(
			{ currency: 'USD', issuer: 'rXxx' },
			{ currency: 'USD', issuer: 'rYyy' }
		)).to.equal(false)
	})

	it('should not match different IOU currency', () => {
		expect(isSameToken(
			{ currency: 'USD', issuer: 'rXxx' },
			{ currency: 'EUR', issuer: 'rXxx' }
		)).to.equal(false)
	})

	it('should match same MPT', () => {
		expect(isSameToken(
			{ mpt_issuance_id: '0000ABC123' },
			{ mpt_issuance_id: '0000ABC123' }
		)).to.equal(true)
	})

	it('should not match different MPT', () => {
		expect(isSameToken(
			{ mpt_issuance_id: '0000ABC123' },
			{ mpt_issuance_id: '0000DEF456' }
		)).to.equal(false)
	})

	it('should not match MPT vs IOU', () => {
		expect(isSameToken(
			{ mpt_issuance_id: '0000ABC123' },
			{ currency: 'USD', issuer: 'rXxx' }
		)).to.equal(false)
	})

	it('should not match MPT vs XRP', () => {
		expect(isSameToken(
			{ mpt_issuance_id: '0000ABC123' },
			'XRP'
		)).to.equal(false)
	})

	it('should not match IOU vs XRP', () => {
		expect(isSameToken(
			{ currency: 'USD', issuer: 'rXxx' },
			'XRP'
		)).to.equal(false)
	})
})
