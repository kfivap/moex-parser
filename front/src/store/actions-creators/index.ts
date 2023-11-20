import { ApiIsinListResponse, ApiIsin } from "../../../../common/types"
import { CurrentIsinDerivativeDataType } from "../reducers"

export const setIsinList = (payload: ApiIsinListResponse) => {
    return { type: 'setIsinList', payload }
}

export const setCurrentIsin = (payload: ApiIsin) => {
    return { type: 'setCurrentIsin', payload }
}
export const setCurrentIsinDerivativeData = (payload: CurrentIsinDerivativeDataType) => {
    return { type: 'setCurrentIsinDerivativeData', payload }
}

export const setQueryLimit = (payload: number) => {
    return { type: 'setQueryLimit', payload }
}