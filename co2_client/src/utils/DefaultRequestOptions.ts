export const includeCreds: RequestCredentials = "include";

export function userRequestOptions(): RequestInit {
    const requestOptions = {
        method: 'get',
        credentials: includeCreds, //for httpOnly cookie
        headers: {
            'Content-Type': 'application/json',
        },
    }
    return requestOptions;
}

export function deleteRequestOptions(): RequestInit {
    const requestOptions = {
        method: 'delete',
        credentials: includeCreds,
        headers: {
            'Content-Type': 'application/json',
        },
    }
    return requestOptions;
}

export function postRequestOptions(): RequestInit {
    const requestOptions = {
        method: 'POST',
        credentials: includeCreds, //for httpOnly cookie
        headers: {
            'Content-Type': 'application/json',
        },
    }
    return requestOptions;

}