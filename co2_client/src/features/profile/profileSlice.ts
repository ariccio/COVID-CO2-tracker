import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../../app/store';

import {UserInfoType, defaultUserInfo} from '../../utils/UserInfoTypes';

interface UserInfoState {
    userInfo: UserInfoType;
    userInfoErrorState: string;
}

const initialState: UserInfoState = {
    userInfo: defaultUserInfo,
    userInfoErrorState: ''
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
