
// from old project.
/*
function userRequestOptions(jwt: string): RequestInit {
    const requestOptions = {
        method: 'get',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${jwt}`
        },
    }
    return requestOptions;
}

interface UserInfoInternal {
    username: string,
    email: string
}

interface Score {
    level_id: string,
    score: string
}

export interface UserInfoType {
    user_info: UserInfoInternal,
    user_scores: Score[],
    errors?: any
}

function userInfoToStrongType(userInfo: any): UserInfoType {
    console.assert(userInfo !== undefined);
    if (userInfo.errors === undefined) {
        console.assert(userInfo.user_info !== undefined);
        console.assert(userInfo.user_scores !== undefined);
    }
    const return_value: UserInfoType =  {
        user_info: userInfo.user_info,
        user_scores: userInfo.user_scores,
        errors: userInfo.errors
    }
    return return_value;
}

export async function queryUserInfo(jwt: string): Promise<UserInfoType> {
    const rawResponse: Promise<Response> = fetch('/users/show', userRequestOptions(jwt));
    // console.log("body: ", (await rawResponse).body)
    const awaitedResponse = await rawResponse;
    const jsonResponse = awaitedResponse.json();
    const response = await jsonResponse;
    console.log(response);
    if (response.errors !== undefined) {
        debugger;
    }
    return userInfoToStrongType(response);
    // return response;
}
*/

//shut up --isolatedModules
export const __ignore = null;