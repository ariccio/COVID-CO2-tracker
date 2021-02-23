// import { assert } from 'console';
// import { setUsername } from '../features/login/loginSlice';
import {formatErrors, ErrorObjectType} from './ErrorObject';
import {API_URL} from './UrlPath';
// NOTE: YES I KNOW JWT IS VULNERABLE TO XSS.
// But Flatiron taught us this way before I knew about httponly, and now I don't want to rewrite this. 


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
    if (response.email === undefined) {
        console.log("missing email in response from server");
        debugger;
        return response;
    }
    return response;
}

export async function login(username: string, password: string): Promise<LoginResponse | null> {
    const requestOptions: RequestInit = loginRequestOptions(username, password);
    const rawFetchResponse: Promise<Response> = fetch(LOGIN_URL, requestOptions);
    const awaitedResponse = await rawFetchResponse;

    const jsonResponse: Promise<any> = awaitedResponse.json();
    const response = await jsonResponse;
    // console.log(response);
    // render json: { username: @user.email, jwt: token }, status: :accepted
    console.assert(response != null);
    console.assert(response !== undefined);
    console.assert(response !== "undefined");
    if ((response.errors !== undefined) || (awaitedResponse.status !== 200)) {
        console.log("modified since last time I tested this. Integration testing is hard.")
        if (awaitedResponse.status !== 200) {
            console.warn(`server returned a response with a status field (${awaitedResponse.status}), and it wasn't a 200 (OK) status.`);
            // console.log(response);
            // alert(response);
        }
        if (response.errors !== undefined) {
            console.error(formatErrors(response.errors));
            alert(formatErrors(response.errors));        
        }
        debugger;
        throw new Error("hmm");
    }
    if (response.errors === undefined) {
        //console.assert(response.jwt !== undefined);
        console.log("Successful response from server: ", response)
        // localStorage.setItem('currentUser', response.jwt);
        const responseAsType = loginResponseStrongType(response);
        return responseAsType;
    }
    return null;
}

export async function get_email(): Promise<LoginResponse> {
    const requestOptions: RequestInit = get_email_options();
    const rawFetchResponse: Promise<Response> = fetch(EMAIL_URL, requestOptions);
    const awaitedResponse = await rawFetchResponse;
    // https://stackoverflow.com/questions/4467044/proper-way-to-catch-exception-from-json-parse
    console.log("TODO: should I be properly catching this?")
    console.log(await rawFetchResponse);
    // const resp = await rawFetchResponse;
    // console.log((await rawFetchResponse.status));
    const jsonResponse: Promise<any> = awaitedResponse.json();
    const response = await jsonResponse;
    if ((response.errors !== undefined) || (awaitedResponse.status !== 200)) {
        if (awaitedResponse.status !== 200) {
            console.warn(`server returned a response with a status field (${awaitedResponse.status}), and it wasn't a 200 (OK) status.`);
            debugger;
        }
        console.error(formatErrors(response.errors));
        alert(formatErrors(response.errors));
        return response;
    }
    console.log("TODO: to strong type check for undefined");
    console.assert((response as LoginResponse).email !== undefined);
    console.log("got initial username/email from server:", response.email);
    return response;
}

export async function logout(): Promise<LogoutResponse> {
    const requestOptions: RequestInit = logoutRequestOptions();
    const rawFetchResponse: Promise<Response> = fetch(LOGIN_URL, requestOptions);
    const awaitedResponse = await rawFetchResponse;
    const jsonResponse: Promise<any> = awaitedResponse.json();
    const response = await jsonResponse;
    if (response.errors !== undefined) {
        console.log("Logged out successfully?")
        console.error(formatErrors(response.errors));
        alert(formatErrors(response.errors));    
        if (awaitedResponse.status === 200) {
            throw new Error("confused state.")
        }
        // setUsername('');
        return response;
    }
    // debugger;
    console.log("TODO: to strong type check for undefined");
    return response;
}


export async function signup(email: string, password: string): Promise<SignupResponse | null> {
    const requestOptions: RequestInit = signUpRequestOptions(email, password);
    const rawFetchResponse: Promise<Response> = fetch(SIGNUP_URL, requestOptions);
    const awaitedResponse = await rawFetchResponse;
    const jsonResponse: Promise<any> = awaitedResponse.json();
    const response = await jsonResponse;
    // render json: { jwt: token }, status: :created
    console.assert(response != null);
    console.assert(response !== undefined);
    console.assert(response !== "undefined");
    if (awaitedResponse.status !== undefined) {
        if (awaitedResponse.status !== 201) {
            console.log(`server returned a response with a status field (${awaitedResponse.status}), and it wasn't a 201 (Created) status.`);
            console.log(response);
            // throw new Error("hmm");
        }
    }
    if (response.errors === undefined) {
        console.assert(awaitedResponse.status === 201);
        // localStorage.setItem('currentUser', response.jwt);
        console.log("Successful response from server: ", response)
        return response;
    }
    console.error(formatErrors(response.errors));
    // localStorage.setItem('currentUser', '');
    alert(formatErrors(response.errors));
    debugger;
    return response;
}
