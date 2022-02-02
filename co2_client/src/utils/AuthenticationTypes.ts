import {ErrorObjectType} from './ErrorObject';

const includeCreds: RequestCredentials = "include";

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

export interface LogoutResponse {
    errors?: Array<ErrorObjectType>
}

export function loginResponseStrongType(response: any): LoginResponse {
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