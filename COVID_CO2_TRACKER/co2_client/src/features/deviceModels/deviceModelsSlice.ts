import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../../app/store';


interface deviceModelsState {
    selectedModel: number,
    selectedModelName: string

}

const initialState: deviceModelsState = {
    selectedModel: -1,
    selectedModelName: ''
}

export const deviceModelsSlice = createSlice({
    name: 'devicemodels',
    initialState,
    reducers: {
        setSelectedModel: (state, action: PayloadAction<number>) => {
            state.selectedModel = action.payload;
        },
        setSelectedModelName: (state, action: PayloadAction<string>) => {
            state.selectedModelName = action.payload;
        }
    }
})

export const {setSelectedModel, setSelectedModelName} = deviceModelsSlice.actions;
export const selectSelectedModel = (state: RootState) => state.devicemodels.selectedModel;
export const selectSelectedModelName = (state: RootState) => state.devicemodels.selectedModelName;

export const devicemodelsReducer = deviceModelsSlice.reducer;


