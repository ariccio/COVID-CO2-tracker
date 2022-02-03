// See updated (more restrictive) licensing restrictions for this subproject! Updated 02/03/2022.
import { combineReducers } from '@reduxjs/toolkit'

import { bluetoothReducer } from '../features/bluetooth/bluetoothSlice';
import { userDevicesReducer } from '../features/userInfo/devicesSlice';
import {userInfoReducer} from '../features/userInfo/userInfoSlice';
import { globalsReducer } from './globalSlice';

export const rootReducer = combineReducers({
    bluetooth: bluetoothReducer,
    userDevices: userDevicesReducer,
    userInfo: userInfoReducer,
    globals: globalsReducer
})

export type RootState = ReturnType<typeof rootReducer>;


