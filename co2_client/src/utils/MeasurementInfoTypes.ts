import {ErrorObjectType} from './ErrorObject';

import {SerializedSingleMeasurement, defaultSerializedSingleMeasurementInfo} from './DeviceInfoTypes';


export interface ShowMeasurementResponse {
    data: {
        data: SerializedSingleMeasurement,
    },
    place_id: string,
    taken_by: string,
    errors?: Array<ErrorObjectType>
}

export const defaultShowMeasurementResponse: ShowMeasurementResponse = {
    data: {
        data: defaultSerializedSingleMeasurementInfo
    },
    place_id: '',
    taken_by: ''
}
