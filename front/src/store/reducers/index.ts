import { combineReducers } from "redux";

import { ApiIsinListResponse, ApiIsin, ApiDerivative, ApiMatchDerivative } from "../../../../common/types"

export type CurrentIsinDerivativeDataType = {
    fiz: ApiDerivative,
    legal: ApiDerivative,
    match: ApiMatchDerivative
}

export type InitialStateType = {
    isinList: ApiIsinListResponse,
    currentIsin: ApiIsin,
    currentIsinDerivativeData: CurrentIsinDerivativeDataType,
    queryLimit: number,
    a?: number
}
export type RootState = {
    main: InitialStateType
}

const initialState: InitialStateType = {
    isinList: [],
    currentIsin: null,
    currentIsinDerivativeData: null,
    queryLimit: 120,
}

export const mainReducer = (state = initialState, action) => {
    switch (action.type) {
        case 'setIsinList':
            return { ...state, isinList: action.payload }
        case 'setCurrentIsin':
            return { ...state, currentIsin: action.payload }
        case 'setCurrentIsinDerivativeData':
            return { ...state, currentIsinDerivativeData: action.payload }
        case 'setQueryLimit':
            return { ...state, queryLimit: action.payload }
        default:
            console.log('warning!!! default reducer')
            return state

    }
}



const rootReducer = combineReducers({
    main: mainReducer,
})
// export type RootState = ReturnType<typeof rootReducer>

export const reducer = (state, action) => {
    return rootReducer(state, action)
}
