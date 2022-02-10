import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../../app/store';

import {UserInfoType, defaultUserInfo, UserSettings} from '../../utils/UserInfoTypes';

interface UserInfoState {
    userInfo: UserInfoType;
    userInfoErrorState: string;
    settings_?: UserSettings | null,
}

const initialState: UserInfoState = {
    userInfo: defaultUserInfo,
    userInfoErrorState: '',
    settings_: null
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
        }
    }
})
export const {setUserInfoState, setUserInfoErrorState} = profileSlice.actions;
export const selectUserInfoState = (state: RootState) => state.profile.userInfo;
export const selectUserSettingsState = (state: RootState) => state.profile.userInfo.user_info.settings;
export const selectUserInfoErrorState = (state: RootState) => state.profile.userInfoErrorState;
export const profileReducer = profileSlice.reducer;
