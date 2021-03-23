// import { assert } from 'console';
// import { setUsername } from '../features/login/loginSlice';
import {ErrorObjectType} from './ErrorObject';
import {API_URL} from './UrlPath';

import {fetchJSONWithChecks} from './FetchHelpers';

const LOGIN_URL = API_URL + '/auth';
// const SIGNUP_URL = API_URL + "/users";
const EMAIL_URL = API_URL + '/email';
const includeCreds: RequestCredentials = "include";

// export function loginRequestOptions(email: string, password: string): RequestInit {
//     const requestOptions = {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json'
//         },
//         credentials: includeCreds, //for httpOnly cookie
//         body: JSON.stringify({
//             user: {
//                 email: email,
//                 password
//             }
//         })
//     }
//     return requestOptions;
// }

export function get_email_options(): RequestInit {
    const requestOptions = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: includeCreds, //for httpOnly cookie
    }
    return requestOptions;
}

// export function signUpRequestOptions(email: string, password: string): RequestInit {
//     const requestOptions = {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json'
//         },
//         credentials: includeCreds, //for httpOnly cookie
//         body: JSON.stringify({
//             user: {
//                 email,
//                 password
//             }
//         })
//     }
//     return requestOptions;
// }


export function logoutRequestOptions(): RequestInit {
    const requestOptions = {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: includeCreds, //for httpOnly cookie
    }
    return requestOptions;
}

export interface LoginResponse {
    email: string,
    errors?: Array<ErrorObjectType>
    // jwt: string
}

// export interface SignupResponse {
//     email: string,
//     errors?: Array<ErrorObjectType>
// }

export interface LogoutResponse {
    errors?: Array<ErrorObjectType>
}

function loginResponseStrongType(response: any): LoginResponse {
    if (response.errors !== undefined) {
        console.assert(response.errors !== null);
        console.assert(response.email === undefined);
        return response;
    }
    if (response.email === undefined) {
        console.log("missing email in response from server");
        return response;
    }
    return response;
}

// export async function login(username: string, password: string): Promise<LoginResponse> {
//     const requestOptions: RequestInit = loginRequestOptions(username, password);
//     const fetchfailedCallback = async (awaitedResponse: Response): Promise<LoginResponse> => {
//         console.error("modified since last time I tested this. Integration testing is hard.")
//         return loginResponseStrongType(await awaitedResponse.json());
//     }
//     const fetchSuccessCallback = async (awaitedResponse: Response): Promise<LoginResponse> => {
//         return loginResponseStrongType(await awaitedResponse.json());
//     }
//     const result = fetchJSONWithChecks(LOGIN_URL, requestOptions, 202, true, fetchfailedCallback, fetchSuccessCallback ) as Promise<LoginResponse>;
//     return result;
//     // try {
//     //     const rawFetchResponse: Promise<Response> = fetch(LOGIN_URL, requestOptions);
//     //     const awaitedResponse = await rawFetchResponse;
    
//     //     // const jsonResponse: Promise<any> = awaitedResponse.json();
//     //     // const parsedJSONResponse = await jsonResponse;
//     //     // console.log(response);
//     //     // render json: { username: @user.email, jwt: token }, status: :accepted
//     //     // console.assert(parsedJSONResponse != null);
//     //     // console.assert(parsedJSONResponse !== undefined);
//     //     // console.assert(parsedJSONResponse !== "undefined");
//     //     if (fetchFailed(awaitedResponse, 202, true)) {
//     //         console.error("modified since last time I tested this. Integration testing is hard.")
//     //         return loginResponseStrongType(await awaitedResponse.json());
//     //         // return null
//     //     }
//     //     //console.assert(response.jwt !== undefined);
//     //     // console.log("Successful response from server: ", parsedJSONResponse)
//     //     // localStorage.setItem('currentUser', response.jwt);
//     //     return loginResponseStrongType(await awaitedResponse.json());
//     // }
//     // catch(error) {
//     //     fetchFilter(error);
//     // }
// }


