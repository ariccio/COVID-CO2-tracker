// See updated (more restrictive) licensing restrictions for this subproject! Updated 02/03/2022.

//  NOTE:
//      It looks like the fetch implementation in React Native/Expo is different enough that it's likely worth managing separate code for it.
//      I will also need to handle auth manually on the frontend instead of relying on httponly cookies.
//
//      For reference, some of the relevant interesting files for the native fetch are:
//          co2_native_client\node_modules\react-native\Libraries\Network\NativeNetworkingAndroid.js
//          co2_native_client\node_modules\react-native\Libraries\TurboModule\RCTExport.js
//          co2_native_client\node_modules\react-native\Libraries\Network\RCTNetworking.android.js
//          co2_native_client\node_modules\react-native\Libraries\Network\XMLHttpRequest.js
//          co2_native_client\node_modules\whatwg-fetch\fetch.js
//          co2_native_client\node_modules\react-native\Libraries\Network\fetch.js
//          

import {formatErrors} from '../../../co2_client/src/utils/ErrorObject';

// function dumpHeaders(headers: Headers, asError: boolean): void {
//     //forEach(callbackfn: (value: string, key: string, parent: Headers) => void, thisArg?: any): void;
//     headers.forEach((value, key, parent) => {
//         if (asError) {
//             console.error(`key, value: ${key}, ${value}`);
//         }
//         else {
//             console.log(`key, value: ${key}, ${value}`)
//         }
//     })
    
//     // for (header in )
// }


