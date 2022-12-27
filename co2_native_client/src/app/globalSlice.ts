// See updated (more restrictive) licensing restrictions for this subproject! Updated 02/03/2022.
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
// import { AuthState } from '../features/Auth/Auth';

import { RootState } from './rootReducer';

interface Globals {
    jwt: string | null;
    successfulUploads: number;
    failedUploads: number;
    batteryOptimizationEnabled: boolean | null;
    backgroundPolling: boolean;
    shouldUpload: boolean;
    nextMeasurementTime: number | null;
    userDeviceErrors: string | null;
}

const initialState: Globals = {
    jwt: null,
    successfulUploads: 0,
    failedUploads: 0,
    batteryOptimizationEnabled: null,
    backgroundPolling: false,
    shouldUpload: false,
    nextMeasurementTime: null,
    userDeviceErrors: null,
};

export const globalSlice = createSlice({
    name: 'globals',
    initialState,
    reducers: {
        setJWT: (state, action: PayloadAction<string | null>) => {
            state.jwt = action.payload;
        },
        incrementSuccessfulUploads: (state, action: PayloadAction<void>) => {
            // debugger;
            state.successfulUploads += 1;
        },
        incrementFailedUploads: (state, action: PayloadAction<void>) => {
            state.failedUploads += 1;
        },
        setBatteryOptimizationEnabled: (state, action: PayloadAction<boolean | null>) => {
            state.batteryOptimizationEnabled = action.payload;
        },
        setBackgroundPollingEnabled: (state, action: PayloadAction<boolean>) => {
            state.backgroundPolling = action.payload;
        },
        setShouldUpload: (state, action: PayloadAction<boolean>) => {
            state.shouldUpload = action.payload;
        },
        setNextMeasurementTime: (state, action: PayloadAction<number | null>) => {
            state.nextMeasurementTime = action.payload;
        },
        setUserDeviceErrors: (state, action: PayloadAction<string | null>) => {
            state.userDeviceErrors = action.payload;
        },
    }
});

export const {setJWT, incrementSuccessfulUploads, setBatteryOptimizationEnabled, setBackgroundPollingEnabled, setShouldUpload, setNextMeasurementTime, setUserDeviceErrors, incrementFailedUploads} = globalSlice.actions;

export const selectJWT = (state: RootState) => state.globals.jwt;
export const selectSuccessfulUploads = (state: RootState) => state.globals.successfulUploads;
export const selectBatteryOptimizationEnabled = (state: RootState) => state.globals.batteryOptimizationEnabled;
export const selectBackgroundPollingEnabled = (state: RootState) => state.globals.backgroundPolling;
export const selectShouldUpload = (state: RootState) => state.globals.shouldUpload;
export const selectNextMeasurementTime = (state: RootState) => state.globals.nextMeasurementTime;
export const selectFailedUploads = (state: RootState) => state.globals.failedUploads;
export const selectUserDeviceErrors = (state: RootState) => state.globals.userDeviceErrors;


export const globalsReducer = globalSlice.reducer;


