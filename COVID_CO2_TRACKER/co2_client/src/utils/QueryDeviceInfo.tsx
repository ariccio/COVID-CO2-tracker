import {API_URL} from './UrlPath';

import {formatErrors} from './ErrorObject';
import {userRequestOptions} from './DefaultRequestOptions';

export interface UserInfoMeasurements {
    device_id: number,
    measurement_id: number,
    co2ppm: number,
    measurementtime: string
}

export const defaultMeasurementInfo: UserInfoMeasurements = {
    device_id: -1,
    measurement_id: -1,
    co2ppm: -1,
    measurementtime: ''
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
    measurements: Array<UserInfoMeasurements>
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
    // const show_device_url = (SHOW_DEVICES_URL);
    const rawResponse: Promise<Response> = fetch(SHOW_DEVICES_URL + `/${device_id}`, userRequestOptions());
    const awaitedResponse = await rawResponse;
    const jsonResponse = awaitedResponse.json();
    const response = await jsonResponse;
    console.log(response);
    if ((response.errors !== undefined) || (awaitedResponse.status !== 200)) {
        if (response.status !== 200) {
            console.warn(`server returned a response with a status field (${awaitedResponse.status}), and it wasn't a 200 (OK) status.`);
        }
        console.error(formatErrors(response.errors));
        alert(formatErrors(response.errors));
        debugger;
        throw new Error("hmm");
    }
    return deviceInfoToStrongType(response);
}