export async function dumpResponse(response_: Response): Promise<void> {
    const clonedResponse = response_.clone();
    // const clonedResponseForBody = response_.clone();
    // const clonedResponseForText = response_.clone()
    // debugger;
    // dumpHeaders(clonedResponse.headers, clonedResponse.ok);
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

// TODO: maybe this can be unknown instead of any?
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
            // eslint-disable-next-line no-debugger
            debugger;
        }
        catch(innerError) {
            console.error("damnit!");
            // eslint-disable-next-line no-debugger
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

// SEE FULL fetch SPEC HERE: https://fetch.spec.whatwg.org/#http-network-fetch
// AND HERE: https://fetch.spec.whatwg.org/#fetch-method


export async function fetchFailed(awaitedResponseOriginal: Response, expectedStatus: number, alertErrors: boolean): Promise<boolean> {
    const awaitedResponseCloned = awaitedResponseOriginal.clone();


    const parsedJSONResponse = await checkJSONparsingErrors(awaitedResponseCloned);
    if ((!awaitedResponseCloned.ok) || (parsedJSONResponse.errors !== undefined) ) {
        if (parsedJSONResponse.error !== undefined) {
            console.error("maybe internal server error?");
            console.error(String(parsedJSONResponse.error));
            if (alertErrors) {
                alert(`possible internal server error ('${String(parsedJSONResponse.error)}'), automatically reported!`);
            }
            // Sentry.captureMessage(`possible internal server error in response to fetch? full response object: ${JSON.stringify(parsedJSONResponse)}`);
            // eslint-disable-next-line no-debugger
            debugger;
        }
        // debugger;
        awaitedResponseCloned.clone().text().then((awaitedResponseText) => {
            const responseText = awaitedResponseText.toString()
            if (responseText.length > 200) {
                console.error(`response has text (truncated): ${responseText.slice(0, 200)}`)
            }
            else {
                console.error(`response has text: ${responseText}`);
            }
            // if (awaitedResponseText.error !== undefined) {
            //     console.log("maybe internal server error?");
            //     debugger;
            // }
            // debugger;
        })
        //TODO: multiple expected statuses
        if (awaitedResponseCloned.status !== expectedStatus) {
            console.assert(parsedJSONResponse.errors !== undefined);
            console.error(`server returned a response (${awaitedResponseCloned.status}, ${awaitedResponseCloned.statusText}) with a status field, and it wasn't a ${expectedStatus} status.`);
        }
        if (parsedJSONResponse.error !== undefined) {
            console.error("maybe internal server error?");
            console.error(String(parsedJSONResponse.error));
            // alert("possible internal server error, automatically reported!");
            // Sentry.captureMessage(`possible internal server error in response to fetch? Full response object: ${JSON.stringify(parsedJSONResponse)}`);
            // if (alertErrors) {
            // }
            // eslint-disable-next-line no-debugger
            debugger;
        }

        if (parsedJSONResponse.errors !== undefined) {
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function fetchFilter(error: any): never {
    console.log(`filtering error ${error}`);
    console.log(`Error details (as string: '${String(error)}'), (as json stringified: '${JSON.stringify(error)}')`);
    console.log(`Typeof error: ${typeof error}`);
    if (error.toString !== undefined) {
        console.error(`error.toString !== undefined, error.toString(): ${error.toString()}`)
    }
    if (error instanceof SyntaxError) {
        console.error("JSON parsing error, likely a network error anyways.");

    }
    else if (error instanceof TypeError) {
        console.log(`TypeError message: ${error.message}`);
        console.log(`TypeError name: ${error.name}`);
        if (error.message === 'cancelled') {
            console.error("fetch itself failed, response was 'cancelled'! Probably an iOS device?");
            alert("fetch reported 'cancelled'... did you hit the 'x' to stop loading? Did you lose connection? Either way, you need to reload the whole page to continue. It's not my fault :)")
        }
        else {
            console.error("fetch itself failed, likely a network issue.");
    
            // FetchManager::Loader::Failed:
            // https://source.chromium.org/chromium/chromium/src/+/master:third_party/blink/renderer/core/fetch/fetch_manager.cc;l=261;bpv=1;bpt=1?q=%22failed%20to%20fetch%22
    
            console.error(`type error message: ${error.message}`);
            alert("fetch itself failed, are you connected? is the server running?");
        }
    }
    else if (error instanceof DOMException) {
        console.error(`fetch iself failed! Error: ${error}`);
    }
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
        // eslint-disable-next-line no-debugger
        debugger;
        throw error;
    }
}


export async function fetchJSONWithChecks(input: RequestInfo, init: RequestInit, expectedStatus: number, alert: boolean, fetchFailedCallback: (awaitedResponse: Response) => unknown, fetchSuccessCallback: (awaitedResponse: Response) => unknown): Promise<ReturnType<typeof fetchSuccessCallback> | ReturnType<typeof fetchFailedCallback>> {
    // Ok, so this monstrosity exists for a good reason, believe it or not.
    // Simply put, I haven't figured out anu other way to get the internal underlying error out of fetch requests
    // If a fetch request fails because of a network error, without this, I will usually get an error while parsing the json.
    // Something like missing token or unexpected end of input.
    // This is useless for debugging AND useless to users.
    // With this monstrosity, I can get the actual error!
    // e.g. ECONNREFUSED when the server isn't running!
    // This is great, and provides much better, well, everything.
    // Someday I'll figure out how to do this in a better, less ugly way.

    // Some of these clone()s are likely unnecessary. If you can figure out which ones, you deserve a medal. 
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
            // if (body.length > 200) {
            //     console.error(`await clonedResponseforResponseErrorMessage.text() (truncated) ${body.slice(0, 200)}`);
            // }
            // else {
            //     console.error(`await clonedResponseforResponseErrorMessage.text() ${body}`);
            // }
            
            // debugger;
            // debugger;
            
            try {
                const awaitedResponse = await awaitRawResponse(rawFetchResponse_);
                
                //WHY DOES JAVASCRIPT LET ME DO THIS WITHOUT AWAIT? Annoyed debugging.
                if (await fetchFailed(awaitedResponse.clone(), expectedStatus, alert)) {
                    // debugger;
                    // If you DO NOT clone the result and try to use it for error handling, reading it again for later use will cause it to fail by reading it twice. 
                    console.warn("failure callback must clone response if checking for errors!");
                    return fetchFailedCallback(awaitedResponse.clone())
                }
                return fetchSuccessCallback(awaitedResponse.clone());
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
            console.error("Network error OR error in fetch callback, ultimate cause: ");
            // debugger;
            console.error(catchError);
            throw new Error(catchError);
        })
    }
    catch(error) {
        console.warn(`last chance bailed?`)
        // eslint-disable-next-line no-debugger
        debugger;
        fetchFilter(error);
    }
}
