import { combineReducers } from '@reduxjs/toolkit'
import { bluetoothReducer } from '../features/bluetooth/bluetoothSlice';
import { userDevicesReducer } from '../features/userInfo/devicesSlice';
import {userInfoReducer} from '../features/userInfo/userInfoSlice';

export const rootReducer = combineReducers({
    bluetooth: bluetoothReducer,
    userDevices: userDevicesReducer,
    userInfo: userInfoReducer
})

export type RootState = ReturnType<typeof rootReducer>;


