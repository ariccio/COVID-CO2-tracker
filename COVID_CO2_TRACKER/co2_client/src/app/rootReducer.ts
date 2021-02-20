import { combineReducers } from '@reduxjs/toolkit'
import counterReducer from '../features/counter/counterSlice';
import {loginReducer} from '../features/login/loginSlice';
import {creationReducer} from '../features/create/creationSlice';

export const rootReducer = combineReducers({
    counter: counterReducer,
    login: loginReducer,
    creation: creationReducer
});

export type RootState = ReturnType<typeof rootReducer>;

// export default rootReducer