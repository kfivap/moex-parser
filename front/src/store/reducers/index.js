import { combineReducers } from "redux";



const initialState = {
    isin: []
}

export const mainReducer = (state = initialState, action) => {
    switch (action.type) {
        case 'setIsinList':
            return { ...state, isin: action.payload }
        default:
            return state

    }
}



const rootReducer = combineReducers({
    main: mainReducer,
})

export const reducer = (state, action) => {
    return rootReducer(state, action)
}
