// See updated (more restrictive) licensing restrictions for this subproject! Updated 02/03/2022.
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '../../app/rootReducer';

interface NativeUserInfo {
    userName: string | null;
    settings: UserSettings | null;
};

interface UserSettings {
    realtime_upload_place_id: string | null;
    realtime_upload_sub_location_id: string | null;
}

const initialState: NativeUserInfo = {
    userName: null,
    settings: null
};


export const userInfoSlice = createSlice({
    name: 'userInfo',
    initialState,
    reducers: {
        setUserName: (state, action: PayloadAction<string | null>) => {
            state.userName = action.payload;
        },
        setUserSettings: (state, action: PayloadAction<UserSettings | null>) => {
            state.settings = action.payload;
        }
    }
})

export const {setUserName} = userInfoSlice.actions;

export const selectUserName = (state: RootState) => state.userInfo.userName;
export const selectUserSettings = (state: RootState) => state.userInfo.settings;

export const userInfoReducer = userInfoSlice.reducer;