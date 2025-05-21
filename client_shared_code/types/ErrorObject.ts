/**
 * Interface for extra error information related to ActiveModel errors
 * @interface ExtraErrorInformationActiveModelErrorInfo
 */
export interface ExtraErrorInformationActiveModelErrorInfo {
    /** The attribute that caused the error */
    attribute: string;
}

/**
 * Main interface for error objects
 * @interface ErrorObjectType
 */
export interface ErrorObjectType {
    /** Array of error messages */
    message: Array<string>;
    /** Array of error details (can contain ActiveRecord errors) */
    error: Array<string>;
    /** Optional additional information about the error */
    other_information?: unknown;
}

/**
 * Interface for objects that may contain errors
 * @interface withErrors
 */
export interface withErrors {
    /** Optional array of error objects */
    errors?: Array<ErrorObjectType>;
}

/**
 * Type alias for an array of error objects
 * @type {Array<ErrorObjectType>}
 */
export type Errors = Array<ErrorObjectType>;

/**
 * Formats the remaining errors as a string
 * @param errors - Array of error strings
 * @returns Formatted error string
 */
function restOfObject(errors: string[]): string {
    let errorString = 'Other errors:';
    for (let i = 0; i < errors.length; i++) {
        errorString += `\n${errors[i]}`;
    }
    return errorString;
}

/**
 * Extracts error string from an error object if present
 * @param errorObject - The error object to extract from
 * @returns Formatted error string or empty string if no error
 */
function errorObjectErrorStringIfPresent(errorObject: ErrorObjectType): string {
    if (errorObject.error.length === 0) {
        return '';
    }
    
    if (errorObject.error[0] === null) {
        return '';
    }
    
    if (errorObject.error[0] === '') {
        return '';
    }
    
    if (errorObject.error.length > 1) {
        return `First error, likely the cause: ${errorObject.error[0]}\n${restOfObject(errorObject.error.slice(1))}`;
    }

    return `error string: '${errorObject.error}'`;
}

/**
 * Extracts message string from an error object if present
 * @param errorObject - The error object to extract from
 * @returns Formatted message string or empty string if no message
 */
function errorObjectMessageStringIfPresent(errorObject: ErrorObjectType): string {
    if (errorObject.message.length === 0) {
        return '';
    }
    
    if (errorObject.message[0] === null) {
        return '';
    }
    
    if (errorObject.message[0] === '') {
        return '';
    }

    return `message: '${errorObject.message}'`;
}

/**
 * Formats an array of error objects into a readable string
 * @param errorObject - Array of error objects to format
 * @returns Formatted error string
 * @throws Error if errorObject is undefined
 */
export function formatErrors(errorObject: Errors): string {
    if (errorObject === undefined) {
        throw new Error('errorObject itself is undefined. This is almost certainly a bug.');
    }
    
    const errorStrings = errorObject.map((errorObject) => {
        const errorObjectErrorString = errorObjectErrorStringIfPresent(errorObject);
        const errorObjectMessageString = errorObjectMessageStringIfPresent(errorObject);
        
        if (errorObjectErrorString.length === 0 && errorObjectMessageString.length === 0) {
            return 'Unknown error (no message or error details provided)';
        }
        
        if (errorObjectErrorString.length === 0) {
            return errorObjectMessageString;
        }
        
        if (errorObjectMessageString.length === 0) {
            return errorObjectErrorString;
        }
        
        return `${errorObjectErrorString}, ${errorObjectMessageString}`;
    });
    
    return errorStrings.join(', ');
}

/**
 * Returns the first error as a string
 * @param errorObject - Array of error objects
 * @returns First error as a string
 */
export function firstErrorAsString(errorObject: Errors): string {
    if (errorObject.length > 0 && errorObject[0].error && errorObject[0].error.length > 0) {
        return errorObject[0].error[0];
    }
    
    return "Error parsing errors, none present!";
}

/**
 * Converts an exception to an ErrorObjectType
 * @param error - The exception to convert
 * @returns ErrorObjectType representation of the exception
 */
export function exceptionToErrorObject(error: any): ErrorObjectType {
    return {
        message: [error.message || 'Unknown error'],
        error: [error.toString()]
    };
}