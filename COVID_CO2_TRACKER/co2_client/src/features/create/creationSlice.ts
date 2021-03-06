import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../../app/store';

interface creationState {
    enteredManufacturerText: string;
    manufacturerFeedbackText: string;
    enteredModelText: string;
    enteredDeviceSerialNumberText: string;
}

const initialState: creationState = {
    enteredManufacturerText: '',
    manufacturerFeedbackText: '',
    enteredModelText: '',
    enteredDeviceSerialNumberText: ''
}


export const creationSlice = createSlice({
    name: 'creation',
    initialState,
    reducers: {
        setEnteredManufacturerText: (state, action: PayloadAction<string>) => {
            state.enteredManufacturerText = action.payload;
        },
        setManufacturerFeedbackText: (state, action: PayloadAction<string>) => {
            state.manufacturerFeedbackText = action.payload;
        },
        setEnteredModelText: (state, action: PayloadAction<string>) => {
            state.enteredModelText = action.payload;
        },
        setEnteredDeviceSerialNumberText: (state, action: PayloadAction<string>) => {
            state.enteredDeviceSerialNumberText = action.payload;
        }

    }
})

export const {setEnteredManufacturerText, setManufacturerFeedbackText, setEnteredModelText, setEnteredDeviceSerialNumberText} = creationSlice.actions;

export const selectEnteredManufacturerText = (state: RootState) => state.creation.enteredManufacturerText;
export const selectManufacturerFeedbackText = (state: RootState) => state.creation.manufacturerFeedbackText;
export const selectEnteredModelText = (state: RootState) => state.creation.enteredModelText;
export const selectEnteredDeviceSerialNumberText = (state: RootState) => state.creation.enteredDeviceSerialNumberText;

export const creationReducer = creationSlice.reducer;
