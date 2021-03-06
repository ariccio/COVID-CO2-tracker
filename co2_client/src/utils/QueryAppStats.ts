import {API_URL} from './UrlPath';

import {formatErrors, withErrors} from './ErrorObject';
import {userRequestOptions} from './DefaultRequestOptions';
import {fetchJSONWithChecks} from './FetchHelpers';

interface AppStats {
    users: number,
    measurements: number,
    devices: number,
    manufacturers: number,
    models: number,
    places: number,
    sublocations: number
}

export type AppStatsResponse = AppStats & withErrors;

export const defaultAppStatsResponse: AppStatsResponse = {
    users: -1,
    measurements: -1,
    devices: -1,
    manufacturers: -1,
    models: -1,
    places: -1,
    sublocations: -1
}


export const SHOW_APP_STATS_URL = (API_URL + '/stats/show');

function statsInfoResponseToStrongType(appStatsResponse: any): AppStatsResponse {
    console.assert(appStatsResponse.users !== undefined);
    console.assert(appStatsResponse.measurements !== undefined);
    console.assert(appStatsResponse.devices !== undefined);
    console.assert(appStatsResponse.manufacturers !== undefined);
    console.assert(appStatsResponse.models !== undefined);
    console.assert(appStatsResponse.places !== undefined);
    console.assert(appStatsResponse.sublocations !== undefined);

    console.assert(appStatsResponse.users !== null);
    console.assert(appStatsResponse.measurements !== null);
    console.assert(appStatsResponse.devices !== null);
    console.assert(appStatsResponse.manufacturers !== null);
    console.assert(appStatsResponse.models !== null);
    console.assert(appStatsResponse.places !== null);
    console.assert(appStatsResponse.sublocations !== null);

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
