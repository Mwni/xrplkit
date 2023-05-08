// The XLS-26 standard adds additional asset metadata fields to the existing xrp-ledger.toml standard,
// https://github.com/XRPLF/XRPL-Standards/discussions/71
// This package provides an implementation for a parser according to this standard.


import { parse as parseToml } from '@xrplkit/toml'

const validWeblinkTypes = [
	'info',
	'socialmedia',
	'community',
	'support',
	'whitepaper',
	'certificate'
]

const validAdvisoryTypes = [
	'scam',
	'spam',
	'illegal',
	'offensive',
	'hijacked'
]

const validAssetClasses = [
	'fiat',
	'commodity',
	'equity',
	'cryptocurrency'
]

const issuerFields = [
	{
		key: 'address',
		essential: true,
		validate: v => {
			if(!/^[rpshnaf39wBUDNEGHJKLM4PQRST7VWXYZ2bcdeCg65jkm8oFqi1tuvAxyz]{25,35}$/.test(v))
				throw 'is not a valid XRPL address'
		},
	},
	{
		key: 'name',
		validate: v => {
			if(typeof v !== 'string' || v.length === 0)
				throw 'has to be a non empty string'
		}
	},
	{
		key: 'description',
		alternativeKeys: ['desc'],
		validate: v => {
			if(typeof v !== 'string' || v.length === 0)
				throw 'has to be a non empty string'
		}
	},
	{
		key: 'domain',
		validate: v => {
			if(typeof v !== 'string' || v.length === 0)
				throw 'has to be a non empty string'
		}
	},
	{
		key: 'icon',
		alternativeKeys: ['avatar'],
		validate: v => {
			if(!/^https?:\/\/.*$/.test(v))
				throw 'has to be a valid HTTP URL that starts with "http"'
		}
	},
	{
		key: 'trust_level',
		validate: v => {
			if(v !== parseInt(v))
				throw 'has to be a integer'

			if(v < 0 || v > 3)
				throw 'has to be between 0 and 3'
		}
	}
]

const tokenFields = [
	{
		key: 'currency',
		essential: true,
		validate: v => {
			if(typeof v !== 'string' && v.length < 3)
				throw 'is not a valid XRPL currency code'
		}
	},
	{
		key: 'issuer',
		essential: true,
		validate: v => {
			if(!/^[rpshnaf39wBUDNEGHJKLM4PQRST7VWXYZ2bcdeCg65jkm8oFqi1tuvAxyz]{25,35}$/.test(v))
				throw 'is not a valid XRPL address'
		}
	},
	{
		key: 'name',
		validate: v => {
			if(typeof v !== 'string' || v.length === 0)
				throw 'has to be a non empty string'
		}
	},
	{
		key: 'description',
		alternativeKeys: ['desc'],
		validate: v => {
			if(typeof v !== 'string' || v.length === 0)
				throw 'has to be a non empty string'
		}
	},
	{
		key: 'icon',
		alternativeKeys: ['avatar'],
		validate: v => {
			if(!/^https?:\/\/.*$/.test(v))
				throw 'has to be a valid HTTP URL that starts with "http"'
		}
	},
	{
		key: 'trust_level',
		validate: v => {
			if(v !== parseInt(v))
				throw 'has to be a integer'

			if(v < 0 || v > 3)
				throw 'has to be between 0 and 3'
		}
	},
	{
		key: 'asset_class',
		validate: v => {
			if(!validAssetClasses.includes(v))
				throw `needs to be one of the following: ${validAssetClasses.join(', ')}`
		}
	}
]

const weblinkFields = [
	{
		key: 'url',
		essential: true,
		validate: v => {
			if(!/^https?:\/\/.*$/.test(v))
				throw 'has to be a valid HTTP URL that starts with "http"'
		}
	},
	{
		key: 'type',
		validate: v => {
			if(!validWeblinkTypes.includes(v))
				throw `has to be one of (${validWeblinkTypes.join(', ')})`
		}
	},
	{
		key: 'title',
		validate: v => {
			if(typeof v !== 'string' || v.length === 0)
				throw 'has to be a non empty string'
		}
	},
]

