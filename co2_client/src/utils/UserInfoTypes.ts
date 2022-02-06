import {SerializedSingleMeasurement, UserInfoDevice} from './DeviceInfoTypes';
import {ErrorObjectType} from './ErrorObject';

interface UserSettings {
    realtime_upload_place_id: string | null;
    realtime_upload_sub_location_id: string | null;
}

interface UserInfoInternal {
    username: string,
    devices: Array<UserInfoDevice>,
    measurements: {
        data: Array<SerializedSingleMeasurement>
    },
    settings: UserSettings | null

}

export interface UserInfoType {
    user_info: UserInfoInternal,
    errors?: Array<ErrorObjectType>
}

export const defaultUserInfo: UserInfoType = {
    user_info: {
        username: '',
        devices: [],
        measurements: {
            data: []
        },
        settings: null
    }
}

export interface UserDevicesInfo {
    devices: Array<UserInfoDevice>
    errors?: Array<ErrorObjectType>
}

export const defaultDevicesInfo: UserDevicesInfo = {
    devices: []
}

//could be boolean?
function checkUserInfoDevice(device: UserInfoDevice): void {
    console.assert(device.device_id);
    console.assert(device.serial);
    console.assert(device.device_model);
    console.assert(device.device_model_id);
    console.assert(device.device_manufacturer);
    console.assert(device.device_manufacturer_id);
}

export function userDevicesInfoResponseToStrongType(responseMaybeUserDevicesInfo: any): UserDevicesInfo {
    console.assert(responseMaybeUserDevicesInfo !== undefined);
    if (responseMaybeUserDevicesInfo.errors !== undefined) {
        console.warn("Found errors, not checking any type correctness.");
        return responseMaybeUserDevicesInfo;
    }
    console.assert(responseMaybeUserDevicesInfo.devices !== undefined);
    console.assert(responseMaybeUserDevicesInfo.devices.length !== undefined);
    if (responseMaybeUserDevicesInfo.devices.length > 0) {
        for (let i = 0; i < responseMaybeUserDevicesInfo.devices.length; ++i) {
            const device = responseMaybeUserDevicesInfo.devices[i];
            checkUserInfoDevice(device);
        }   
    }
    return responseMaybeUserDevicesInfo;
}

export function userInfoToStrongType(userInfo: any): UserInfoType {
    console.assert(userInfo !== undefined);
    if (userInfo.errors !== undefined) {
        console.warn("Found errors, not checking any type correctness.");
        return userInfo;
    }
    console.assert(userInfo.user_info !== undefined);
    console.assert(userInfo.devices !== undefined);
    console.assert(userInfo.devices.length !== undefined);
    console.assert(userInfo.settings !== undefined);
    for (let i = 0; i < userInfo.devices.length; ++i) {
        const device = userInfo.devices[i];
        checkUserInfoDevice(device);
    }

    // debugger;
    const return_value: UserInfoType =  {
        user_info: {
            username: userInfo.user_info.email,
            devices: userInfo.devices,
            measurements: userInfo.measurements,
            settings: userInfo.settings
        },
        errors: userInfo.errors
    }
    return return_value;
}
