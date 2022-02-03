// See updated (more restrictive) licensing restrictions for this subproject! Updated 02/03/2022.
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { UserInfoDevice } from '../../../../co2_client/src/utils/DeviceInfoTypes';
import { RootState } from '../../app/rootReducer';


interface UserDevicesInformation {
    userSupportedDevices: Array<UserInfoDevice> | null;
    userUNSupportedDevices: Array<UserInfoDevice> | null;
}

const initialState: UserDevicesInformation = {
    userSupportedDevices: null,
    userUNSupportedDevices: null
}


export const devicesSlice = createSlice({
    name: 'userDevices',
    initialState,
    reducers: {
        setSupportedDevices: (state, action: PayloadAction<UserInfoDevice[] | null>) => {
            state.userSupportedDevices = action.payload;
        },
        setUNSupportedDevices: (state, action: PayloadAction<UserInfoDevice[] | null>) => {
            state.userUNSupportedDevices = action.payload;
        }
    }
});

export const {setSupportedDevices, setUNSupportedDevices} = devicesSlice.actions;

export const selectSupportedDevices = (state: RootState) => state.userDevices.userSupportedDevices;
export const selectUNSupportedDevices = (state: RootState) => state.userDevices.userUNSupportedDevices;

export const userDevicesReducer = devicesSlice.reducer;
