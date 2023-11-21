export const parseFloatOrReturnZero = (strNum): number => parseFloat(strNum) || 0

export const CSV_DOCUMENT_DATE_FORMAT = 'YYYYMMDD'

export function safeParsePercent(a: number, b: number): number {
    const result = ((a || 0) / (b || 0))
    if (!result) {
        return 0
    }
    if (result == Number.POSITIVE_INFINITY) {
        return 999999999
    } else if (result == Number.NEGATIVE_INFINITY) {
        return -999999999
    }
    return result
}
