// See updated (more restrictive) licensing restrictions for this subproject! Updated 02/03/2022.
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { RootState } from './rootReducer';

interface Globals {
    jwt: string | null;
    successfulUploads: number;
    batteryOptimizationEnabled: boolean | null;
    backgroundPolling: boolean;
}

const initialState: Globals = {
    jwt: null,
    successfulUploads: 0,
    batteryOptimizationEnabled: null,
    backgroundPolling: false
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
        setBatteryOptimizationEnabled: (state, action: PayloadAction<boolean | null>) => {
            state.batteryOptimizationEnabled = action.payload;
        },
        setBackgroundPollingEnabled: (state, action: PayloadAction<boolean>) => {
            state.backgroundPolling = action.payload;
        }
    }
});

export const {setJWT, incrementSuccessfulUploads, setBatteryOptimizationEnabled, setBackgroundPollingEnabled} = globalSlice.actions;

export const selectJWT = (state: RootState) => state.globals.jwt;
export const selectSuccessfulUploads = (state: RootState) => state.globals.successfulUploads;
export const selectBatteryOptimizationEnabled = (state: RootState) => state.globals.batteryOptimizationEnabled;
export const selectBackgroundPollingEnabled = (state: RootState) => state.globals.backgroundPolling;

export const globalsReducer = globalSlice.reducer;