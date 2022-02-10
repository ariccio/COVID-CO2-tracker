import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../../app/store';

import {UserInfoType, defaultUserInfo} from '../../utils/UserInfoTypes';
import { UserSettings } from '../../utils/UserSettings';

interface UserInfoState {
    userInfo: UserInfoType;
    userInfoErrorState: string;
    settings_: UserSettings | null,
    settingsErrorState: string | null
}

const initialState: UserInfoState = {
    userInfo: defaultUserInfo,
    userInfoErrorState: '',
    settings_: null,
    settingsErrorState: null
};

export const profileSlice = createSlice({
    name: 'profile',
    initialState,
    reducers: {
        setUserInfoState: (state, action: PayloadAction<UserInfoType>) => {
            state.userInfo = action.payload;
        },
        setUserInfoErrorState: (state, action: PayloadAction<string>) => {
            state.userInfoErrorState = action.payload;
        },
        setUserSettings: (state, action: PayloadAction<UserSettings | null>) => {
            state.settings_ = action.payload;
        },
        setUserSettingsErrorState: (state, action: PayloadAction<string | null>) => {
            state.settingsErrorState = action.payload;
        }
    }
})
export const {setUserInfoState, setUserInfoErrorState, setUserSettings, setUserSettingsErrorState} = profileSlice.actions;
export const selectUserInfoState = (state: RootState) => state.profile.userInfo;
export const selectUserSettings = (state: RootState) => state.profile.settings_;
export const selectUserSettingsErrors = (state: RootState) => state.profile.settingsErrorState;
export const selectUserInfoErrorState = (state: RootState) => state.profile.userInfoErrorState;

export const profileReducer = profileSlice.reducer;
