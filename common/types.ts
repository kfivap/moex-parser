import type { match_derivative, derivative } from '../back/node_modules/@prisma/client'

export type ApiIsin = {
    isin: string,
    name: string,
    "_sum": {
        "short_position": number,
        "long_position": number
    }
}
export type ApiIsinListResponse = ApiIsin[]

export type ApiDerivative = derivative
export type ApiMatchDerivative = match_derivative
export type ApiDerivativesResponse = {
    fizDerivatives: ApiDerivative[],
    legalDerivatives: ApiDerivative[],
    matchData: ApiMatchDerivative[]
}

