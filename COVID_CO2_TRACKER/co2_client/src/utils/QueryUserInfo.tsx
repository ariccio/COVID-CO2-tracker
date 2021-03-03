
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
import { fetchJSONWithChecks } from './FetchHelpers';

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

export async function queryUserInfo(): Promise<UserInfoType> {
    const fetchFailedCallback = async (awaitedResponse: Response): Promise<UserInfoType> => {
        if (awaitedResponse.status === 401) {
            console.warn("user not logged in!");
            const parsedJSONResponse = await awaitedResponse.json();
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
    // try {
    //     const rawResponse: Promise<Response> = fetch(SHOW_USER_URL, userRequestOptions());
    //     // console.log("body: ", (await rawResponse).body)
    //     const awaitedResponse = await rawResponse;
    //     // const jsonResponse = awaitedResponse.json();
    //     // const parsedJSONResponse = await jsonResponse;
    //     // console.log(response);
    //     if (fetchFailed(awaitedResponse, 200, false)) {
    //         if (awaitedResponse.status === 401) {
    //             console.warn("user not logged in!");
    //             const parsedJSONResponse = await awaitedResponse.json();
    //             if (parsedJSONResponse.errors !== undefined) {
    //                 console.error(formatErrors(parsedJSONResponse.errors));
    //                 // return null;
    //             }
    //         }
    
    //     }
    //     return userInfoToStrongType(await awaitedResponse.json());
    // }
    // catch(error) {
    //     fetchFilter(error);
    // }
    // return response;
}

