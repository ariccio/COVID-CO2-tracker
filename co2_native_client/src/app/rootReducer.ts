import { combineReducers } from '@reduxjs/toolkit'
import { bluetoothReducer } from '../features/bluetooth/bluetoothSlice';
import { userDevicesReducer } from '../features/userInfo/devicesSlice';


export const rootReducer = combineReducers({
    bluetooth: bluetoothReducer,
    userDevices: userDevicesReducer
})

export type RootState = ReturnType<typeof rootReducer>;


