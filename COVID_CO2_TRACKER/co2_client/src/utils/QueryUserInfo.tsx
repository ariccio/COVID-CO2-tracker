
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

import {formatErrors} from './ErrorObject'

const SHOW_USER_URL = API_URL + '/users/show';



interface UserInfoInternal {
    username: string,
    devices: Array<UserInfoDevice>,
    measurements: Array<UserInfoMeasurements>
}

export interface UserInfoType {
    user_info: UserInfoInternal,
    errors?: any
}

export const defaultUserInfo: UserInfoType = {
    user_info: {
        username: '',
        devices: [],
        measurements: []
    }
}


function userInfoToStrongType(userInfo: any): UserInfoType {
    console.assert(userInfo !== undefined);
    if (userInfo.errors === undefined) {
        console.assert(userInfo.user_info !== undefined);
        console.assert(userInfo.devices !== undefined);
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

export async function queryUserInfo(): Promise<UserInfoType | null> {
    const rawResponse: Promise<Response> = fetch(SHOW_USER_URL, userRequestOptions());
    // console.log("body: ", (await rawResponse).body)
    const awaitedResponse = await rawResponse;
    const jsonResponse = awaitedResponse.json();
    const response = await jsonResponse;
    // console.log(response);
    if ((response.errors !== undefined) || (awaitedResponse.status !== 200)) {
        if (awaitedResponse.status === 401) {
            console.warn("user not logged in!");
            if (response.errors !== undefined) {
                console.error(formatErrors(response.errors));
                return null;
            }
        }
        console.error(formatErrors(response.errors));
        alert(formatErrors(response.errors));
        if (awaitedResponse.status !== 200) {
            console.warn(`server returned a response with a status field (${awaitedResponse.status}), and it wasn't a 200 (OK) status.`);
            console.error(response);
            alert(response);
            debugger;
            throw new Error("hmm");
        }
    }
    return userInfoToStrongType(response);
    // return response;
}

