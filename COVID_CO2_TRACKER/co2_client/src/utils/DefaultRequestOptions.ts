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
