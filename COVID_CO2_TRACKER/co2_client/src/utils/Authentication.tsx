// import { assert } from 'console';
// import { setUsername } from '../features/login/loginSlice';
import {formatErrors, ErrorObjectType} from './ErrorObject';
import {API_URL} from './UrlPath';

import {fetchFailed, fetchFilter} from './FetchHelpers';

const LOGIN_URL = API_URL + '/auth';
const SIGNUP_URL = API_URL + "/users";
const EMAIL_URL = API_URL + '/email';
const includeCreds: RequestCredentials = "include";

export function loginRequestOptions(email: string, password: string): RequestInit {
    const requestOptions = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: includeCreds, //for httpOnly cookie
        body: JSON.stringify({
            user: {
                email: email,
                password
            }
        })
    }
    return requestOptions;
}

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

export function signUpRequestOptions(email: string, password: string): RequestInit {
    const requestOptions = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: includeCreds, //for httpOnly cookie
        body: JSON.stringify({
            user: {
                email,
                password
            }
        })
    }
    return requestOptions;
}


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


// Very helpful:
// https://jasonwatmore.com/post/2019/04/06/react-jwt-authentication-tutorial-example#authentication-service-js
// Return String is jwt token 
export function fromLocalStorage(): string {
    const item: string | null = localStorage.getItem('currentUser');
    if ((item === null) || (item === undefined) || (item === "undefined")) {
        console.log('No cached login credentials.');
        return '';
    }
    return item;
}

export function clearLocalStorage(): void {
    // https://developer.mozilla.org/en-US/docs/Web/API/Storage/clear
    localStorage.clear();
}

export interface LoginResponse {
    email: string,
    errors?: Array<ErrorObjectType>
    // jwt: string
}

export interface SignupResponse {
    email: string,
    errors?: Array<ErrorObjectType>
}

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

export async function login(username: string, password: string): Promise<LoginResponse> {
    const requestOptions: RequestInit = loginRequestOptions(username, password);
    try {
        const rawFetchResponse: Promise<Response> = fetch(LOGIN_URL, requestOptions);
        const awaitedResponse = await rawFetchResponse;
    
        const jsonResponse: Promise<any> = awaitedResponse.json();
        const response = await jsonResponse;
        // console.log(response);
        // render json: { username: @user.email, jwt: token }, status: :accepted
        console.assert(response != null);
        console.assert(response !== undefined);
        console.assert(response !== "undefined");
        if (fetchFailed(awaitedResponse, response, 202, true)) {
            console.error("modified since last time I tested this. Integration testing is hard.")
            return loginResponseStrongType(response);
            // return null
        }
        //console.assert(response.jwt !== undefined);
        console.log("Successful response from server: ", response)
        // localStorage.setItem('currentUser', response.jwt);
        return loginResponseStrongType(response);
    }
    catch(error) {
        fetchFilter(error);
    }
}

export async function get_email(): Promise<LoginResponse | null> {
    const requestOptions: RequestInit = get_email_options();
    try {
        const rawFetchResponse: Promise<Response> = fetch(EMAIL_URL, requestOptions);
        const awaitedResponse = await rawFetchResponse;
        // https://stackoverflow.com/questions/4467044/proper-way-to-catch-exception-from-json-parse
        console.log("TODO: should I be properly catching this?")
        // console.log(await rawFetchResponse);
        // const resp = await rawFetchResponse;
        // console.log((await rawFetchResponse.status));
        const jsonResponse: Promise<any> = awaitedResponse.json();
        const response = await jsonResponse;
        if(fetchFailed(awaitedResponse, response, 200, true)) {
            if (awaitedResponse.status === 401) {
                console.warn("no cookie, user not logged in!");
                return null
            }
            return loginResponseStrongType(response);
        }
        console.log("TODO: to strong type check for undefined");
        console.assert((response as LoginResponse).email !== undefined);
        console.log("got initial username/email from server:", response.email);
        return loginResponseStrongType(response);
    }
    catch(error) {
        fetchFilter(error);
    }
}

export async function logout(): Promise<LogoutResponse> {
    try {
        const rawFetchResponse: Promise<Response> = fetch(LOGIN_URL, logoutRequestOptions());
        const awaitedResponse = await rawFetchResponse;
        const jsonResponse: Promise<any> = awaitedResponse.json();
        const response = await jsonResponse;
        if (fetchFailed(awaitedResponse, response, 200, true)) {
            console.log("Logged out successfully, but request returned a failed response?")
        }
        // debugger;
        console.log("TODO: to strong type check for undefined");
        return response;
    }
    catch(error) {
        fetchFilter(error);
    }
}


export async function signup(email: string, password: string): Promise<SignupResponse> {
    const requestOptions: RequestInit = signUpRequestOptions(email, password);
    try {
        const rawFetchResponse: Promise<Response> = fetch(SIGNUP_URL, requestOptions);
        const awaitedResponse = await rawFetchResponse;
        const jsonResponse: Promise<any> = awaitedResponse.json();
        const response = await jsonResponse;
        // render json: { jwt: token }, status: :created
        if (fetchFailed(awaitedResponse, response, 201, true)) {
            debugger;
            // return response;
            return response;
        }
        console.assert(response.errors === undefined);
        console.assert(awaitedResponse.status === 201);
        // localStorage.setItem('currentUser', response.jwt);
        console.log("Successful response from server: ", response)
        return response;
    }
    catch(error) {
        fetchFilter(error);
    }
}
