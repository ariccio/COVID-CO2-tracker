
export interface ErrorObjectType {
    message: Array<string>,
    error: Array<string> // Can be weird b/c activerecord
}

export function formatErrors(errorObject: Array<ErrorObjectType>): string {
    console.log("errors: ", errorObject);
    const errorStrings = errorObject.map((errorObject) => {
        return `error code: '${errorObject.error}', message: '${errorObject.message}'`
    });
    return errorStrings.toString();
}