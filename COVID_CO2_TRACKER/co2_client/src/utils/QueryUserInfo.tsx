
// from old project.
/*
interface Score {
    level_id: string,
    score: string
}
*/

import {API_URL} from './UrlPath';


const SHOW_USER_URL = API_URL + '/users/show';
const includeCreds: RequestCredentials = "include";

function userRequestOptions(): RequestInit {
    const requestOptions = {
        method: 'get',
        credentials: includeCreds, //for httpOnly cookie
        headers: {
            'Content-Type': 'application/json',
        },
    }
    return requestOptions;
}

export interface UserInfoDevice {
    device_id: number,
    serial: string,
    device_model: string,
    device_model_id: number,
    device_manufacturer: string,
    device_manufacturer_id: number
}

export interface UserInfoMeasurements {
    device_id: number,
    measurement_id: number,
    co2ppm: number,
    measurementtime: string
}

interface UserInfoInternal {
    username: string,
    devices: Array<UserInfoDevice>,
    measurements: Array<UserInfoMeasurements>
}

export interface UserInfoType {
    user_info: UserInfoInternal,
    errors?: any
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
    const rawResponse: Promise<Response> = fetch(SHOW_USER_URL, userRequestOptions());
    // console.log("body: ", (await rawResponse).body)
    const awaitedResponse = await rawResponse;
    const jsonResponse = awaitedResponse.json();
    const response = await jsonResponse;
    console.log(response);
    if (response.errors !== undefined) {
        if (response.status !== 200) {
            console.log("server returned a response with a status field, and it wasn't a 200 (OK) status.");
            console.log(response);
            alert(response);
            debugger;
            throw new Error("hmm");
        }
    }
    return userInfoToStrongType(response);
    // return response;
}

