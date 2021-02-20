import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../../app/store';


interface LoginState {
    username: string;
}

const initialState: LoginState = {
    username: ''
}


export const loginSlice = createSlice({
    name: 'username',
    initialState,
    reducers: {
        setUsername: (state, action: PayloadAction<string>) => {
            state.username = action.payload;
        }
    }
})

export const {setUsername} = loginSlice.actions;

export const selectUsername = (state: RootState) => state.login.username;

export const loginReducer = loginSlice.reducer;