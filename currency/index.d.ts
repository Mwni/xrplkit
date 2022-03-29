interface Currency{
    currency: String
    issuer?: String
}


/**
 * Encodes any currency code string into the native XRPL 160-bit hexadecimal representation.
 * Ignores already encoded or ISO standard currency codes.
 * ```
 * 'SOLO' -> '534F4C4F00000000000000000000000000000000'
 * ```
 * @param code UTF-8 currency code
 * @returns HEX currency code
 */
declare function encode(code: String): String

/**
 * Decodes the native XRPL 160-bit hexadecimal representation into a UTF-8 string.
 * Ignores non HEX codes.
 * ```
 * '534F4C4F00000000000000000000000000000000' -> 'SOLO'
 * ```
 * @param code HEX currency code
 * @returns UTF-8 currency code
 */
declare function decode(code: String): String

/**
 * Checks if two currencies are the same. Tolerant to different encodings.
 * @returns `true` if they are the same, `false` if not
 */
declare function compare(currencyA: Currency, currencyB: Currency): Boolean