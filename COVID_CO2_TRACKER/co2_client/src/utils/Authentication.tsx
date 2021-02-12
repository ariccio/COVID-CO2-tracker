import {formatErrors, ErrorObjectType} from './ErrorObject';
import {API_URL} from './UrlPath';
// NOTE: YES I KNOW JWT IS VULNERABLE TO XSS.
// But Flatiron taught us this way before I knew about httponly, and now I don't want to rewrite this. 


const LOGIN_URL = API_URL + '/login';
const SIGNUP_URL = API_URL + "/users";
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
    error?: ErrorObjectType
    // jwt: string
}

export interface SignupResponse {
    // jwt: string;,
    error?: ErrorObjectType
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
    const jsonResponse: Promise<any> = (await rawFetchResponse).json();
    const response = await jsonResponse;
    // console.log(response);
    // render json: { username: @user.email, jwt: token }, status: :accepted
    console.assert(response != null);
    console.assert(response !== undefined);
    console.assert(response !== "undefined");
    if (response.status !== undefined) {
        if (response.status !== 200) {
            console.log("server returned a response with a status field, and it wasn't a 200 (OK) status.");
            console.log(response);
            debugger;
            throw new Error("hmm");
        }
    }
    if (response.errors === undefined) {
        //console.assert(response.jwt !== undefined);
        console.log("Successful response from server: ", response)
        // localStorage.setItem('currentUser', response.jwt);
        console.log("tbd");
        debugger;
        return loginResponseStrongType(response);
    }
    console.error(formatErrors(response.errors));
    alert(formatErrors(response.errors));
    return null;
}

export async function signup(email: string, password: string): Promise<SignupResponse | null> {
    const requestOptions: RequestInit = signUpRequestOptions(email, password);
    const rawFetchResponse: Promise<Response> = fetch(SIGNUP_URL, requestOptions);
    const jsonResponse: Promise<any> = (await rawFetchResponse).json();
    const response = await jsonResponse;
    // render json: { jwt: token }, status: :created
    console.assert(response != null);
    console.assert(response !== undefined);
    console.assert(response !== "undefined");
    if (response.status !== undefined) {
        if (response.status !== 201) {
            console.log("server returned a response with a status field, and it wasn't a 201 (Created) status.");
            console.log(response);
            debugger;
            throw new Error("hmm");
        }
    }
    if (response.errors === undefined) {
        // localStorage.setItem('currentUser', response.jwt);
        console.log("Successful response from server: ", response)
        console.log("tbd");
        debugger;
        return response;
    }
    console.error(formatErrors(response.errors));
    // localStorage.setItem('currentUser', '');
    alert(formatErrors(response.errors))
    return null
}
