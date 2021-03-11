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

// SEE FULL fetch SPEC HERE: https://fetch.spec.whatwg.org/#http-network-fetch
// AND HERE: https://fetch.spec.whatwg.org/#fetch-method

// Chrome can create many kinds of network errors while executing a fetch. Chrome explicitly throws these:
//  https://source.chromium.org/chromium/chromium/src/+/master:third_party/blink/renderer/core/fetch/fetch_manager.cc;drc=565fcbece543b05e304bc2b8d8fdc24b00ac16d7;bpv=1;bpt=1;l=655
//  "Fetch API cannot load " ... ". URL scheme \"" ... "\" is not supported."
//
//  https://source.chromium.org/chromium/chromium/src/+/master:third_party/blink/renderer/core/fetch/fetch_manager.cc;drc=565fcbece543b05e304bc2b8d8fdc24b00ac16d7;l=224
//  "Unknown error occurred while trying to verify integrity."
//
//  https://source.chromium.org/chromium/chromium/src/+/master:third_party/blink/renderer/core/fetch/fetch_manager.cc;l=535;drc=565fcbece543b05e304bc2b8d8fdc24b00ac16d7
//  "Refused to connect to '" ... "' because it violates the document's Content Security Policy."
//
//  https://source.chromium.org/chromium/chromium/src/+/master:third_party/blink/renderer/core/fetch/fetch_manager.cc;l=560;drc=565fcbece543b05e304bc2b8d8fdc24b00ac16d7
//  "Fetch API cannot load " ... ". Request mode is \"same-origin\" but the URL\'s " ... "origin is not same as the request origin "
//
//  https://source.chromium.org/chromium/chromium/src/+/master:third_party/blink/renderer/core/fetch/fetch_manager.cc;l=573;drc=565fcbece543b05e304bc2b8d8fdc24b00ac16d7
//  "Fetch API cannot load " ... ". Request mode is \"no-cors\" but the redirect mode " ... "is not \"follow\"."
//
//  https://source.chromium.org/chromium/chromium/src/+/master:third_party/blink/renderer/core/fetch/fetch_manager.cc;l=595;drc=565fcbece543b05e304bc2b8d8fdc24b00ac16d7
//  "Fetch API cannot load " ... ". URL scheme must be \"http\" or \"https\" for CORS request."
//
//  https://source.chromium.org/chromium/chromium/src/+/master:third_party/blink/renderer/core/fetch/fetch_manager.cc;l=655;drc=565fcbece543b05e304bc2b8d8fdc24b00ac16d7
//  "Fetch API cannot load " ... ". URL scheme \"" ... "\" is not supported."
//
//  https://source.chromium.org/chromium/chromium/src/+/master:third_party/blink/renderer/core/fetch/fetch_manager.cc;l=573;drc=565fcbece543b05e304bc2b8d8fdc24b00ac16d7
//  "Fetch API cannot load " ... ". Request mode is \"no-cors\" but the redirect mode " ... "is not \"follow\"."
//
//  https://source.chromium.org/chromium/chromium/src/+/master:third_party/blink/renderer/core/fetch/fetch_manager.cc;l=655;drc=565fcbece543b05e304bc2b8d8fdc24b00ac16d7
//  "Fetch API cannot load " ... ". URL scheme \"" ..."\" is not supported."
//
//  https://source.chromium.org/chromium/chromium/src/+/master:third_party/blink/renderer/core/fetch/trust_token_to_mojom.cc;l=110;drc=565fcbece543b05e304bc2b8d8fdc24b00ac16d7
//  "Redemption operation aborted due to Signed Redemption Record " ... "cache hit"
//  DOMExceptionCode::kNoModificationAllowedError
//
//  https://source.chromium.org/chromium/chromium/src/+/master:third_party/blink/renderer/core/fetch/trust_token_to_mojom.cc;l=117;drc=565fcbece543b05e304bc2b8d8fdc24b00ac16d7
//  "Trust Tokens operation satisfied locally, without needing to send " ... "the request to its initial destination"
//  DOMExceptionCode::kNoModificationAllowedError
//
//  https://source.chromium.org/chromium/chromium/src/+/master:third_party/blink/renderer/core/fetch/trust_token_to_mojom.cc;l=123;drc=565fcbece543b05e304bc2b8d8fdc24b00ac16d7
//  "Precondition failed during Trust Tokens operation"
//  DOMExceptionCode::kInvalidStateError
//
//  https://source.chromium.org/chromium/chromium/src/+/master:third_party/blink/renderer/core/fetch/trust_token_to_mojom.cc;l=127;drc=565fcbece543b05e304bc2b8d8fdc24b00ac16d7
//  "Error executing Trust Tokens operation"
//  DOMExceptionCode::kOperationError
//
//  https://source.chromium.org/chromium/chromium/src/+/master:third_party/blink/renderer/core/fetch/body.cc;l=47;bpv=1;bpt=1?q=%22failed%20to%20fetch%22&start=11
//  "Failed to fetch"
//
//  https://source.chromium.org/chromium/chromium/src/+/master:third_party/blink/renderer/core/streams/readable_byte_stream_controller.cc;l=1054?q=CreateTypeError&ss=chromium%2Fchromium%2Fsrc
//  "close requested
//
//  https://source.chromium.org/chromium/chromium/src/+/master:third_party/blink/renderer/core/fetch/body_stream_buffer.cc;l=428?q=CreateTypeError&ss=chromium%2Fchromium%2Fsrc&start=11
//  "network error"
//
//  https://source.chromium.org/chromium/chromium/src/+/master:third_party/blink/renderer/core/fetch/body.cc;l=291?q=CreateTypeError&ss=chromium%2Fchromium%2Fsrc&start=11
//  "Invalid MIME type"
//
//  quic
//  https://source.chromium.org/chromium/chromium/src/+/master:third_party/blink/renderer/modules/webtransport/quic_transport.cc;l=513?q=CreateTypeError&ss=chromium%2Fchromium%2Fsrc&start=21
//  "Connection closed."
//
//  https://source.chromium.org/chromium/chromium/src/+/master:third_party/blink/renderer/modules/webtransport/quic_transport.cc;l=397?q=CreateTypeError&ss=chromium%2Fchromium%2Fsrc&start=21
//  "No connection."
//
//  https://source.chromium.org/chromium/chromium/src/+/master:third_party/blink/renderer/modules/webtransport/quic_transport.cc;l=555?q=CreateTypeError&ss=chromium%2Fchromium%2Fsrc&start=21
//  "Connection lost."
//
//  https://source.chromium.org/chromium/chromium/src/+/master:third_party/blink/renderer/modules/webtransport/quic_transport.cc;l=656?q=CreateTypeError&ss=chromium%2Fchromium%2Fsrc&start=21
//  "The URL '" ... "' is invalid."
//
//  https://source.chromium.org/chromium/chromium/src/+/master:third_party/blink/renderer/modules/webtransport/quic_transport.cc;l=661?q=CreateTypeError&ss=chromium%2Fchromium%2Fsrc&start=21
//  "The URL's scheme must be 'quic-transport'. '" ... "' is not allowed."
//
//  https://source.chromium.org/chromium/chromium/src/+/master:third_party/blink/renderer/modules/webtransport/quic_transport.cc;l=672?q=CreateTypeError&ss=chromium%2Fchromium%2Fsrc&start=21
//  "The URL contains a fragment identifier ('#" ... "'). Fragment identifiers are not allowed in QuicTransport URLs."
//
//  https://source.chromium.org/chromium/chromium/src/+/master:third_party/blink/renderer/modules/webtransport/quic_transport.cc;l=690?q=CreateTypeError&ss=chromium%2Fchromium%2Fsrc&start=21
//  "Failed to connect to '" ... "Refused to connect to '" ... "' because it violates the document's Content Security Policy"
//
//  https://source.chromium.org/chromium/chromium/src/+/master:third_party/blink/renderer/modules/webtransport/quic_transport.cc;l=799?q=CreateTypeError&ss=chromium%2Fchromium%2Fsrc&start=21
//  "Connection lost."
//
//  https://source.chromium.org/chromium/chromium/src/+/master:third_party/blink/renderer/modules/webtransport/quic_transport.cc;l=818?q=CreateTypeError&ss=chromium%2Fchromium%2Fsrc&start=21
//  "Connection lost."
//
//  https://source.chromium.org/chromium/chromium/src/+/master:third_party/blink/renderer/modules/webtransport/quic_transport.cc;l=843?q=CreateTypeError&ss=chromium%2Fchromium%2Fsrc&start=21
//  "Failed to create send stream."
//
//  https://source.chromium.org/chromium/chromium/src/+/master:third_party/blink/renderer/modules/webtransport/quic_transport.cc;l=881?q=CreateTypeError&ss=chromium%2Fchromium%2Fsrc&start=21
//  "Failed to create bidirectional stream."
//
// ...background fetch manager... (who cares) https://source.chromium.org/chromium/chromium/src/+/master:third_party/blink/renderer/modules/background_fetch/background_fetch_manager.cc;l=319?q=CreateTypeError&ss=chromium%2Fchromium%2Fsrc&start=21
//
// .json() or reading from body can fail a few ways:
//  CreateSyntaxError
//  https://source.chromium.org/chromium/chromium/src/+/master:third_party/blink/renderer/core/fetch/body.cc;l=320;bpv=0;bpt=1
//  "Unexpected end of input"
//
//  Locked
//  https://source.chromium.org/chromium/chromium/src/+/master:third_party/blink/renderer/core/fetch/body.cc;l=391;bpv=0;bpt=1
//  "body stream is locked"
//
//  already used
//  https://source.chromium.org/chromium/chromium/src/+/master:third_party/blink/renderer/core/fetch/body.cc;l=395;bpv=0;bpt=1
//  "body stream already read"
//

export async function fetchFailed(awaitedResponseOriginal: Response, expectedStatus: number, alertErrors: boolean): Promise<boolean> {
    const awaitedResponseCloned = awaitedResponseOriginal.clone();


    const parsedJSONResponse = await checkJSONparsingErrors(awaitedResponseCloned);
    if ((!awaitedResponseCloned.ok) || (parsedJSONResponse.errors !== undefined) ) {
        if (parsedJSONResponse.error !== undefined) {
            console.log("maybe internal server error?");
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
            console.log("maybe internal server error?");
            debugger;
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

        // FetchManager::Loader::Failed:
        // https://source.chromium.org/chromium/chromium/src/+/master:third_party/blink/renderer/core/fetch/fetch_manager.cc;l=261;bpv=1;bpt=1?q=%22failed%20to%20fetch%22

        console.error(`type error message: ${error.message}`);
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
        debugger;
        console.warn(`caught awaiting raw response!`);
        console.warn(error);
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
        debugger;
        fetchFilter(error);
    }
}
