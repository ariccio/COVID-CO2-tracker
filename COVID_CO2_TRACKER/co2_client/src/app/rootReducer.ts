import { combineReducers } from '@reduxjs/toolkit'
import counterReducer from '../features/counter/counterSlice';
import {loginReducer} from '../features/login/loginSlice';
import {creationReducer} from '../features/create/creationSlice';
import {placesReducer} from '../features/google/googleSlice';
import {manufacturerReducer} from '../features/manufacturers/manufacturerSlice';

export const rootReducer = combineReducers({
    counter: counterReducer,
    login: loginReducer,
    creation: creationReducer,
    places: placesReducer,
    manufacturer: manufacturerReducer
});

export type RootState = ReturnType<typeof rootReducer>;

// export default rootReducer