import {ErrorObjectType} from './ErrorObject';

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

export function deviceInfoToStrongType(deviceInfoResponse: any): DeviceInfoResponse {
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