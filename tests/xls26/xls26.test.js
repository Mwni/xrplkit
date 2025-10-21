import { assert } from 'chai'
import { parse } from '../../xls26/xls26.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const iouFixtures = JSON.parse(
    fs.readFileSync(__dirname + '/fixtures/ioumetadata.json', 'utf8')
)
const trustlistFixtures = JSON.parse(
    fs.readFileSync(__dirname + '/fixtures/trustlists.json', 'utf8')
)

describe('XLS-26 parse method - IOU tokens', () => {
    iouFixtures.forEach((test, index) => {
        const testName = test.name || `Test Case #${index + 1}`
        it(`${testName}`, () => {
            const expectedOutput = test.output
            const result = parse(test.input)

            assert.sameMembers(result.issues, expectedOutput.issues)
            assert.deepStrictEqual(result.issuers, expectedOutput.issuers)
            assert.deepStrictEqual(result.tokens, expectedOutput.tokens)
        })
    })
})

describe('XLS-26 parse method - trustlist', () => {
    trustlistFixtures.forEach((test, index) => {
        const testName = test.name || `Test Case #${index + 1}`
        it(`${testName}`, () => {
            const expectedOutput = test.output
            const result = parse(test.input)

            assert.sameMembers(result.issues, expectedOutput.issues)
            assert.deepStrictEqual(result.issuers, expectedOutput.issuers)
            assert.deepStrictEqual(result.tokens, expectedOutput.tokens)
        })
    })
})
