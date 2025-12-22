import { ErrorObjectType } from './ErrorObject';

/**
 * Interface for extra measurement information
 * @interface ExtraMeasurementInfo
 */
export interface ExtraMeasurementInfo {
    /** Unique identifier for the extra measurement info */
    id: number;
    /** ID of the associated measurement */
    measurement_id: number;
    /** Flag indicating if this is a realtime measurement */
    realtime: boolean;
    /** Timestamp when the record was last updated */
    updated_at: string;
    /** Timestamp when the record was created */
    created_at: string;
}

/**
 * Interface for serialized single measurement data
 * @interface SerializedSingleMeasurement
 */
export interface SerializedSingleMeasurement {
    /** Unique identifier for the measurement */
    id: number | null;
    /** Type of the measurement */
    type: string;
    /** Measurement attributes */
    attributes: {
        /** CO2 parts per million value */
        co2ppm: number;
        /** Timestamp when the measurement was taken */
        measurementtime: string;
        /** Crowding level (1-5) or null if not provided */
        crowding: number | null;
        /** Timestamp when the record was last updated */
        updated_at: string;
        /** Timestamp when the record was created */
        created_at: string;
        /** Optional extra measurement information */
        extra_measurement_info?: ExtraMeasurementInfo | null;
    };
    /** Related entities */
    relationships: {
        /** Associated device information */
        device: {
            data: {
                /** Device ID */
                id: number | null;
                /** Type of the device */
                type: string;
            }
        };
        /** Associated sublocation information */
        sub_location: {
            data: {
                /** Sublocation ID */
                id: string;
                /** Type of the sublocation */
                type: string;
            }
        }
    }
}

/**
 * Default values for a serialized single measurement
 * @constant defaultSerializedSingleMeasurementInfo
 */
export const defaultSerializedSingleMeasurementInfo: SerializedSingleMeasurement = {
    id: null,
    type: '',
    attributes: {
        co2ppm: -1,
        measurementtime: '',
        crowding: -1,
        created_at: '',
        updated_at: '',
        extra_measurement_info: null
    },
    relationships: {
        device: {
            data: {
                id: null,
                type: ''
            }
        },
        sub_location: {
            data: {
                id: '',
                type: ''
            }
        }
    }
};

/**
 * Interface for serialized device serial information
 * @interface SerializedSingleDeviceSerial
 */
export interface SerializedSingleDeviceSerial {
    /** Device ID */
    id: number;
    /** Type of the device */
    type: string;
    /** Device attributes */
    attributes: {
        /** Serial number of the device */
        serial: string;
    }
}

/**
 * Default values for serialized device serial information
 * @constant defaultSerializedSingleDeviceSerial
 */
export const defaultSerializedSingleDeviceSerial: SerializedSingleDeviceSerial = {
    id: -1,
    type: '',
    attributes: {
        serial: ''
    }
};

/**
 * Interface for user device information
 * @interface UserInfoDevice
 */
export interface UserInfoDevice {
    /** Unique identifier for the device */
    device_id: number;
    /** Serial number of the device */
    serial: string;
    /** Model name of the device */
    device_model: string;
    /** Unique identifier for the device model */
    device_model_id: number;
    /** Manufacturer name of the device */
    device_manufacturer: string;
    /** Unique identifier for the device manufacturer */
    device_manufacturer_id: number;
}

/**
 * Interface for device information response
 * @interface DeviceInfoResponse
 */
export interface DeviceInfoResponse {
    /** Unique identifier for the device */
    device_id: number;
    /** Serial number of the device */
    serial: string;
    /** Model name of the device */
    device_model: string;
    /** Unique identifier for the device model */
    device_model_id: string;
    /** Unique identifier for the user who owns the device */
    user_id: number;
    /** Measurements associated with the device */
    measurements: {
        /** Array of serialized measurements */
        data: Array<SerializedSingleMeasurement>;
    };
    /** Optional array of errors */
    errors?: Array<ErrorObjectType>;
}

/**
 * Default values for device information response
 * @constant defaultDeviceInfoResponse
 */
export const defaultDeviceInfoResponse: DeviceInfoResponse = {
    device_id: -1,
    serial: '',
    device_model: '',
    device_model_id: '',
    user_id: -1,
    measurements: {
        data: []
    }
};

/**
 * Validates a device info response object
 * @param deviceInfo - The device info object to validate
 * @throws Error if validation fails
 */
export function validateDeviceInfo(deviceInfo: any): void {
    if (!deviceInfo) {
        throw new Error('Device info is undefined or null');
    }
    
    if (deviceInfo.errors) {
        return; // Skip validation if errors are present
    }
    
    if (typeof deviceInfo.device_id !== 'number') {
        throw new Error(`Invalid device_id: ${deviceInfo.device_id}. Expected a number.`);
    }
    
    if (!deviceInfo.serial) {
        throw new Error('Device serial is required');
    }
    
    if (!deviceInfo.device_model) {
        throw new Error('Device model is required');
    }
    
    if (!deviceInfo.device_model_id) {
        throw new Error('Device model ID is required');
    }
    
    if (typeof deviceInfo.user_id !== 'number') {
        throw new Error(`Invalid user_id: ${deviceInfo.user_id}. Expected a number.`);
    }
    
    if (!deviceInfo.measurements || !Array.isArray(deviceInfo.measurements.data)) {
        throw new Error('Measurements data must be an array');
    }
}

/**
 * Converts device information from any type to strongly typed DeviceInfoResponse
 * with validation and error handling
 * @param deviceInfoResponse - The device information object to convert
 * @returns Strongly typed DeviceInfoResponse object
 */
export function deviceInfoToStrongType(deviceInfoResponse: any): DeviceInfoResponse {
    // Check if the input is defined
    if (deviceInfoResponse === undefined) {
        throw new Error('Device info response is undefined');
    }
    
    // If errors are present, return the response as is
    if (deviceInfoResponse.errors !== undefined) {
        return deviceInfoResponse;
    }
    
    try {
        validateDeviceInfo(deviceInfoResponse);
    } catch (error) {
        console.error('Error validating device info:', error);
        throw error;
    }
    
    // Construct and return the validated DeviceInfoResponse object
    const return_value: DeviceInfoResponse = {
        device_id: deviceInfoResponse.device_id,
        serial: deviceInfoResponse.serial,
        device_model: deviceInfoResponse.device_model,
        device_model_id: deviceInfoResponse.device_model_id,
        user_id: deviceInfoResponse.user_id,
        measurements: deviceInfoResponse.measurements,
        errors: deviceInfoResponse.errors
    };
    
    return return_value;
}