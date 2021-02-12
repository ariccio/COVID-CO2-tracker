
interface EachError {
    message: Array<string>,
    error: Array<string> // Can be weird b/c activerecord
}

export interface ErrorObjectType {
    errors: Array<EachError>
}

export function formatErrors(errorObject: ErrorObjectType): string {
    console.log("errors: ", errorObject);
    const errorStrings = errorObject.errors.map((errorObject) => {
        return `error code: '${errorObject.error}', message: '${errorObject.message}'`
    });
    return errorStrings.toString();
}