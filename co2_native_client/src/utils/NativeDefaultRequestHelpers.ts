// See updated (more restrictive) licensing restrictions for this subproject! Updated 02/03/2022.

export function withAuthorizationHeader(jwt: string) {
    return {
        Authorization: `Bearer ${jwt}`
    };
}
