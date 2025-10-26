import { assert } from 'chai'
import { parse } from '@xrplkit/xls89'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const fixtures = JSON.parse(
    fs.readFileSync(__dirname + '/fixtures/mptmetadata.json', 'utf8')
)

describe('XLS-89 parse method', () => {
    fixtures.forEach((test, index) => {
        const testName = test.name || `Test Case #${index + 1}`
        it(`${testName}`, () => {
            const expectedOutput = test.output
            const result = parse(test.MPTokenMetadata)
            
            assert.sameMembers(result.issues, expectedOutput.issues)
            assert.deepStrictEqual(result.token, expectedOutput.token)
        })
    })
})
