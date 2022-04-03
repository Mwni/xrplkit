import { Application } from 'typedoc'

const doc = new Application()

doc.bootstrap({
    tsconfig: './tsconfig.json'
})

doc.convert()

