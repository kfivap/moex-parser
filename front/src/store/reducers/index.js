import { combineReducers } from "redux";



const initialState = {
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

export const reducer = (state, action) => {
    return rootReducer(state, action)
}
