
// from old project.
/*
interface Score {
    level_id: string,
    score: string
}
*/

import {SHOW_USER_URL, USER_DEVICES_URL} from './UrlPath';
import {userRequestOptions} from './DefaultRequestOptions';

import {formatErrors} from './ErrorObject';
import { fetchJSONWithChecks } from './FetchHelpers';

import { UserInfoType, userInfoToStrongType, UserDevicesInfo } from './UserInfoTypes';






export async function queryUserInfo(): Promise<UserInfoType> {
    const fetchFailedCallback = async (awaitedResponse: Response): Promise<UserInfoType> => {
        const copyForErrors = awaitedResponse.clone();
        if (copyForErrors.status === 401) {
            console.warn("user not logged in!");
            const parsedJSONResponse = await copyForErrors.json();
            if (parsedJSONResponse.errors !== undefined) {
                console.error(`queryUserInfo error: ${formatErrors(parsedJSONResponse.errors)}`);
                // return null;   
            }
        }
        return userInfoToStrongType(await awaitedResponse.json());
    }

    const fetchSuccessCallback = async (awaitedResponse: Response): Promise<UserInfoType> => {
        // debugger;
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

