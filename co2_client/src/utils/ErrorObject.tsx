export interface ExtraErrorInformationActiveModelErrorInfo {
    attribute: string
}


export interface ErrorObjectType {
    message: Array<string>,
    error: Array<string>, // Can be weird b/c activerecord
    other_information?: unknown
}

export interface withErrors {
    errors?: Array<ErrorObjectType>
}

//TODO: use this:
export type Errors = Array<ErrorObjectType>;


function errorObjectErrorStringIfPresent(errorObject: ErrorObjectType): string {
    if (errorObject.error.length === 0) {
        return '';
    }
    // This is not complete, as we're only checking the first element. Whatever.
    if (errorObject.error[0] === null) {
        return '';
    }
    if (errorObject.error[0] === '') {
        return '';
    }
    if (errorObject.error.length > 1) {
        return `error string (first error is likely the cause): '${errorObject.error}'`;
    }

    return `error string: '${errorObject.error}'`;
}

function errorObjectMessageStringIfPresent(errorObject: ErrorObjectType): string {
    if (errorObject.message.length === 0) {
        return '';
    }
    // This is not complete, as we're only checking the first element. Whatever.
    if (errorObject.message[0] === null) {
        return '';
    }
    if (errorObject.message[0] === '') {
        return '';
    }

    return `message: '${errorObject.message}'`;
}

export function formatErrors(errorObject: Errors): string {
    console.log("errors: ", JSON.stringify(errorObject));
    if (errorObject === undefined) {
        throw new Error('errorObject itself is undefined. What the hell? This is almost certainly a bug.');
    }
    const errorStrings = errorObject.map((errorObject) => {
        const errorObjectErrorString = errorObjectErrorStringIfPresent(errorObject);
        const errorObjectMessageString = errorObjectMessageStringIfPresent(errorObject);
        console.assert((errorObjectErrorString.length > 0) || (errorObjectMessageString.length > 0));
        if (errorObjectErrorString.length === 0) {
            return errorObjectMessageString;
        }
        if (errorObjectMessageString.length === 0) {
            return errorObjectErrorString;
        }
        return `${errorObjectErrorString}, ${errorObjectMessageString}`;
    });
    return errorStrings.toString();
}

export function firstErrorAsString(errorObject: Errors): string {
    console.assert(errorObject.length > 0);
    if (errorObject.length > 0) {
        console.assert(errorObject[0].error !== undefined);
        return errorObject[0].error[0];
    }
    return "Error parsing errors, none present!";
}

export function exceptionToErrorObject(error: any): ErrorObjectType {
    return {
        message: error.message,
        error: error
    }
}