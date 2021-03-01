import {formatErrors} from './ErrorObject';

export function fetchFailed(awaitedResponse: Response, response: any, expectedStatus: number, alertErrors: boolean): boolean {
    if ((response.errors !== undefined) || (awaitedResponse.status !== 200)) {
        if (awaitedResponse.status !== expectedStatus) {
            console.assert(response.errors !== undefined);
            console.warn(`server returned a response (${awaitedResponse.status}) with a status field, and it wasn't a ${expectedStatus} status.`);
        }
        if (response.errors !== undefined) {
            console.assert(awaitedResponse.status !== 200);
            console.error(formatErrors(response.errors));
            if(alertErrors) {
                alert(formatErrors(response.errors));
            }
        }
        // debugger;
        return true;
        // return null;
    }
    return false;
}

export function fetchFilter(error: any): never {
    if (error instanceof SyntaxError) {
        console.error("JSON parsing error, likely a network error anyways.")

    }
    else if (error instanceof TypeError) {
        console.error("fetch itself failed, likely a network issue.")
    }
    console.error(`fetch iself failed! Error: ${error}`);
    throw error;
}