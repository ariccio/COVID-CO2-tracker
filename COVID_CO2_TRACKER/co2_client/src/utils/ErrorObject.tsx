export interface ErrorObjectType {
    message: Array<string>,
    error: Array<string> // Can be weird b/c activerecord
}

export function formatErrors(errorObject: ErrorObjectType): string {
    console.log("errors: ", errorObject);
    return `error code: '${errorObject.error}', message: '${errorObject.message}'`
}