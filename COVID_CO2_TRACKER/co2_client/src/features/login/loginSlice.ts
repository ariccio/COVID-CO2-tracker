import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../../app/store';

interface GoogleProfile {
    googleId: string;
    imageUrl: string;
    email: string;
    name: string;
    givenName: string;
    familyName: string;
}

interface AuthResponse {
    readonly access_token: string;
    readonly id_token: string;
    readonly login_hint: string;
    readonly scope: string;
    readonly expires_in: number;
    readonly first_issued_at: number;
    readonly expires_at: number;
  }
  

interface LoginState {
    username: string;
    googleProfile: GoogleProfile | null;
    googleAuthResponse: AuthResponse | null;
}

const initialState: LoginState = {
    username: '',
    googleProfile: null,
    googleAuthResponse: null
}


export const loginSlice = createSlice({
    name: 'username',
    initialState,
    reducers: {
        setUsername: (state, action: PayloadAction<string>) => {
            state.username = action.payload;
        },
        setGoogleProfile: (state, action: PayloadAction<GoogleProfile>) => {
            state.googleProfile = action.payload;
        },
        setGoogleAuthResponse: (state, action: PayloadAction<AuthResponse | null>) => {
            state.googleAuthResponse = action.payload;
        }
    }
})

export const {setUsername, setGoogleProfile, setGoogleAuthResponse} = loginSlice.actions;

export const selectUsername = (state: RootState) => state.login.username;
export const selectGoogleProfile = (state: RootState) => state.login.googleProfile;
export const selectGoogleAuthResponse = (state: RootState) => state.login.googleAuthResponse;
export const loginReducer = loginSlice.reducer;