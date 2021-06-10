import {API_URL} from './UrlPath';

import {formatErrors, ErrorObjectType} from './ErrorObject';
import {postRequestOptions, userRequestOptions} from './DefaultRequestOptions';
import {fetchJSONWithChecks} from './FetchHelpers';
import { DeviceInfoResponse } from './QueryDeviceInfo';

interface AppStats {
    users: number,
    measurements: number,
    devices: number,
    manufacturers: number,
    models: number,
    places: number,
    sublocations: number
}

export interface AppStatsResponse {
    stats: AppStats,
    errors?: Array<ErrorObjectType>
}

export const defaultAppStatsResponse: AppStatsResponse = {
    stats: {
        users: -1,
        measurements: -1,
        devices: -1,
        manufacturers: -1,
        models: -1,
        places: -1,
        sublocations: -1
    }
}


export const SHOW_APP_STATS_URL = (API_URL + '/stats/show');

function statsInfoResponseToStrongType(appStatsResponse: any): AppStatsResponse {
    console.assert(appStatsResponse.stats !== undefined);
    console.assert(appStatsResponse.stats !== null);
    
    console.assert(appStatsResponse.stats.users !== undefined);
    console.assert(appStatsResponse.stats.measurements !== undefined);
    console.assert(appStatsResponse.stats.devices !== undefined);
    console.assert(appStatsResponse.stats.manufacturers !== undefined);
    console.assert(appStatsResponse.stats.models !== undefined);
    console.assert(appStatsResponse.stats.places !== undefined);
    console.assert(appStatsResponse.stats.sublocations !== undefined);

    console.assert(appStatsResponse.stats.users !== null);
    console.assert(appStatsResponse.stats.measurements !== null);
    console.assert(appStatsResponse.stats.devices !== null);
    console.assert(appStatsResponse.stats.manufacturers !== null);
    console.assert(appStatsResponse.stats.models !== null);
    console.assert(appStatsResponse.stats.places !== null);
    console.assert(appStatsResponse.stats.sublocations !== null);

    return appStatsResponse;
}


export async function queryAppStats(): Promise<AppStatsResponse> {
    const fetchFailedCallback = async (awaitedResponse: Response): Promise<never> => {
        console.warn("querying app stats failed.");
        throw new Error(formatErrors((await awaitedResponse.clone().json()).errors));
    }
    
    const fetchSuccessCallback = async (awaitedResponse: Response): Promise<AppStatsResponse> => {
        return statsInfoResponseToStrongType(await awaitedResponse.json());
    }

    const result = fetchJSONWithChecks(SHOW_APP_STATS_URL, userRequestOptions(), 200, false, fetchFailedCallback, fetchSuccessCallback) as Promise<never> | Promise<AppStatsResponse>;
    return result;
}
