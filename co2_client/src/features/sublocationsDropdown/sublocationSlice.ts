import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../../app/store';

export interface SubLocationSelectionState {
    selectedLocationID: number
}

const initialState: SubLocationSelectionState = {
    selectedLocationID: -1
}

export const sublocationSlice = createSlice({
    name: 'sublocation',
    initialState,
    reducers: {
        setSublocationSelectedLocationID: (state, action: PayloadAction<number>) => {
            state.selectedLocationID = action.payload;
        }
    }
})

export const {setSublocationSelectedLocationID} = sublocationSlice.actions;
export const selectSublocationSelectedLocationID = (state: RootState) => state.sublocation.selectedLocationID;
export const sublocationReducer = sublocationSlice.reducer;