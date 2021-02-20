import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../../app/store';

interface creationState {
    enteredManufacturerText: string;
    manufacturerFeedbackText: string;
}

const initialState: creationState = {
    enteredManufacturerText: '',
    manufacturerFeedbackText: ''
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
        }
    }
})

export const {setEnteredManufacturerText, setManufacturerFeedbackText} = creationSlice.actions;

export const selectEnteredManufacturerText = (state: RootState) => state.creation.enteredManufacturerText;
export const selectManufacturerFeedbackText = (state: RootState) => state.creation.manufacturerFeedbackText;

export const creationReducer = creationSlice.reducer;