const advisoryFields = [
	{
		key: 'address',
		essential: true,
		validate: v => {
			if(!/^[rpshnaf39wBUDNEGHJKLM4PQRST7VWXYZ2bcdeCg65jkm8oFqi1tuvAxyz]{25,35}$/.test(v))
				throw 'is not a valid XRPL address'
		},
	},
	{
		key: 'type',
		validate: v => {
			if(!validAdvisoryTypes.includes(v))
				throw `has to be one of (${validAdvisoryTypes.join(', ')})`
		}
	},
	{
		key: 'description',
		alternativeKeys: ['desc'],
		validate: v => {
			if(typeof v !== 'string' || v.length === 0)
				throw 'has to be a non empty string'
		}
	}
]

export function parse(str){
	try{
		var toml = parseToml(str)
	}catch(error){
		throw new Error(`Failed to parse .toml: Syntax error at line ${error.line}:${error.column}`)
	}

	let issuers = []
	let tokens = []
	let issues = []
	let advisories = []


	if(toml.ISSUERS){
		for(let stanza of toml.ISSUERS){
			let { valid, parsed: issuer, issues: issuerIssues } = parseStanza(stanza, issuerFields)

			if(valid)
				issuers.push(issuer)

			issues.push(
				...issuerIssues.map(
					issue => `[[ISSUERS]] ${issue}`
				)
			)

			if(valid && stanza.WEBLINKS){
				for(let substanza of stanza.WEBLINKS){
					let { valid, parsed: weblink, issues: weblinkIssues } = parseStanza(substanza, weblinkFields)

					if(valid){
						issuer.weblinks = [
							...(issuer.weblinks || []),
							weblink
						]
					}

					issues.push(
						...weblinkIssues.map(
							issue => `[[WEBLINK]] ${issue}`
						)
					)
				}
			}
		}
	}

	if(toml.TOKENS){
		for(let stanza of toml.TOKENS){
			let { valid, parsed: token, issues: tokenIssues } = parseStanza(stanza, tokenFields)

			if(valid)
				tokens.push(token)
				
			issues.push(
				...tokenIssues.map(
					issue => `[[TOKENS]] ${issue}`
				)
			)

			if(valid && stanza.WEBLINKS){
				for(let substanza of stanza.WEBLINKS){
					let { valid, parsed: weblink, issues: weblinkIssues } = parseStanza(substanza, weblinkFields)

					if(valid){
						token.weblinks = [
							...(token.weblinks || []),
							weblink
						]
					}

					issues.push(
						...weblinkIssues.map(
							issue => `[[WEBLINK]] ${issue}`
						)
					)
				}
			}
		}
	}

	if(toml.ADVISORIES){
		for(let stanza of toml.ADVISORIES){
			let { valid, parsed: advisory, issues: advisoryIssues } = parseStanza(stanza, advisoryFields)

			if(valid)
				advisories.push(advisory)
				
			issues.push(
				...advisoryIssues.map(
					issue => `[[ADVISORIES]] ${issue}`
				)
			)
		}
	}


	return {
		issuers,
		tokens,
		issues,
		advisories
	}
}

function parseStanza(stanza, schemas){
	let parsed: Record<string, any> = {}
	let issues = []
	let valid = true

	for(let { key, alternativeKeys, essential, validate } of schemas){
		let keys = [key]

		if(alternativeKeys)
			keys.push(...alternativeKeys)

		for(let k of keys){
			if(stanza[k] === undefined)
				continue

			let value = stanza[k]

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

		if(essential && parsed[key] === undefined){
			issues.push(`${key} field missing: skipping stanza`)
			valid = false
		}
	}

	return { valid, parsed, issues }
}