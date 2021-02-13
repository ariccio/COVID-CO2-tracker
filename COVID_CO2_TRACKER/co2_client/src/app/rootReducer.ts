import { combineReducers } from '@reduxjs/toolkit'
import counterReducer from '../features/counter/counterSlice';
import {loginReducer} from '../features/login/loginSlice';


export const rootReducer = combineReducers({
    counter: counterReducer,
    login: loginReducer
});

export type RootState = ReturnType<typeof rootReducer>;

// export default rootReducer