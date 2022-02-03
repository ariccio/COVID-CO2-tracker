// See updated (more restrictive) licensing restrictions for this subproject! Updated 02/03/2022.
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { RootState } from './rootReducer';

interface Globals {
    jwt: string | null;
}

const initialState: Globals = {
    jwt: null
};

export const globalSlice = createSlice({
    name: 'globals',
    initialState,
    reducers: {
        setJWT: (state, action: PayloadAction<string | null>) => {
            state.jwt = action.payload;
        }
    }
});

export const {setJWT} = globalSlice.actions;

export const selectJWT = (state: RootState) => state.globals.jwt;

export const globalsReducer = globalSlice.reducer;