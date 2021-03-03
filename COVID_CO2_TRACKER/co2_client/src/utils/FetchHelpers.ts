import {formatErrors} from './ErrorObject';

function dumpHeaders(headers: Headers, asError: boolean): void {
    //forEach(callbackfn: (value: string, key: string, parent: Headers) => void, thisArg?: any): void;
    headers.forEach((value, key, parent) => {
        if (asError) {
            console.error(`key, value: ${key}, ${value}`);
        }
        else {
            console.log(`key, value: ${key}, ${value}`)
        }
    })
    
    // for (header in )
}


export async function dumpResponse(response_: Response): Promise<void> {
    const clonedResponse = response_.clone();
    // const clonedResponseForBody = response_.clone();
    // const clonedResponseForText = response_.clone()
    // debugger;
    dumpHeaders(clonedResponse.headers, clonedResponse.ok);
    if (clonedResponse.ok) {
        console.log(`clonedResponse.redirected: ${clonedResponse.redirected}`);
        console.log(`clonedResponse.status: ${clonedResponse.status}`);
        console.log(`clonedResponse.statusText: ${clonedResponse.statusText}`);
        console.log(`clonedResponse.url: ${clonedResponse.url}`);
    }
    else {
        console.error("dumping response...");
        console.error(`clonedResponse.redirected: ${clonedResponse.redirected}`);
        console.error(`clonedResponse.status: ${clonedResponse.status}`);
        console.error(`clonedResponse.statusText: ${clonedResponse.statusText}`);
        console.error(`clonedResponse.url: ${clonedResponse.url}`);
    }
}

async function checkJSONparsingErrors(awaitedResponseOriginal: Response): Promise<any> {
    const clonedResponseForErrorChecks = awaitedResponseOriginal.clone();
    const clonedResponseForErrorMessage = awaitedResponseOriginal.clone();
    // const clonedResponseforResponseErrorMessage = awaitedResponseOriginal.clone();
// debugger;
    try {
        // const awaitedClonedResponse = await clonedResponseForErrorChecks;
        // const awaitedForBody = clonedResponseForErrorChecks.clone();
        const parsedJSONResponse = await clonedResponseForErrorChecks.json()
        return parsedJSONResponse;
    }
    catch(error) {
        // debugger;
        console.error("bailed checkJSONparsingErrors")
        try {
            
        }
        catch(innerError) {
            console.error("damnit!");
            debugger;
        }
        if (error instanceof SyntaxError) {
            console.error("JSON parsing error, likely a network error anyways.");
            console.error(`Error string: ${error.toString()}`);
            dumpResponse(clonedResponseForErrorMessage);
            console.log("dumped response");
            // debugger;
        }
        else {
            console.error(error);
            dumpResponse(clonedResponseForErrorMessage);
            // debugger;
        }
        // debugger;
        throw error;
    }
}

//SEE FULL fetch SPEC HERE: https://fetch.spec.whatwg.org/#http-network-fetch
//AND HERE: https://fetch.spec.whatwg.org/#fetch-method

export async function fetchFailed(awaitedResponseOriginal: Response, expectedStatus: number, alertErrors: boolean): Promise<boolean> {
    const awaitedResponseCloned = awaitedResponseOriginal.clone();


    const parsedJSONResponse = await checkJSONparsingErrors(awaitedResponseCloned);
    if ((!awaitedResponseCloned.ok) || (parsedJSONResponse.errors !== undefined) ) {
        // debugger;
        awaitedResponseCloned.text().then((awaitedResponseText) => {
            console.error(`response has text: ${awaitedResponseText}`);
            debugger;
        })
        if (awaitedResponseCloned.status !== expectedStatus) {
            console.assert(parsedJSONResponse.errors !== undefined);
            console.error(`server returned a response (${awaitedResponseCloned.status}, ${awaitedResponseCloned.statusText}) with a status field, and it wasn't a ${expectedStatus} status.`);
        }
        if (parsedJSONResponse.errors !== undefined) {
            // console.assert(awaitedResponseCloned.status !== 200);
            console.error(formatErrors(parsedJSONResponse.errors));
            if(alertErrors) {
                alert(formatErrors(parsedJSONResponse.errors));
            }
        }
        // debugger;
        return true;
        // return null;
    }
    // debugger;
    return false;
}

export function fetchFilter(error: any): never {
    console.log(`filtering error ${error}`)
    if (error.toString !== undefined) {
        console.error(error.toString())
    }
    if (error instanceof SyntaxError) {
        console.error("JSON parsing error, likely a network error anyways.");

    }
    else if (error instanceof TypeError) {
        console.error("fetch itself failed, likely a network issue.");
        alert("fetch itself failed, are you connected? is the server running? Did you manually interrupt it with a refresh?");
    }
    else if (error instanceof DOMException)
    console.error(`fetch iself failed! Error: ${error}`);
    throw error;
}

async function awaitRawResponse(rawFetchResponse: Promise<Response>): Promise<Response> {
    try {
        const awaitedResponse = await rawFetchResponse;
        return awaitedResponse;
    }
    catch (error) {
        console.warn(`caught awaiting raw response!`);
        console.warn(error);
        debugger;
        throw error;
    }
}


export async function fetchJSONWithChecks(input: RequestInfo, init: RequestInit, expectedStatus: number, alert: boolean, fetchFailedCallback: (awaitedResponse: Response) => unknown, fetchSuccessCallback: (awaitedResponse: Response) => unknown): Promise<ReturnType<typeof fetchSuccessCallback> | ReturnType<typeof fetchFailedCallback>> {
    try {
        const rawFetchResponse_: Promise<Response> = fetch(input, init);
        // const rawFetchResponse = (await rawFetchResponse_).clone();
        const rawResponseForErrors = (await rawFetchResponse_).clone();
        const rawResponseForErrorsMessage = (await rawFetchResponse_).clone();
        // const clonedResponseforResponseErrorMessage = (await rawFetchResponse_).clone();
        return rawFetchResponse_.then(resp => resp.clone()).then().then(resp => resp.text()).then(async (body) => {
            try {
                const throwaway = JSON.parse(body);
                if (throwaway === undefined) {
                    console.error("what?");
                }
                // debugger;
            }
            catch {
                // debugger;
                //throw original ultimate error
                throw Error(body);
            }
            // debugger;
            console.error(`await clonedResponseforResponseErrorMessage.text() ${body}`);
            // debugger;
            // debugger;
            
            try {
                const awaitedResponse = await awaitRawResponse(rawFetchResponse_);

                //WHY DOES JAVASCRIPT LET ME DO THIS WITHOUT AWAIT? Annoyed debugging.
                if (await fetchFailed(awaitedResponse, expectedStatus, alert)) {
                    // debugger;
                    return fetchFailedCallback(awaitedResponse)
                }
                return fetchSuccessCallback(awaitedResponse);
                // debugger;
            }
            catch(awaitError) {
                console.warn(`bailed here`)
                console.log(awaitError);
                console.log(await (rawResponseForErrors.text()));
                // rawResponseForErrorsMessage.
                dumpResponse(rawResponseForErrorsMessage);
                // debugger;
                throw new Error(`Error during fetch, network layer: ${rawResponseForErrorsMessage.text()}, lower level error: ${awaitError}`);
            }
        }).catch((catchError) => {
            //YESS
            console.error("Ultimate cause of network error: ");
            // debugger;
            console.error(catchError);
            throw new Error(catchError);
        })
    }
    catch(error) {
        console.warn(`last chance bailed?`)
        debugger;
        fetchFilter(error);
    }
}
