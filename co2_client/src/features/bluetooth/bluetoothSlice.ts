import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../../app/store';

interface GenericGattDeviceInformationCharacteristics {
    modelNumber: string | null;
    firmwareRevision: string | null;
    hardwareRevision: string | null;
    softwareRevision: string | null;
    manufacturerName: string | null;
}

interface MeasurementData {
    co2: number | null;
    temperature: number | null;
    barometricPressure: number | null;
    humidity: number | null;
}

interface Aranet4SpecificData {
    aranet4TotalMeasurements: number | null;
    aranet4MeasurementInterval: number | null;
    aranet4SecondsSinceLastMeasurement: number | null;
    aranet4Color: string | null;
    aranet4Calibration: string | null;
    aranet4MeasurementTime: Date | null
}

export interface RFData {
    rssi: number | null;
    txPower: number | null;
    
}


interface bluetoothState {
    debugText: string;

    measurementData: MeasurementData;

    bluetoothAvailableError: string | null;
    bluetoothAvailable: boolean | null;
    battery: number | null;
    deviceNameFromCharacteristic: string | null;
    deviceName: string | null;
    deviceID: string | null;
    
    gattDeviceInformation: GenericGattDeviceInformationCharacteristics;
    
    aranet4SpecificData: Aranet4SpecificData;
    rfData: RFData;
    supportsGetDevices: boolean | null;
    supportsBluetooth: boolean | null;
}


const initialState: bluetoothState = {
    debugText: '',
    
    measurementData: {
        co2: null,
        temperature: null,
        barometricPressure: null,
        humidity: null,
    },

    bluetoothAvailableError: null,
    bluetoothAvailable: null,
    battery: null,

    deviceNameFromCharacteristic: null,
    deviceName: null,
    deviceID: null,
    gattDeviceInformation: {
        modelNumber: null,
        firmwareRevision: null,
        hardwareRevision: null,
        softwareRevision: null,
        manufacturerName: null,
    },
    
    aranet4SpecificData: {
        aranet4MeasurementInterval: null,
        aranet4TotalMeasurements: null,
        aranet4SecondsSinceLastMeasurement: null,
        aranet4Color: null,
        aranet4Calibration: null,
        aranet4MeasurementTime: null
    },

    rfData: {
        rssi: null,
        txPower: null
    },
    supportsGetDevices: null,
    supportsBluetooth: null
}

export const bluetoothSlice = createSlice({
    name: 'bluetooth',
    initialState,
    reducers: {
        setBluetoothAvailableError: (state, action: PayloadAction<string | null>) => {
            state.bluetoothAvailableError = action.payload;
        },
        setBluetoothAvailable: (state, action: PayloadAction<boolean | null>) => {
            state.bluetoothAvailable = action.payload;
        },
        appendDebugText: (state, action: PayloadAction<string>) => {
            state.debugText += action.payload;
        },


        setCO2: (state, action: PayloadAction<number | null>) => {
            state.measurementData.co2 = action.payload;
        },
        setTemperature: (state, action: PayloadAction<number | null>) => {
            state.measurementData.temperature = action.payload;
        },
        setBarometricPressure: (state, action: PayloadAction<number | null>) => {
            state.measurementData.barometricPressure = action.payload;
        },
        setHumidity: (state, action: PayloadAction<number | null>) => {
            state.measurementData.humidity = action.payload;
        },
        setBattery: (state, action: PayloadAction<number | null>) => {
            state.battery = action.payload;
        },
        setDeviceNameFromCharacteristic: (state, action: PayloadAction<string | null>) => {
            state.deviceNameFromCharacteristic = action.payload;
        },
        setDeviceName: (state, action: PayloadAction<string | null>) => {
            state.deviceName = action.payload;
        },
        setDeviceID: (state, action: PayloadAction<string | null>) => {
            state.deviceID = action.payload;
        },
        
        setAranet4MeasurementInterval: (state, action: PayloadAction<number | null>) => {
            state.aranet4SpecificData.aranet4MeasurementInterval = action.payload;
        },
        setAranet4TotalMeasurements: (state, action: PayloadAction<number | null>) => {
            state.aranet4SpecificData.aranet4TotalMeasurements = action.payload;
        },
        setAranet4SecondsSinceLastMeasurement: (state, action: PayloadAction<number | null>) => {
            state.aranet4SpecificData.aranet4SecondsSinceLastMeasurement = action.payload;
            if (action.payload) {
                const now = Date.now();
                const seconds = action.payload * 1000;
                state.aranet4SpecificData.aranet4MeasurementTime = (new Date(now - seconds));
            }

            //TODO: set 
        },
        setAranet4Color: (state, action: PayloadAction<string | null>) => {
            state.aranet4SpecificData.aranet4Color = action.payload;
        },
        setAranet4Calibration: (state, action: PayloadAction<string | null>) => {
            state.aranet4SpecificData.aranet4Calibration = action.payload;
        },


        setModelNumber: (state, action: PayloadAction<string | null>) => {
            state.gattDeviceInformation.modelNumber = action.payload;
        },
        setFirmwareRevision: (state, action: PayloadAction<string | null>) => {
            state.gattDeviceInformation.firmwareRevision = action.payload;
        },
        setHardwareRevision: (state, action: PayloadAction<string | null>) => {
            state.gattDeviceInformation.hardwareRevision = action.payload;
        },
        setSoftwareRevision: (state, action: PayloadAction<string | null>) => {
            state.gattDeviceInformation.softwareRevision = action.payload;
        },
        setManufacturerName: (state, action: PayloadAction<string | null>) => {
            state.gattDeviceInformation.manufacturerName = action.payload;
        },
        setRFData: (state, action: PayloadAction<RFData>) => {
            state.rfData = action.payload;
        },
        setSupportsGetDevices: (state, action: PayloadAction<boolean | null>) => {
            state.supportsGetDevices = action.payload;
        },
        setSupportsBluetooth: (state, action: PayloadAction<boolean | null>) => {
            state.supportsBluetooth = action.payload;
        }

    }
});

