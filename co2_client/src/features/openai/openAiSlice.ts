import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../../app/store';


export interface openAIState {
    openAI_platform_key: string
}

export const defaultOpenAIState: openAIState = {
    openAI_platform_key: ''
};

export interface OpenAISlice {
    openAI: openAIState
}

const initialState: OpenAISlice = {
    openAI: defaultOpenAIState
};

export const openAISlice = createSlice({
    name: 'openAI',
    initialState,
    reducers: {
        setOpenAIPlatformKey: (state, action: PayloadAction<string>) => {
            state.openAI.openAI_platform_key = action.payload;
        }
    }
})

export const {setOpenAIPlatformKey} = openAISlice.actions;

export const selectOpenAIPlatformKey = (state: RootState) => state.openAI.openAI.openAI_platform_key;

export const openAIReducer = openAISlice.reducer;
