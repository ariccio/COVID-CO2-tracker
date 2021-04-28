import {API_URL} from './UrlPath';

import {formatErrors, ErrorObjectType} from './ErrorObject';
import {postRequestOptions, userRequestOptions} from './DefaultRequestOptions';
import {fetchJSONWithChecks} from './FetchHelpers';
import { SublocationMeasurements } from '../features/places/placesSlice';


const DEVICE_NAMES_URL = (API_URL + '/device_name_serial/device_ids_to_names');


// export interface UserInfoSingleMeasurement {
//     device_id: number,
//     // device_name: string,
//     measurement_id: number,
//     co2ppm: number,
//     measurementtime: string,
//     // place: {
//     //     id: number,
//     //     // google_place_id: string
//     // },
//     crowding: number,
//     // location_where_inside_info: string
//     sublocation_id: number
// }

// export const defaultMeasurementInfo: UserInfoSingleMeasurement = {
//     device_id: -1,
//     // device_name: '',
//     measurement_id: -1,
//     co2ppm: -1,
//     measurementtime: '',
//     // place: {
//     //     id: -1,
//     //     // google_place_id: ''
//     // },
//     crowding: -1,
//     // location_where_inside_info: ''
//     sublocation_id: -1
// }



/*
:data=>
  {
    :id=>"25",
    :type=>:measurement,
    :attributes=>
    {
        :id=>25,
        :co2ppm=>228,
        :measurementtime=>Thu, 11 Mar 2021 03:21:27.590104000 UTC +00:00,
        :crowding=>1
    },
   :relationships=>
    {
        :device=>
        {
            :data=>
            {
                :id=>"5",
                :type=>:device
            }
        },
        :sub_location=>
        {
            :data=>
            {
                :id=>"22",
                :type=>:sub_location
            }
        }
    }
}
*/
export interface SerializedSingleMeasurement {
    //TODO: string
    id: string,
    type: string,
    attributes: {
        co2ppm: number,
        measurementtime: string,
        crowding: number,
        updated_at: string,
        created_at: string
    },
    relationships: {
        device: {
            data: {
                id: string,
                type: string
            }
        },
        sub_location: {
            data: {
                id: string,
                type: string
            }
        }
    }
}

export const defaultSerializedSingleMeasurementInfo: SerializedSingleMeasurement = {
    id: '',
    type: '',
    attributes: {
        co2ppm: -1,
        measurementtime: '',
        crowding: -1,
        created_at: '',
        updated_at: ''
    },
    relationships: {
        device: {
            data: {
                id: '',
                type: ''
            }
        },
        sub_location: {
            data: {
                id: '',
                type: ''
            }
        }
    }
}

export interface SerializedSingleDeviceSerial {
    id: string,
    type: string,
    attributes: {
        serial: string
    }
}

export const defaultSerializedSingleDeviceSerial: SerializedSingleDeviceSerial = {
    id: '',
    type: '',
    attributes: {
        serial: ''
    }
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
    device_model_id: string,
    user_id: number,
    measurements: {
        data: Array<SerializedSingleMeasurement>,
    }
    errors?: Array<ErrorObjectType>
}


export const defaultDeviceInfoResponse: DeviceInfoResponse = {
    device_id: -1,
    serial: '',
    device_model: '',
    device_model_id: '',
    user_id: -1,
    measurements: {
        data: []
    }
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
        // if (deviceInfoResponse.measurements.length > 0) {

        //     // console.assert(deviceInfoResponse.measurements[0].place !== undefined);
        //     // console.assert(deviceInfoResponse.measurements[0].place.id !== undefined);
        //     debugger;
        //     console.assert(deviceInfoResponse.measurements[0].place.google_place_id !== undefined);
        // }
    }
    const return_value: DeviceInfoResponse = {
        device_id: deviceInfoResponse.device_id,
        serial: deviceInfoResponse.serial,
        device_model: deviceInfoResponse.device_model,
        device_model_id: deviceInfoResponse.device_model_id,
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
    return value.measurements.data.map((measurement: SerializedSingleMeasurement) => {
        return measurement.relationships.device.data.id;
    })
}

const singleDeviceNameRequestInit = (deviceID: string) => {
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

export const fetchSingleDeviceName = (deviceID: string) => {
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
    const ids = measurements_by_sublocation.flatMap((value: SublocationMeasurements) => {
        return deviceIDsFromSubLocation(value);
    }).sort();

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
