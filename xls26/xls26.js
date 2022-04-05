import { parse as parseToml } from '@xrplworks/toml'
import { decode as decodeCurrency } from '@xrplworks/currency'


const accountFields = [
	{
		key: 'address',
		validate: v => /^[rpshnaf39wBUDNEGHJKLM4PQRST7VWXYZ2bcdeCg65jkm8oFqi1tuvAxyz]{25,35}$/.test(v)
	},
	{
		key: 'name',
		validate: v => typeof v === 'string' && v.length > 0
	},
	{
		key: 'description',
		alternativeKeys: ['desc'],
		validate: v => typeof v === 'string' && v.length > 0
	},
	{
		key: 'icon',
		validate: v => /^https?:\/\/.*$/.test(v)
	},
	{
		key: 'links',
		type: 'array',
		validate: v => Array.isArray(v) && v.every(v => typeof v === 'string'),
	},
	{
		key: 'trusted',
		validate: v => typeof v === 'boolean'
	}
]


const currencyFields = [
	{
		key: 'code',
		validate: v => /^[0-9A-F]{40}$/
	},
	{
		key: 'issuer',
		validate: v => /^[rpshnaf39wBUDNEGHJKLM4PQRST7VWXYZ2bcdeCg65jkm8oFqi1tuvAxyz]{25,35}$/.test(v)
	},
	{
		key: 'name',
		validate: v => typeof v === 'string' && v.length > 0
	},
	{
		key: 'description',
		alternativeKeys: ['desc'],
		validate: v => typeof v === 'string' && v.length > 0
	},
	{
		key: 'icon',
		validate: v => /^https?:\/\/.*$/.test(v)
	},
	{
		key: 'links',
		type: 'array',
		validate: v => Array.isArray(v) && v.every(v => typeof v === 'string'),
	},
	{
		key: 'trusted',
		validate: v => typeof v === 'boolean'
	}
]


export function parse(str){
	let toml = parseToml(str, 'camelCase')
	let accounts = []
	let currencies = []

	if(toml.accounts){
		accounts = toml.accounts
			.map(account => parseStanza(account, accountFields))
	}

	if(toml.currencies){
		currencies = toml.currencies
			.map(currency => parseStanza(currency, currencyFields))
	}

	return {
		accounts,
		currencies
	}
}

function parseStanza(stanza, schemas){
	let parsed = {}

	for(let { key, alternativeKeys, validate } of schemas){
		let keys = [key]

		if(alternativeKeys)
			keys.push(...alternativeKeys)

		for(let k of keys){
			if(!stanza.hasOwnProperty(k))
				continue

			let value = stanza[k]

			if(validate && !validate(value))
				continue

			parsed[k] = value
			break
		}
	}

	return parsed
}