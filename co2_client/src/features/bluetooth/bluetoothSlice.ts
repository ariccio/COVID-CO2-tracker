import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../../app/store';

interface bluetoothState {
    debugText: string;
    co2: number | null;
    bluetoothAvailableError: string | null;
    bluetoothAvailable: boolean | null;
}

const initialState: bluetoothState = {
    debugText: '',
    co2: null,
    bluetoothAvailableError: null,
    bluetoothAvailable: null
}

export const bluetoothSlice = createSlice({
    name: 'bluetooth',
    initialState,
    reducers: {
        setDebugText: (state, action: PayloadAction<string>) => {
            state.debugText = action.payload;
        },
        setCO2: (state, action: PayloadAction<number>) => {
            state.co2 = action.payload;
        },
        setBluetoothAvailableError: (state, action: PayloadAction<string | null>) => {
            state.bluetoothAvailableError = action.payload;
        },
        setBluetoothAvailable: (state, action: PayloadAction<boolean | null>) => {
            state.bluetoothAvailable = action.payload;
        }
    }
});

export const {setDebugText, setCO2, setBluetoothAvailableError, setBluetoothAvailable} = bluetoothSlice.actions;

export const selectDebugText = (state: RootState) => state.bluetooth.debugText;
export const selectCO2 = (state: RootState) => state.bluetooth.co2;
export const selectBluetoothAvailableError = (state: RootState) => state.bluetooth.bluetoothAvailableError;
export const selectBluetoothAvailable = (state: RootState) => state.bluetooth.bluetoothAvailable;

export const bluetoothReducer = bluetoothSlice.reducer;
