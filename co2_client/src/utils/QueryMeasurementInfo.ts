import {API_URL} from './UrlPath';

import {ErrorObjectType} from './ErrorObject';
import {userRequestOptions} from './DefaultRequestOptions';
import {fetchJSONWithChecks} from './FetchHelpers';
import { defaultSerializedSingleMeasurementInfo, SerializedSingleMeasurement } from './QueryDeviceInfo';



const SHOW_MEASUREMENT_URL = (API_URL + '/measurement');

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


export async function queryMeasurementInfo(measurement_id: string): Promise<ShowMeasurementResponse> {
    const fetchFailedCallback = async (awaitedResponse: Response): Promise<ShowMeasurementResponse> => {
        console.error("something broke! Fetch failed! TODO: error handle here");
        return awaitedResponse.json();
    }
    const fetchSuccessCallback = async (awaitedResponse: Response): Promise<ShowMeasurementResponse> => {
        console.log("TODO: strong type");
        return awaitedResponse.json();
    }

    const thisMeasurementURL = (SHOW_MEASUREMENT_URL + '/' + measurement_id);
    const result = fetchJSONWithChecks(thisMeasurementURL, userRequestOptions(), 200, true, fetchFailedCallback, fetchSuccessCallback) as Promise<ShowMeasurementResponse>;
    return result;
}