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
    aranet4UnknownField: number | null;
    deviceName: string | null;
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
    aranet4UnknownField: null,
    deviceName: null
}

export const bluetoothSlice = createSlice({
    name: 'bluetooth',
    initialState,
    reducers: {
        setDebugText: (state, action: PayloadAction<string>) => {
            state.debugText = action.payload;
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
        setAranet4UnknownField: (state, action: PayloadAction<number | null>) => {
            state.aranet4UnknownField = action.payload;
        },
        setAranet4DeviceName: (state, action: PayloadAction<string | null>) => {
            state.deviceName = action.payload;
        }
    }
});

export const {setDebugText, setCO2, setBluetoothAvailableError, setBluetoothAvailable, setTemperature, setBarometricPressure, setHumidity, setBattery, setAranet4UnknownField, setAranet4DeviceName} = bluetoothSlice.actions;

export const selectDebugText = (state: RootState) => state.bluetooth.debugText;
export const selectCO2 = (state: RootState) => state.bluetooth.co2;
export const selectBluetoothAvailableError = (state: RootState) => state.bluetooth.bluetoothAvailableError;
export const selectBluetoothAvailable = (state: RootState) => state.bluetooth.bluetoothAvailable;
export const selectTemperature = (state: RootState) => state.bluetooth.temperature;
export const selectBarometricPressure = (state: RootState) => state.bluetooth.barometricPressure;
export const selectHumidity = (state: RootState) => state.bluetooth.humidity;
export const selectBattery = (state: RootState) => state.bluetooth.battery;
export const selectAranet4UnknownField = (state: RootState) => state.bluetooth.aranet4UnknownField;
export const selectAranet4DeviceName = (state: RootState) => state.bluetooth.deviceName;

export const bluetoothReducer = bluetoothSlice.reducer;
