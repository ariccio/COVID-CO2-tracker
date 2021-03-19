import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../../app/store';


interface LoginState {
    username: string;
    jwt: string;
}

const initialState: LoginState = {
    username: '',
    jwt: ''
}


export const loginSlice = createSlice({
    name: 'username',
    initialState,
    reducers: {
        setUsername: (state, action: PayloadAction<string>) => {
            state.username = action.payload;
        },
        setJWT: (state, action: PayloadAction<string>) => {
            state.jwt = action.payload;
        }
    }
})

export const {setUsername} = loginSlice.actions;

export const selectUsername = (state: RootState) => state.login.username;
export const selectJWT = (state: RootState) => state.login.jwt;
export const loginReducer = loginSlice.reducer;