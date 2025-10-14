const validUriRegex = /^(https?)|(ipfs):\/\/.*$/

const validAssetClasses = [
	'rwa',
	'memes',
	'wrapped',
	'gaming',
	'defi',
	'other'
]

const validAssetSubClasses = [
	'stablecoin',
	'commodity',
	'real_estate',
	'private_credit',
	'equity',
	'treasury',
	'other'
]

const validUriCategories = [
	'website',
	'social',
    'docs',
	'other',
]

const tokenFields = [
    {
        key: 'ticker',
        alternateKeys: ['t'],
        required: true,
        validate: v => {
            if (!/^[A-Z0-9]{1,6}$/.test(v))
                throw 'ticker should have uppercase letters (A-Z) and digits (0-9) only. Max 6 characters recommended.'
        }

    },
    {
        key: 'name',
        alternateKeys: ['n'],
        required: true,
        validate: v => {
			if(typeof v !== 'string' || v.length === 0)
				throw 'must be a non empty string'
		}

    },
    {
        key: 'desc',
        alternateKeys: ['d'],
        validate: v => {
			if(typeof v !== 'string' || v.length === 0)
				throw 'must be a non empty string'
		}

    },
    {
        key: 'icon',
        alternateKeys: ['i'],
        required: true,
        validate: v => {
			if(typeof v !== 'string' || v.length === 0)
				throw 'must be a non empty string'

            if ((v.startsWith('http') || v.startsWith('ipfs')) && !validUriRegex.test(v))
                throw 'must be a valid URI that starts with "http" or "ipfs"'
		}

    },
    ,
    {
        key: 'issuer_name',
        alternateKeys: ['in'],
        required: true,
        validate: v => {
			if(typeof v !== 'string' || v.length === 0)
				throw 'must be a non empty string'
		}

    },
    {
        key: 'asset_class',
        alternateKeys: ['ac'],
        required: true,
        validate: v => {
			if(!validAssetClasses.includes(v))
				throw `must be one of: ${validAssetClasses.join(', ')}`
		}

    },
    {
        key: 'asset_subclass',
        alternateKeys: ['as'],
        validate: v => {
			if(!validAssetSubClasses.includes(v))
				throw `must be one of: ${validAssetSubClasses.join(', ')}`
		}

    },
    {
        key: 'uris',
        alternateKeys: ['us'],
        validate: v => {
			if(!Array.isArray(v) || v.length === 0)
				throw `must be non empty array`
		}

    },
    {
        key: 'additional_info',
        alternateKeys: ['ai'],
        validate: v => {
			if(Array.isArray(v) || typeof v !== 'object')
				throw `must be JSON object`
		}

    }
]

const uriFields = [
	{
		key: 'uri',
        alternateKeys: ['u'],
		required: true,
		validate: v => {
			if(typeof v !== 'string' || v.length === 0)
				throw 'must be a non empty string'

            if ((v.startsWith('http') || v.startsWith('ipfs')) && !validUriRegex.test(v))
                throw 'must be a valid URI that starts with "http" or "ipfs"'
		}
	},
	{
		key: 'category',
        alternateKeys: ['c'],
        required: true,
		validate: v => {
			if(!validUriCategories.includes(v))
				throw `must be one of: ${Array.from(new Set(Object.values(validUriCategories))).join(', ')}`
		}		
	},
	{
		key: 'title',
        alternateKeys: ['t'],
        required: true,
		validate: v => {
			if(typeof v !== 'string' || v.length === 0)
				throw 'must be a non empty string'
		}
	},
]

export function parse(str) {
    let jsonInput = {}
    let issues = []

    try {
        jsonInput = JSON.parse(hexToUTF8(str))
    } catch(err) {
        throw new Error(`Failed to parse ${str}`)
    }

    let {valid: validToken, parsed: parsedToken, issues: tokenIssues} = parseObject(jsonInput, tokenFields)

    issues.push(
        ...tokenIssues.map(
            issue => `Token - ${issue}`
        )
	)
    if (!validToken) {
        return {token: {}, issues}
    }

    let validUris = []
    for (let uri of parsedToken['uris']) {
        let {valid, parsed: parsedUri, issues: uriIssues} = parseObject(uri, uriFields)

        issues.push(
            ...uriIssues.map(
                issue => `Uri - ${issue}`
            )
        )
        
        if (valid)
            validUris.push(parsedUri)
    }
    
    parsedToken['uris'] = validUris
    return {
		token: parsedToken,
		issues		
	}
}

function hexToUTF8(hex) {
    return Buffer.from(hex, 'hex').toString('utf8');
}

function parseObject(input, schemas) {
    let parsed = {}
	let issues = []
	let valid = true

    for (let { key, alternativeKeys, required, validate } of schemas) {
        let keys = [key, ...alternativeKeys]
        
        for (let k of keys) {
            if (input[k] == null)
                continue

            let value = input[k]
            if(validate){
				try{
					validate(value)
				}catch(issue){
					issues.push(`${k} field: ${issue}`)
					break
				}
			}

            parsed[key] = value
			break
        }

        if(required && parsed[key] === undefined){
			issues.push(`${key} field missing: skipping object`)
			valid = false
		}
    }

    return { valid, parsed, issues }
}