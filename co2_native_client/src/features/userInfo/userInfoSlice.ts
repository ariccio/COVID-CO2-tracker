// See updated (more restrictive) licensing restrictions for this subproject! Updated 02/03/2022.
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { UserSettings } from '../../../../co2_client/src/utils/UserSettings';

// import { UserSettings } from '../../../../co2_client/src/utils/UserInfoTypes';
import { RootState } from '../../app/rootReducer';

// export interface UserSettings {
//     realtime_upload_place_id?: number | null;
//     realtime_upload_sub_location_id?: number | null;
//     setting_place_google_place_id?: number | null
// }


interface NativeUserInfo {
    userName?: string | null;
    settings?: UserSettings | null;
    settingsErrors: string | null;
};

const initialState: NativeUserInfo = {
    userName: undefined,
    settings: undefined,
    settingsErrors: null
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
        },
        setUserSettingsErrors: (state, action: PayloadAction<string | null>) => {
            state.settingsErrors = action.payload;
        }
    }
})

export const {setUserName, setUserSettings, setUserSettingsErrors} = userInfoSlice.actions;

export const selectUserName = (state: RootState) => state.userInfo.userName;
export const selectUserSettings = (state: RootState) => state.userInfo.settings;
export const selectUserSettingsErrors = (state: RootState) => state.userInfo.settingsErrors;

export const userInfoReducer = userInfoSlice.reducer;