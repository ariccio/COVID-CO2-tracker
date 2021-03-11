
// from old project.
/*
interface Score {
    level_id: string,
    score: string
}
*/

import {API_URL} from './UrlPath';
import {UserInfoDevice, UserInfoMeasurements} from './QueryDeviceInfo';
import {userRequestOptions} from './DefaultRequestOptions';

import {ErrorObjectType, formatErrors} from './ErrorObject'
import { fetchJSONWithChecks } from './FetchHelpers';

const SHOW_USER_URL = API_URL + '/users/show';
const USER_DEVICES_URL = (API_URL + '/my_devices');


interface UserInfoInternal {
    username: string,
    devices: Array<UserInfoDevice>,
    measurements: Array<UserInfoMeasurements>
}

export interface UserInfoType {
    user_info: UserInfoInternal,
    errors?: Array<ErrorObjectType>
}

export const defaultUserInfo: UserInfoType = {
    user_info: {
        username: '',
        devices: [],
        measurements: []
    }
}

export interface UserDevicesInfo {
    devices: Array<UserInfoDevice>
    errors?: Array<ErrorObjectType>
}

export const defaultDevicesInfo: UserDevicesInfo = {
    devices: []
}

function userInfoToStrongType(userInfo: any): UserInfoType {
    console.assert(userInfo !== undefined);
    if (userInfo.errors === undefined) {
        console.assert(userInfo.user_info !== undefined);
        console.assert(userInfo.devices !== undefined);
    }
    if (userInfo.errors !== undefined) {
        return userInfo;
    }
    // debugger;
    const return_value: UserInfoType =  {
        user_info: {
            username: userInfo.user_info.email,
            devices: userInfo.devices,
            measurements: userInfo.measurements
        },
        errors: userInfo.errors
    }
    return return_value;
}

export async function queryUserInfo(): Promise<UserInfoType> {
    const fetchFailedCallback = async (awaitedResponse: Response): Promise<UserInfoType> => {
        const copyForErrors = awaitedResponse.clone();
        if (copyForErrors.status === 401) {
            console.warn("user not logged in!");
            const parsedJSONResponse = await copyForErrors.json();
            if (parsedJSONResponse.errors !== undefined) {
                console.error(formatErrors(parsedJSONResponse.errors));
                // return null;
                
            }
        }
        return userInfoToStrongType(await awaitedResponse.json());
    }

    const fetchSuccessCallback = async (awaitedResponse: Response): Promise<UserInfoType> => {
        return userInfoToStrongType(await awaitedResponse.json());
    }
    const result = fetchJSONWithChecks(SHOW_USER_URL, userRequestOptions(), 200, false, fetchFailedCallback, fetchSuccessCallback) as Promise<UserInfoType>;
    return result;
}

export async function queryUserDevices(): Promise<UserDevicesInfo> {
    const fetchFailedCallback = async (awaitedResponse: Response): Promise<UserDevicesInfo> => {
        console.error("failed to fetch user devices");
        return awaitedResponse.json();
    }

    const fetchSuccessCallback = async (awaitedResponse: Response): Promise<UserDevicesInfo> => {
        //TODO: strong types
        console.log("TODO: parse user devices as strong type");
        return awaitedResponse.json();
    }
    const result = fetchJSONWithChecks(USER_DEVICES_URL, userRequestOptions(), 200, true, fetchFailedCallback, fetchSuccessCallback) as Promise<UserDevicesInfo>;
    return result;
}