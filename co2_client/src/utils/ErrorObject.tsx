
export interface ErrorObjectType {
    message: Array<string>,
    error: Array<string> // Can be weird b/c activerecord
}

export interface withErrors {
    errors?: Array<ErrorObjectType>
}

//TODO: use this:
export type Errors = Array<ErrorObjectType>;


export function formatErrors(errorObject: Errors): string {
    console.log("errors: ", errorObject);
    const errorStrings = errorObject.map((errorObject) => {
        return `error string: '${errorObject.error}', message: '${errorObject.message}'`
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