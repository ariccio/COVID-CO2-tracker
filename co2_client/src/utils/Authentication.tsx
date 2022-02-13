import {LOGIN_URL, EMAIL_URL} from './UrlPath';
import {LoginResponse, loginResponseStrongType, LogoutResponse, get_email_options, logoutRequestOptions} from './AuthenticationTypes';

import {fetchJSONWithChecks} from './FetchHelpers';





export async function get_email(): Promise<LoginResponse | null> {
    const requestOptions: RequestInit = get_email_options();
    const fetchFailedCallback = async (awaitedResponse: Response): Promise<LoginResponse | null> => {
        if (awaitedResponse.status === 401) {
            console.warn("no cookie, user not logged in!");
            return null
        }
        console.log("Email fetch failed.");
        return loginResponseStrongType(await (awaitedResponse.json()));
    }
    const fetchSuccessCallback = async (awaitedResponse: Response): Promise<LoginResponse | null> => {
        console.log("TODO: to strong type check for undefined");
        // console.assert((parsedJSONResponse as LoginResponse).email !== undefined);
        // console.log("got initial username/email from server:", parsedJSONResponse.email);
        return loginResponseStrongType(await awaitedResponse.json());

    }

    const result = fetchJSONWithChecks(EMAIL_URL, requestOptions, 200, false, fetchFailedCallback, fetchSuccessCallback) as Promise<ReturnType<typeof fetchSuccessCallback> | ReturnType<typeof fetchFailedCallback>>;
    return result;
}

export async function logout(): Promise<LogoutResponse> {
    const fetchFailedCallback = async (awaitedResponse: Response): Promise<LogoutResponse> => {
        console.log("Logged out successfully, but request returned a failed response?");
        console.log("TODO: to strong type check for undefined");
        return await awaitedResponse.json();
    }
    const fetchSuccessCallback = async (awaitedResponse: Response): Promise<LogoutResponse> => {
        console.log("TODO: to strong type check for undefined");
        return await awaitedResponse.json();
    }

    const result = fetchJSONWithChecks(LOGIN_URL, logoutRequestOptions(), 200, true, fetchFailedCallback, fetchSuccessCallback) as Promise<LogoutResponse>;
    return result;
}


