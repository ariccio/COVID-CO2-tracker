import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../../app/store';

interface bluetoothState {
    debugText: string;
    co2: number | null;
    bluetoothAvailableError: string | null;
    bluetoothAvailable: boolean | null;
    temperature: number | null;
    barometricPressure: number | null;
    humidity: number | null;
    battery: number | null;
    // aranet4UnknownField: number | null;
    deviceNameFromCharacteristic: string | null;
    aranet4MeasurementInterval: number | null;
    deviceName: string | null;
    deviceID: string | null;
    aranet4TotalMeasurements: number | null;
    modelNumberString: string | null;
    firmwareRevisionString: string | null;
    hardwareRevisionString: string | null;
    softwareRevisionString: string | null;
    manufacturerName: string | null;
    aranet4SecondsSinceLastMeasurement: number | null;
    aranet4Color: string | null;
}

const initialState: bluetoothState = {
    debugText: '',
    co2: null,
    bluetoothAvailableError: null,
    bluetoothAvailable: null,
    temperature: null,
    barometricPressure: null,
    humidity: null,
    battery: null,
    // aranet4UnknownField: null,
    deviceNameFromCharacteristic: null,
    deviceName: null,
    deviceID: null,
    aranet4MeasurementInterval: null,
    aranet4TotalMeasurements: null,
    modelNumberString: null,
    firmwareRevisionString: null,
    hardwareRevisionString: null,
    softwareRevisionString: null,
    manufacturerName: null,
    aranet4SecondsSinceLastMeasurement: null,
    aranet4Color: null
}

export const bluetoothSlice = createSlice({
    name: 'bluetooth',
    initialState,
    reducers: {
        setDebugText: (state, action: PayloadAction<string>) => {
            state.debugText = action.payload;
        },
        appendDebugText: (state, action: PayloadAction<string>) => {
            state.debugText += action.payload;
        },
        setCO2: (state, action: PayloadAction<number | null>) => {
            state.co2 = action.payload;
        },
        setBluetoothAvailableError: (state, action: PayloadAction<string | null>) => {
            state.bluetoothAvailableError = action.payload;
        },
        setBluetoothAvailable: (state, action: PayloadAction<boolean | null>) => {
            state.bluetoothAvailable = action.payload;
        },
        setTemperature: (state, action: PayloadAction<number | null>) => {
            state.temperature = action.payload;
        },
        setBarometricPressure: (state, action: PayloadAction<number | null>) => {
            state.barometricPressure = action.payload;
        },
        setHumidity: (state, action: PayloadAction<number | null>) => {
            state.humidity = action.payload;
        },
        setBattery: (state, action: PayloadAction<number | null>) => {
            state.battery = action.payload;
        },
        // setAranet4UnknownField: (state, action: PayloadAction<number | null>) => {
        //     state.aranet4UnknownField = action.payload;
        // },
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
            state.aranet4MeasurementInterval = action.payload;
        },
        setAranet4TotalMeasurements: (state, action: PayloadAction<number | null>) => {
            state.aranet4TotalMeasurements = action.payload;
        },
        setModelNumberString: (state, action: PayloadAction<string | null>) => {
            state.modelNumberString = action.payload;
        },
        setFirmwareRevisionString: (state, action: PayloadAction<string | null>) => {
            state.firmwareRevisionString = action.payload;
        },
        setHardwareRevisionString: (state, action: PayloadAction<string | null>) => {
            state.hardwareRevisionString = action.payload;
        },
        setSoftwareRevisionString: (state, action: PayloadAction<string | null>) => {
            state.softwareRevisionString = action.payload;
        },
        setManufacturerName: (state, action: PayloadAction<string | null>) => {
            state.manufacturerName = action.payload;
        },
        setAranet4SecondsSinceLastMeasurement: (state, action: PayloadAction<number | null>) => {
            state.aranet4SecondsSinceLastMeasurement = action.payload;
        },
        setAranet4Color: (state, action: PayloadAction<string | null>) => {
            state.aranet4Color = action.payload;
        }
    }
});

export const {setDebugText, setCO2, setBluetoothAvailableError, setBluetoothAvailable, setTemperature, setBarometricPressure, setHumidity, setBattery, setDeviceNameFromCharacteristic, setDeviceID, setDeviceName, setAranet4MeasurementInterval, setAranet4TotalMeasurements, setModelNumberString, setFirmwareRevisionString, setHardwareRevisionString, setSoftwareRevisionString, setManufacturerName, setAranet4SecondsSinceLastMeasurement, appendDebugText, setAranet4Color} = bluetoothSlice.actions;

export const selectDebugText = (state: RootState) => state.bluetooth.debugText;
export const selectCO2 = (state: RootState) => state.bluetooth.co2;
export const selectBluetoothAvailableError = (state: RootState) => state.bluetooth.bluetoothAvailableError;
export const selectBluetoothAvailable = (state: RootState) => state.bluetooth.bluetoothAvailable;
export const selectTemperature = (state: RootState) => state.bluetooth.temperature;
export const selectBarometricPressure = (state: RootState) => state.bluetooth.barometricPressure;
export const selectHumidity = (state: RootState) => state.bluetooth.humidity;
export const selectBattery = (state: RootState) => state.bluetooth.battery;
// export const selectAranet4UnknownField = (state: RootState) => state.bluetooth.aranet4UnknownField;
export const selectDeviceNameFromCharacteristic = (state: RootState) => state.bluetooth.deviceNameFromCharacteristic;
export const selectDeviceName = (state: RootState) => state.bluetooth.deviceName;
export const selectDeviceID = (state: RootState) => state.bluetooth.deviceID;
export const selectAranet4MeasurementInterval = (state: RootState) => state.bluetooth.aranet4MeasurementInterval;
export const selectAranet4TotalMeasurements = (state: RootState) => state.bluetooth.aranet4TotalMeasurements;
export const selectModelNumberString = (state: RootState) => state.bluetooth.modelNumberString;
export const selectFirmwareRevisionString = (state: RootState) => state.bluetooth.firmwareRevisionString;
export const selectHardwareRevisionString = (state: RootState) => state.bluetooth.hardwareRevisionString;
export const selectSoftwareRevisionString = (state: RootState) => state.bluetooth.softwareRevisionString;
export const selectManufacturerNameString = (state: RootState) => state.bluetooth.manufacturerName;
export const selectAranet4SecondsSinceLastUpdate = (state: RootState) => state.bluetooth.aranet4SecondsSinceLastMeasurement;
export const selectAranet4Color = (state: RootState) => state.bluetooth.aranet4Color;

export const bluetoothReducer = bluetoothSlice.reducer;
