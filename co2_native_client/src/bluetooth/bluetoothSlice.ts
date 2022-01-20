import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { DeviceId, Base64, UUID, State } from 'react-native-ble-plx';
import { RootState } from '../app/store';

interface GenericDeviceInformation {
    modelNumber: string | null;
    firmwareRevision: string | null;
    hardwareRevision: string | null;
    softwareRevision: string | null;
    manufacturerName: string | null;
    battery: number | null;
    // deviceNameFromCharacteristic: string | null;
    deviceName: string | null;
    deviceID: string | null; //Looks like a MAC address?
    deviceSerialNumber: string | null

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
    aranet4MeasurementTime: string | null
}

export interface RFData {
    rssi: number | null;
    txPower: number | null;
}

export interface BluetoothDeviceState {
    measurementData: MeasurementData;
    gattDeviceInformation: GenericDeviceInformation;
    aranet4SpecificData: Aranet4SpecificData;
    rfData: RFData;
}


export interface BluetoothState {
    device: BluetoothDeviceState;
    hasBluetooth: boolean;
    scanningStatusString: string | null;
    scanningErrorStatus: string;
}

const initialState: BluetoothState = {
    hasBluetooth: false,
    device: {
        measurementData: {
            barometricPressure: null,
            co2: null,
            humidity: null,
            temperature: null
        },
        aranet4SpecificData: {
            aranet4Calibration: null,
            aranet4Color: null,
            aranet4MeasurementInterval: null,
            aranet4MeasurementTime: null,
            aranet4SecondsSinceLastMeasurement: null,
            aranet4TotalMeasurements: null
        },
        gattDeviceInformation: {
            battery: null,
            deviceID: null,
            deviceName: null,
            // deviceNameFromCharacteristic: null,
            firmwareRevision: null,
            hardwareRevision: null,
            manufacturerName: null,
            modelNumber: null,
            softwareRevision: null,
            deviceSerialNumber: null
        },
        rfData: {
            rssi: null,
            txPower: null
        }
    },
    scanningStatusString: null,
    scanningErrorStatus: ''
};


export const bluetoothSlice = createSlice({
    name: 'bluetooth',
    initialState,
    reducers: {
        setDeviceID: (state, action: PayloadAction<string | null>) => {
            state.device.gattDeviceInformation.deviceID = action.payload;
        },
        setDeviceName: (state, action: PayloadAction<string | null>) => {
            state.device.gattDeviceInformation.deviceName = action.payload
        },
        setRssi: (state, action: PayloadAction<number | null>) => {
            state.device.rfData.rssi = action.payload;
        },
        setDeviceSerialNumber: (state, action: PayloadAction<string | null>) => {
            state.device.gattDeviceInformation.deviceSerialNumber = action.payload;
        },
        // setTxPower: (state, action: PayloadAction<number | null>) => {
        //     state.device.rfData.txPower = action.payload;
        // },
        setHasBluetooth: (state, action: PayloadAction<boolean>) => {
            state.hasBluetooth = action.payload;
        },
        setScanningStatusString: (state, action: PayloadAction<string | null>) => {
            state.scanningStatusString = action.payload;
        },
        setScanningErrorStatusString: (state, action: PayloadAction<string | null>) => {
            if (action.payload === null) {
                console.warn('Clearing scanning error status....')
                state.scanningErrorStatus = '';
                return;
            }

            if (state.scanningErrorStatus.length > 255) {
                console.warn(`Scanning error status string overflowing, will clear. Old value: "${state.scanningErrorStatus}"`);
                state.scanningErrorStatus = action.payload;
                return;
            }
            if (state.scanningErrorStatus.length === 0) {
                state.scanningErrorStatus += action.payload;
                return;
            }

            state.scanningErrorStatus += (', ' + action.payload);
        },
        setDeviceBatteryLevel: (state, action: PayloadAction<number>) => {
            state.device.gattDeviceInformation.battery = action.payload;
        }

    }
})

export const {setDeviceID, setDeviceName, setRssi, setHasBluetooth, setScanningStatusString, setDeviceSerialNumber, setScanningErrorStatusString, setDeviceBatteryLevel} = bluetoothSlice.actions;

export const selectHasBluetooth = (state: RootState) => state.bluetooth.hasBluetooth;
export const selectDeviceID = (state: RootState) => state.bluetooth.device.gattDeviceInformation.deviceID;
export const selectDeviceName = (state: RootState) => state.bluetooth.device.gattDeviceInformation.deviceName;
export const selectDeviceRSSI = (state: RootState) => state.bluetooth.device.rfData.rssi;
export const selectScanningStatusString = (state: RootState) => state.bluetooth.scanningStatusString;
export const selectScanningErrorStatusString = (state: RootState) => state.bluetooth.scanningErrorStatus;
export const selectDeviceSerialNumberString = (state: RootState) => state.bluetooth.device.gattDeviceInformation.deviceSerialNumber;
export const selectDeviceBatterylevel = (state: RootState) => state.bluetooth.device.gattDeviceInformation.battery;

export const bluetoothReducer = bluetoothSlice.reducer;


