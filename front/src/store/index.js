

import { createStore } from "redux";
import { reducer } from "./reducers";

export const makeStore = () => createStore(reducer);