export async function get_email(): Promise<LoginResponse | null> {
    const requestOptions: RequestInit = get_email_options();
    const fetchFailedCallback = async (awaitedResponse: Response): Promise<LoginResponse | null> => {
        if (awaitedResponse.status === 401) {
            console.warn("no cookie, user not logged in!");
            return null
        }
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
    // try {
    //     const rawFetchResponse: Promise<Response> = fetch(EMAIL_URL, requestOptions);
    //     const rawResponseForErrors = (await rawFetchResponse).clone();
    //     const rawResponseForErrorsMessage = (await rawFetchResponse).clone();

    //     //This can throw here?
    //     // const awaitedResponse = await rawFetchResponse;
    //     try {
    //         const awaitedResponse = await awaitRawResponse(rawFetchResponse);
    //         // https://stackoverflow.com/questions/4467044/proper-way-to-catch-exception-from-json-parse
    //         console.log("TODO: should I be properly catching this?")
    //         // console.log(await rawFetchResponse);
    //         // const resp = await rawFetchResponse;
    //         // console.log((await rawFetchResponse.status));
    //         // const resp = await awaitedResponse;
    //         // // const respText = await resp.text();
    //         // // console.log(resp);
    //         // // console.log(respText);
    //         // // debugger;
    //         // const jsonResponse: Promise<any> = awaitedResponse.clone().json();
    //         // const parsedJSONResponse = await jsonResponse;
    //         if(fetchFailed(awaitedResponse, 200, true)) {
    //             if (awaitedResponse.status === 401) {
    //                 console.warn("no cookie, user not logged in!");
    //                 return null
    //             }
    //             return loginResponseStrongType(await awaitedResponse.json());
    //         }
    //         console.log("TODO: to strong type check for undefined");
    //         // console.assert((parsedJSONResponse as LoginResponse).email !== undefined);
    //         // console.log("got initial username/email from server:", parsedJSONResponse.email);
    //         return loginResponseStrongType(await awaitedResponse.json());
    //     }
    //     catch (awaitError) {
    //         console.log(awaitError);
    //         console.log(await (rawResponseForErrors.text()));
    //         // rawResponseForErrorsMessage.
    //         dumpResponse(rawResponseForErrorsMessage);

    //         // debugger;
            
    //     }
    //     //TODO: for debugging?
    //     return null;
    // }
    // catch(error) {
    //     debugger;
    //     fetchFilter(error);
    // }
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
    // try {
    //     const rawFetchResponse: Promise<Response> = fetch(LOGIN_URL, logoutRequestOptions());
    //     const awaitedResponse = await rawFetchResponse;
    //     // const jsonResponse: Promise<any> = awaitedResponse.json();
    //     // const parsedJSONResponse = await jsonResponse;
    //     if (fetchFailed(awaitedResponse, 200, true)) {
    //         console.log("Logged out successfully, but request returned a failed response?")
    //     }
    //     // debugger;
    //     console.log("TODO: to strong type check for undefined");
    //     return await awaitedResponse.json();
    // }
    // catch(error) {
    //     fetchFilter(error);
    // }
}


// export async function signup(email: string, password: string): Promise<SignupResponse> {
//     const fetchCallback = async (awaitedResponse: Response): Promise<SignupResponse> => {
//         return await awaitedResponse.json();
//     }

//     const requestOptions: RequestInit = signUpRequestOptions(email, password);

//     const result = fetchJSONWithChecks(SIGNUP_URL, requestOptions, 201, true, fetchCallback, fetchCallback) as Promise<SignupResponse>;
//     return result;
//     // try {
//     //     const rawFetchResponse: Promise<Response> = fetch(SIGNUP_URL, requestOptions);
//     //     const awaitedResponse = await rawFetchResponse;
//     //     // const jsonResponse: Promise<any> = awaitedResponse.json();
//     //     // const parsedJSONResponse = await jsonResponse;
//     //     // render json: { jwt: token }, status: :created
//     //     if (fetchFailed(awaitedResponse, 201, true)) {
//     //         debugger;
//     //         // return response;
//     //         return await awaitedResponse.json();
//     //     }
//     //     // console.assert(parsedJSONResponse.errors === undefined);
//     //     console.assert(awaitedResponse.status === 201);
//     //     // localStorage.setItem('currentUser', response.jwt);
//     //     // console.log("Successful response from server: ", parsedJSONResponse)
//     //     return await awaitedResponse.json();
//     // }
//     // catch(error) {
//     //     fetchFilter(error);
//     // }
// }
