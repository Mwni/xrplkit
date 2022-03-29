import { Application } from 'typedoc'

const doc = new Application()

doc.bootstrap({
    tsconfig: './xtsconfig.json'
})

doc.convert()

