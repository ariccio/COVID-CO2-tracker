import { combineReducers } from '@reduxjs/toolkit'
import counterReducer from '../features/counter/counterSlice';
import {loginReducer} from '../features/login/loginSlice';
import {creationReducer} from '../features/create/creationSlice';
import {placesReducer} from '../features/google/googleSlice';
import {manufacturerReducer} from '../features/manufacturers/manufacturerSlice';
import {devicemodelsReducer} from '../features/deviceModels/deviceModelsSlice';
import {placesInfoReducer} from '../features/places/placesSlice';

export const rootReducer = combineReducers({
    counter: counterReducer,
    login: loginReducer,
    creation: creationReducer,
    places: placesReducer,
    manufacturer: manufacturerReducer,
    devicemodels: devicemodelsReducer,
    placesInfo: placesInfoReducer
});

export type RootState = ReturnType<typeof rootReducer>;

// export default rootReducer