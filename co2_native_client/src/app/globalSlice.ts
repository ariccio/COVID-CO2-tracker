// See updated (more restrictive) licensing restrictions for this subproject! Updated 02/03/2022.
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { RootState } from './rootReducer';

interface Globals {
    jwt: string | null;
    sucessfulUploads: number;
}

const initialState: Globals = {
    jwt: null,
    sucessfulUploads: 0
};

export const globalSlice = createSlice({
    name: 'globals',
    initialState,
    reducers: {
        setJWT: (state, action: PayloadAction<string | null>) => {
            state.jwt = action.payload;
        },
        incrementSucessfulUploads: (state, action: PayloadAction<void>) => {
            state.sucessfulUploads += 1;
        }
    }
});

export const {setJWT, incrementSucessfulUploads} = globalSlice.actions;

export const selectJWT = (state: RootState) => state.globals.jwt;
export const selectSucessfulUploads = (state: RootState) => state.globals.sucessfulUploads;

export const globalsReducer = globalSlice.reducer;