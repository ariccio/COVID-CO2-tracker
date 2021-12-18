import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../../app/store';

interface bluetoothState {
    debugText: string;
    co2: number
}

const initialState: bluetoothState = {
    debugText: '',
    co2: -1
}

export const bluetoothSlice = createSlice({
    name: 'bluetooth',
    initialState,
    reducers: {
        setDebugText: (state, action: PayloadAction<string>) => {
            state.debugText = action.payload
        },
        setCO2: (state, action: PayloadAction<number>) => {
            state.co2 = action.payload
        }
    }
});

export const {setDebugText, setCO2} = bluetoothSlice.actions;

export const selectDebugText = (state: RootState) => state.bluetooth.debugText;
export const selectCO2 = (state: RootState) => state.bluetooth.co2;
export const bluetoothReducer = bluetoothSlice.reducer;