import type { match_derivative_open_positions, derivative_open_positions, derivative } from '../back/node_modules/@prisma/client'

export type ApiIsin = derivative_open_positions & { derivative: derivative }
export type ApiIsinListResponse = ApiIsin[]

export type ApiDerivative = derivative_open_positions & { derivative: derivative }
export type ApiMatchDerivative = match_derivative_open_positions
export type ApiDerivativesResponse = {
    fizDerivatives: ApiDerivative[],
    legalDerivatives: ApiDerivative[],
    matchData: ApiMatchDerivative[]
}

