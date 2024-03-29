// See updated (more restrictive) licensing restrictions for this subproject! Updated 02/03/2022.
import { combineReducers } from '@reduxjs/toolkit';

// import { measurementReducer } from '../features/Measurement/MeasurementSlice';
import { authReducer } from '../features/Auth/authSlice';
import { measurementReducer } from '../features/Measurement/measurementSlice';
import { uploadReducer } from '../features/Uploading/uploadSlice';
import { bluetoothReducer } from '../features/bluetooth/bluetoothSlice';
import { serviceReducer } from '../features/service/serviceSlice';
import { userDevicesReducer } from '../features/userInfo/devicesSlice';
import {userInfoReducer} from '../features/userInfo/userInfoSlice';
import { globalsReducer } from './globalSlice';

export const rootReducer = combineReducers({
    bluetooth: bluetoothReducer,
    userDevices: userDevicesReducer,
    userInfo: userInfoReducer,
    globals: globalsReducer,
    measurements: measurementReducer,
    upload: uploadReducer,
    service: serviceReducer,
    auth: authReducer
});

export type RootState = ReturnType<typeof rootReducer>;


