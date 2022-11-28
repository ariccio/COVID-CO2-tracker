// See updated (more restrictive) licensing restrictions for this subproject! Updated 02/03/2022.
import { createSlice, PayloadAction } from '@reduxjs/toolkit'

import { UserInfoDevice } from '../../../../co2_client/src/utils/DeviceInfoTypes';
import { RootState } from '../../app/rootReducer';


interface UserDevicesInformation {
    userSupportedDevices: UserInfoDevice[] | null;
    userUNSupportedDevices: UserInfoDevice[] | null;
    userDeviceSettingsStatus: string | null;
}

export const initialUserDevicesState: UserDevicesInformation = {
    userSupportedDevices: [],
    userUNSupportedDevices: null,
    userDeviceSettingsStatus: null
}


export const devicesSlice = createSlice({
    name: 'userDevices',
    initialState: initialUserDevicesState,
    reducers: {
        setSupportedDevices: (state, action: PayloadAction<UserInfoDevice[] | null>) => {
            state.userSupportedDevices = action.payload;
        },
        setUNSupportedDevices: (state, action: PayloadAction<UserInfoDevice[] | null>) => {
            state.userUNSupportedDevices = action.payload;
        },
        setUserDeviceSettingsStatus: (state, action: PayloadAction<string | null>) => {
            state.userDeviceSettingsStatus = action.payload;
        }
    }
});

export const {setSupportedDevices, setUNSupportedDevices, setUserDeviceSettingsStatus} = devicesSlice.actions;

export const selectSupportedDevices = (state: RootState) => state.userDevices.userSupportedDevices;
export const selectUNSupportedDevices = (state: RootState) => state.userDevices.userUNSupportedDevices;
export const selectUserDeviceSettingsStatus = (state: RootState) => state.userDevices.userDeviceSettingsStatus;

export const userDevicesReducer = devicesSlice.reducer;
