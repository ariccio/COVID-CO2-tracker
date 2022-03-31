import {API_URL} from './UrlPath';

import {formatErrors, ErrorObjectType} from './ErrorObject';
import {postRequestOptions, userRequestOptions} from './DefaultRequestOptions';
import {fetchJSONWithChecks} from './FetchHelpers';
import { SublocationMeasurements } from '../features/places/placesSlice';

import {deviceInfoToStrongType, DeviceInfoResponse, SerializedSingleDeviceSerial, SerializedSingleMeasurement} from './DeviceInfoTypes';

const DEVICE_NAMES_URL = (API_URL + '/device_name_serial/device_ids_to_names');


export const SHOW_DEVICES_URL = (API_URL + '/device')



export async function queryDeviceInfo(device_id: number): Promise<DeviceInfoResponse> {
    if (isNaN(device_id)) {
        debugger;
    }

    // Is throw the right response? Maybe.
    const fetchFailedCallback = async (awaitedResponse: Response): Promise<never> => {
        debugger;
        console.warn("TODO: Throwing here is the WRONG action.");
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

export interface DeviceIDNamesSerialsResponse {
    devices: {
        data: Array<SerializedSingleDeviceSerial>,
    },
    errors?: Array<ErrorObjectType>
}

export const deviceIDsFromSubLocation = (value: SublocationMeasurements) => {
    if (value.measurements.data === undefined) {
        throw new Error(`value.measurements.data is undefined. This is a bug probably in deviceNamesRequestInit in QueryDeviceInfo? value.sub_location_id: ${value.sub_location_id}, value.description: ${value.description}`);
    }
    const all_IDs = value.measurements.data.map((measurement: SerializedSingleMeasurement) => {
        return measurement.relationships.device.data.id;
    });
    console.warn("TODO: This will get excessive.");
    const all_IDs_noNulls = all_IDs.filter((id) => {
        if (id === null) {
            debugger;
            console.log(`Filtering corrupted device id...`);
        }
        // debugger;
        return id !== null;
    })
    return all_IDs_noNulls as number[];
    // const IDsSet = new Set<number>();
    // for (let i = 0; i < value.measurements.data.length; i++) {
    //     IDsSet.add(value.measurements.data[i].relationships.device.data.id);
    // }
    // debugger;
    // return IDsSet;
}

const singleDeviceNameRequestInit = (deviceID: number) => {
    const defaultOptions = postRequestOptions();
    const ids = [deviceID];
    const options = {
        ...defaultOptions,
        body: JSON.stringify({
            device_ids: {
                ids
            }
        })
    };
    return options;
}

export const fetchSingleDeviceName = (deviceID: number) => {
    const requestInit = singleDeviceNameRequestInit(deviceID);
    const fetchFailedCallback = async (awaitedResponse: Response): Promise<DeviceIDNamesSerialsResponse> => {
        console.error("failed to get device names from ids!");
        return awaitedResponse.json();
    }
    const fetchSuccessCallback = async (awaitedResponse: Response): Promise<DeviceIDNamesSerialsResponse> => {
        console.log("TODO: strong type");
        return awaitedResponse.json();
    }
    const result = fetchJSONWithChecks(DEVICE_NAMES_URL, requestInit, 200, true, fetchFailedCallback, fetchSuccessCallback) as Promise<DeviceIDNamesSerialsResponse>;
    // result.then((response) => {
    //     // console.log(response);
    //     console.log(response.devices);
    //     // debugger;
    //     return response;
    // });
    return result;

}

const deviceNamesRequestInit = (measurements_by_sublocation: Array<SublocationMeasurements>) => {
    const defaultOptions = postRequestOptions();

    if (measurements_by_sublocation === undefined) {
        //Seen in sentry.
        throw new Error("Invalid data passed to deviceNamesRequestInit, measurements_by_sublocation is undefined. This shouldn't happen... I thought I fixed this!");
    }
    if (measurements_by_sublocation.flatMap === undefined) {
        console.warn(`typeof(measurements_by_sublocation.flatMap): ${typeof(measurements_by_sublocation)}`);
        throw new Error("measurements_by_sublocation.flatMap is undefined. This shouldn't happen... I thought I fixed this!");
    }

    const ids_unsorted = measurements_by_sublocation.flatMap((value: SublocationMeasurements) => {
        const ids_from_sublocation = deviceIDsFromSubLocation(value);
        // debugger;
        return ids_from_sublocation;
    });
    // debugger;
    const idsSet = new Set<number>(ids_unsorted);
    const ids = Array.from(idsSet);
    // debugger;

    const options = {
        ...defaultOptions,
        body: JSON.stringify({
            device_ids: {
                ids
            }
        })
    }
    return options;
}

export const fetchDeviceNamesForMeasurementsBySublocation = (measurements_by_sublocation: Array<SublocationMeasurements>) => {
    if (measurements_by_sublocation === undefined) {
        //Seen in sentry.
        throw new Error("Invalid data passed to fetchDeviceNamesForMeasurementsBySublocation, measurements_by_sublocation is undefined. This shouldn't happen... I thought I fixed this!");
    }
    const requestInit = deviceNamesRequestInit(measurements_by_sublocation)
    const fetchFailedCallback = async (awaitedResponse: Response): Promise<DeviceIDNamesSerialsResponse> => {
        console.error("failed to get device names from ids!");
        return awaitedResponse.json();
    }
    const fetchSuccessCallback = async (awaitedResponse: Response): Promise<DeviceIDNamesSerialsResponse> => {
        console.log("TODO: strong type");
        return awaitedResponse.json();
    }
    console.log("loading device serial numbers...");
    const result = fetchJSONWithChecks(DEVICE_NAMES_URL, requestInit, 200, true, fetchFailedCallback, fetchSuccessCallback) as Promise<DeviceIDNamesSerialsResponse>;
    // result.then((response) => {
    //     // console.log(response);
    //     console.log(response.devices);
    //     // debugger;
    //     return response;
    // });
    return result;
}
