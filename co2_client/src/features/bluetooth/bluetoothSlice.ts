import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../../app/store';

interface bluetoothState {
    debugText: string;
}

const initialState: bluetoothState = {
    debugText: ''
}

export const bluetoothSlice = createSlice({
    name: 'bluetooth',
    initialState,
    reducers: {
        setDebugText: (state, action: PayloadAction<string>) => {
            state.debugText = action.payload
        }
    }
});

export const {setDebugText} = bluetoothSlice.actions;

export const selectDebugText = (state: RootState) => state.bluetooth.debugText;

export const bluetoothReducer = bluetoothSlice.reducer;