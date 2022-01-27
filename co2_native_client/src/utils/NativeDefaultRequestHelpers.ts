
export function withAuthorizationHeader(jwt: string) {
    return {
        Authorization: `Bearer ${jwt}`
    };
}