export const {setCO2, setBluetoothAvailableError, setBluetoothAvailable, setTemperature, setBarometricPressure, setHumidity, setBattery, setDeviceNameFromCharacteristic, setDeviceID, setDeviceName, setAranet4MeasurementInterval, setAranet4TotalMeasurements, setModelNumber, setFirmwareRevision, setHardwareRevision, setSoftwareRevision, setManufacturerName, setAranet4SecondsSinceLastMeasurement, appendDebugText, setAranet4Color, setAranet4Calibration, setRFData, setSupportsGetDevices, setSupportsBluetooth} = bluetoothSlice.actions;

export const selectDebugText = (state: RootState) => state.bluetooth.debugText;
export const selectBluetoothAvailableError = (state: RootState) => state.bluetooth.bluetoothAvailableError;
export const selectBluetoothAvailable = (state: RootState) => state.bluetooth.bluetoothAvailable;

export const selectMeasurementData = (state: RootState) => state.bluetooth.measurementData;

export const selectBattery = (state: RootState) => state.bluetooth.battery;

export const selectDeviceNameFromCharacteristic = (state: RootState) => state.bluetooth.deviceNameFromCharacteristic;
export const selectDeviceName = (state: RootState) => state.bluetooth.deviceName;
export const selectDeviceID = (state: RootState) => state.bluetooth.deviceID;

export const selectGattDeviceInformation = (state: RootState) => state.bluetooth.gattDeviceInformation;
export const selectAranet4SpecificData = (state: RootState) => state.bluetooth.aranet4SpecificData;

export const selectRFData = (state: RootState) => state.bluetooth.rfData;

export const selectSupportsGetDevices = (state: RootState) => state.bluetooth.supportsGetDevices;
export const selectSupportsBluetooth = (state: RootState) => state.bluetooth.supportsBluetooth;
// export const selectAranet4MeasurementInterval = (state: RootState) => state.bluetooth.aranet4MeasurementInterval;
// export const selectAranet4TotalMeasurements = (state: RootState) => state.bluetooth.aranet4TotalMeasurements;
// export const selectAranet4SecondsSinceLastUpdate = (state: RootState) => state.bluetooth.aranet4SecondsSinceLastMeasurement;
// export const selectAranet4Color = (state: RootState) => state.bluetooth.aranet4Color;
// export const selectAranet4Calibration = (state: RootState) => state.bluetooth.aranet4Calibration;

export const bluetoothReducer = bluetoothSlice.reducer;
