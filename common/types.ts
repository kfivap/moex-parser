import type { match_derivative_open_positions, derivative_open_positions, derivative, derivative_prices } from '../back/node_modules/@prisma/client'

export type ApiIsin = derivative_open_positions & { derivative: derivative }
export type ApiIsinListResponse = ApiIsin[]

export type ApiDerivative = derivative_open_positions & { derivative: derivative }
export type ApiMatchDerivative = match_derivative_open_positions
export type ApiDerivativePrices = derivative_prices

export type ApiDerivativesDayData = {
    fiz: ApiDerivative
    legal: ApiDerivative
    match: ApiMatchDerivative
    price: ApiDerivativePrices
}

export type ApiDerivativesResponse = {
    [date: string]: ApiDerivativesDayData
}

