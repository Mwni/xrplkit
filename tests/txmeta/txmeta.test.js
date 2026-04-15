import { expect } from 'chai'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { extractExchanges } from '@xrplkit/txmeta'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const fixtureDir = path.join(__dirname, 'fixtures')

const fixtures = fs.readdirSync(fixtureDir)
	.filter(f => f.endsWith('.json'))
	.map(f => JSON.parse(fs.readFileSync(path.join(fixtureDir, f), 'utf-8')))


describe('extractExchanges', () => {
	for (let { description, tx, expected } of fixtures) {
		it(description, () => {
			let exchanges = extractExchanges(tx)

			expect(exchanges).to.have.length(expected.length)

			for (let i = 0; i < expected.length; i++) {
				expect(exchanges[i]).to.deep.equal(expected[i])
			}
		})
	}
})
