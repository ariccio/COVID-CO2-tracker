import {API_URL} from './UrlPath';

import {formatErrors, ErrorObjectType} from './ErrorObject';
import {userRequestOptions} from './DefaultRequestOptions';
import {fetchJSONWithChecks} from './FetchHelpers';

export interface UserInfoSingleMeasurement {
    device_id: number,
    device_name: string,
    measurement_id: number,
    co2ppm: number,
    measurementtime: string,
    place: {
        id: number,
        google_place_id: string
    },
    crowding: number,
    location_where_inside_info: string
}

export const defaultMeasurementInfo: UserInfoSingleMeasurement = {
    device_id: -1,
    device_name: '',
    measurement_id: -1,
    co2ppm: -1,
    measurementtime: '',
    place: {
        id: -1,
        google_place_id: ''
    },
    crowding: -1,
    location_where_inside_info: ''
}

export interface UserInfoDevice {
    device_id: number,
    serial: string,
    device_model: string,
    device_model_id: number,
    device_manufacturer: string,
    device_manufacturer_id: number
}


export interface DeviceInfoResponse {
    device_id: number
    serial: string,
    device_model: string,
    user_id: number,
    measurements: Array<UserInfoSingleMeasurement>,
    errors?: Array<ErrorObjectType>
}


export const defaultDeviceInfoResponse: DeviceInfoResponse = {
    device_id: -1,
    serial: '',
    device_model: '',
    user_id: -1,
    measurements: []
}
export const SHOW_DEVICES_URL = (API_URL + '/device')

function deviceInfoToStrongType(deviceInfoResponse: any): DeviceInfoResponse {
    console.assert(deviceInfoResponse !== undefined);
    if (deviceInfoResponse.errors === undefined) {
        console.assert(deviceInfoResponse.device_id !== undefined);
        console.assert(deviceInfoResponse.serial !== undefined);
        console.assert(deviceInfoResponse.device_model !== undefined);
        console.assert(deviceInfoResponse.user_id !== undefined);
        console.assert(deviceInfoResponse.measurements !== undefined);
        if (deviceInfoResponse.measurements.length > 0) {

            console.assert(deviceInfoResponse.measurements[0].place !== undefined);
            console.assert(deviceInfoResponse.measurements[0].place.id !== undefined);
            console.assert(deviceInfoResponse.measurements[0].place.google_place_id !== undefined);
        }
    }
    const return_value: DeviceInfoResponse = {
        device_id: deviceInfoResponse.device_id,
        serial: deviceInfoResponse.serial,
        device_model: deviceInfoResponse.device_model,
        user_id: deviceInfoResponse.user_id,
        measurements: deviceInfoResponse.measurements
    }
    return return_value;
}


export async function queryDeviceInfo(device_id: number): Promise<DeviceInfoResponse> {
    if (isNaN(device_id)) {
        debugger;
    }

    const fetchFailedCallback = async (awaitedResponse: Response): Promise<never> => {
        debugger;
        throw new Error(formatErrors((await awaitedResponse.clone().json()).errors));
    }

    const fetchSuccessCallback = async (awaitedResponse: Response): Promise<DeviceInfoResponse> => {
        return deviceInfoToStrongType(await awaitedResponse.json());
    }
    const show_device_url = (SHOW_DEVICES_URL + `/${device_id}`);
    const result = fetchJSONWithChecks(show_device_url, userRequestOptions(), 200, true, fetchFailedCallback, fetchSuccessCallback) as Promise<never> | Promise<DeviceInfoResponse>;
    return result;
    // try {
    //     const rawResponse: Promise<Response> = fetch(, userRequestOptions());
    //     const awaitedResponse = await rawResponse;
    //     // const jsonResponse = awaitedResponse.json();
    //     // const parsedJSONResponse = await jsonResponse;
    //     // console.log(parsedJSONResponse);
    //     if(fetchFailed(awaitedResponse, 200, true)){
    //         debugger;
    //         throw new Error(formatErrors((await awaitedResponse.json()).errors));
    //     }
    //     return deviceInfoToStrongType(await awaitedResponse.json());
    // }
    // catch(error) {
    //     fetchFilter(error);
    // }
}