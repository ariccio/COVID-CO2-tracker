import { createSlice, PayloadAction } from '@reduxjs/toolkit'

import { RootState } from '../../app/rootReducer';

export enum CallPromptAsyncStateAction {
    TriggerCallPromptAsync
}

export enum AuthLoginProgressState {
    None,
    WaitingForGoogle,
    ParsingGoogleResponse,
    GoogleResponseGood,
    Failed,
    ConnectingToServer,
    AlmostDoneSaving
  }
  
interface Auth {
    // authState: AuthState | undefined;
    loginProgress: AuthLoginProgressState;
    loginErrors: string | null;
    asyncStoreError: string | null;
    promptAsyncReady: boolean;
    requestPromptAsync: CallPromptAsyncStateAction | null;
    promptAsyncError: string | null;
}

const initialState: Auth = {
    // authState: undefined,
    loginProgress: AuthLoginProgressState.None,
    loginErrors: null,
    asyncStoreError: null,
    promptAsyncReady: false,
    requestPromptAsync: null,
    promptAsyncError: null
}

export const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        // setAuthState: (state, action: PayloadAction<AuthState>) => {
        //     state.authState = action.payload;
        // },
        setLoginProgress: (state, action: PayloadAction<AuthLoginProgressState>) => {
            state.loginProgress = action.payload;
        },
        setLoginErrors: (state, action: PayloadAction<string | null>) => {
            state.loginErrors = action.payload;
        },
        setAsyncStoreError: (state, action: PayloadAction<string | null>) => {
            state.asyncStoreError = action.payload;
        },
        setPromptAsyncReady: (state, action: PayloadAction<boolean>) => {
            state.promptAsyncReady = action.payload;
        },
        setRequestPromptAsync: (state, action: PayloadAction<CallPromptAsyncStateAction | null>) => {
            state.requestPromptAsync = action.payload;
        },
        setPromptAsyncError: (state, action: PayloadAction<string | null>) => {
            state.promptAsyncError = action.payload;
        }
    }
});

export const {setLoginProgress, setLoginErrors, setAsyncStoreError, setPromptAsyncReady, setRequestPromptAsync, setPromptAsyncError} = authSlice.actions;


// export const selectAuthState = (state: RootState) => state.auth.authState;
export const selectLoginProgress = (state: RootState) => state.auth.loginProgress;
export const selectLoginErrors = (state: RootState) => state.auth.loginErrors;
export const selectAsyncStoreError = (state: RootState) => state.auth.asyncStoreError;
export const selectPromptAsyncReady = (state: RootState) => state.auth.promptAsyncReady;
export const selectRequestPromptAsync = (state: RootState) => state.auth.requestPromptAsync;
export const selectPromptAsyncError = (state: RootState) => state.auth.promptAsyncError;

export const authReducer = authSlice.reducer;

