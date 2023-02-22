import { PromptMomentNotification } from '@react-oauth/google';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Root } from 'react-dom/client';
import { RootState } from '../../app/store';



export interface GoogleProfile {
    aud: string;
    azp: string;
    email: string;
    email_verified: boolean;
    exp: number;
    familyName: string;
    givenName: string;
    iat: number;
    iss: number;
    jti: string;
    name: string;
    nbf: string;
    picture: string;
    sub: string;
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
  

export const enum GSIScriptLoadStates {
    NoneOrNotLoadedYet,
    Success,
    Error
}

export type PromptMomentNotificationResults = { 
    isDisplayMoment: ReturnType<PromptMomentNotification["isDisplayMoment"]>;
    isDisplayed: ReturnType<PromptMomentNotification["isDisplayed"]>;
    isNotDisplayed: ReturnType<PromptMomentNotification["isNotDisplayed"]>;
    notDisplayedReason: ReturnType<PromptMomentNotification["getNotDisplayedReason"]>;
    isSkippedMoment: ReturnType<PromptMomentNotification["isSkippedMoment"]>;
    skippedReason: ReturnType<PromptMomentNotification["getSkippedReason"]>;
    isDismissedMoment: ReturnType<PromptMomentNotification["isDismissedMoment"]>;
    dismissedReason: ReturnType<PromptMomentNotification["getDismissedReason"]>;
    momentType: ReturnType<PromptMomentNotification["getMomentType"]>;
}

interface LoginState {
    username: string;
    googleProfile: GoogleProfile | null;
    googleAuthResponse: AuthResponse | null;
    loginAaaPeeEyeKey: string;
    aapeeeyeKeyErrorState: string;
    gSIScriptLoadState: GSIScriptLoadStates;
    promptMomentNotificationState?: PromptMomentNotificationResults;
    googleOneTapErrorState: string;

}

const initialState: LoginState = {
    username: '',
    googleProfile: null,
    googleAuthResponse: null,
    loginAaaPeeEyeKey: '',
    aapeeeyeKeyErrorState: '',
    gSIScriptLoadState: GSIScriptLoadStates.NoneOrNotLoadedYet,
    promptMomentNotificationState: undefined,
    googleOneTapErrorState: ''
}


export const loginSlice = createSlice({
    name: 'username',
    initialState,
    reducers: {
        setUsername: (state, action: PayloadAction<string>) => {
            state.username = action.payload;
        },
        setGoogleProfile: (state, action: PayloadAction<GoogleProfile | null>) => {
            state.googleProfile = action.payload;
        },
        setGoogleAuthResponse: (state, action: PayloadAction<AuthResponse | null>) => {
            state.googleAuthResponse = action.payload;
        },
        setLoginAaaPeeEyeKey: (state, action: PayloadAction<string>) => {
            state.loginAaaPeeEyeKey = action.payload;
        },
        setAaaPeeEyeKeyErrorState: (state, action: PayloadAction<string>) => {
            state.aapeeeyeKeyErrorState = action.payload;
        },
        setGSIScriptLoadState: (state, action: PayloadAction<GSIScriptLoadStates>) => {
            state.gSIScriptLoadState = action.payload;
        },
        setPromptMomentNotificationState: (state, action: PayloadAction<PromptMomentNotificationResults>) => {
            state.promptMomentNotificationState = action.payload;
        },
        setGoogleOneTapErrorState: (state, action: PayloadAction<string>) => {
            state.googleOneTapErrorState = action.payload;
        }
    }
})

export const {setUsername, setGoogleProfile, setGoogleAuthResponse, setLoginAaaPeeEyeKey, setAaaPeeEyeKeyErrorState, setGSIScriptLoadState, setPromptMomentNotificationState, setGoogleOneTapErrorState} = loginSlice.actions;

export const selectUsername = (state: RootState) => state.login.username;
export const selectGoogleProfile = (state: RootState) => state.login.googleProfile;
export const selectGoogleAuthResponse = (state: RootState) => state.login.googleAuthResponse;
export const selectLoginAaaPeeEyeKey = (state: RootState) => state.login.loginAaaPeeEyeKey;
export const selectAaaPeeeEyeKeyErrorState = (state: RootState) => state.login.aapeeeyeKeyErrorState;
export const selectGSIScriptLoadState = (state: RootState) => state.login.gSIScriptLoadState;
export const selectPromptMomentNotificationState = (state: RootState) => state.login.promptMomentNotificationState;
export const selectGoogleOneTapErrorState = (state: RootState) => state.login.googleOneTapErrorState;
export const loginReducer = loginSlice.reducer;