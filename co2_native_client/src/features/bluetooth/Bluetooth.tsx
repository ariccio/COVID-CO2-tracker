/* eslint-disable no-debugger */
/* eslint-disable react/prop-types */
// See updated (more restrictive) licensing restrictions for this subproject! Updated 02/03/2022.
import {Buffer} from 'buffer';
import { useEffect, useState } from 'react';
import { PermissionsAndroid, Text, Button, NativeSyntheticEvent, NativeTouchEvent, Linking, Permission } from 'react-native';
import { BleManager, Device, BleError, LogLevel, Service, Characteristic, BleErrorCode, DeviceId, State, BleAndroidErrorCode } from 'react-native-ble-plx';
import { useDispatch, useSelector } from 'react-redux';
import * as Sentry from 'sentry-expo';

import * as BLUETOOTH from '../../../../co2_client/src/utils/BluetoothConstants';
import { UserInfoDevice } from '../../../../co2_client/src/utils/DeviceInfoTypes';
import { selectBackgroundPollingEnabled } from '../../app/globalSlice';
import { AppDispatch } from '../../app/store';
import { MaybeIfValue, MaybeIfValueTrue } from '../../utils/RenderValues';
import { timeNowAsString } from '../../utils/TimeNow';
import { COVID_CO2_TRACKER_DEVICES_URL } from '../../utils/UrlPaths';
import { useIsLoggedIn } from '../../utils/UseLoggedIn';
import { useOpenableLink, IfNotOpenable } from '../Links/OpenLink';
import { addMeasurement } from '../Measurement/MeasurementSlice';
import { MeasurementDataForUpload } from '../Measurement/MeasurementTypes';
import { setUploadStatus } from '../Uploading/uploadSlice';
import { selectSupportedDevices } from '../userInfo/devicesSlice';
import { Aranet4_1503CO2, incrementUpdates, MeasurementData, selectAranet4SpecificData, selectDeviceBatterylevel, selectDeviceID, selectDeviceName, selectDeviceRSSI, selectDeviceSerialNumberString, selectDeviceStatusString, selectHasBluetooth, selectMeasurementData, selectMeasurementInterval, selectMeasurementTime, selectNeedsBluetoothTurnOn, selectScanningErrorStatusString, selectScanningStatusString, selectUpdateCount, setAranet4Color, setAranet4SecondsSinceLastMeasurement, setDeviceBatteryLevel, setDeviceID, setDeviceName, setDeviceSerialNumber, setDeviceStatusString, setHasBluetooth, setMeasurementDataFromCO2Characteristic, setMeasurementInterval, setNeedsBluetoothTurnOn, setRssi, setScanningErrorStatusString, setScanningStatusString } from './bluetoothSlice';


//https://github.com/thespacemanatee/Smart-Shef-IoT/blob/4782c95f383040f36e4ae7ce063166cce5c76129/smart_shef_app/src/utils/hooks/useMonitorHumidityCharacteristic.ts

interface GenericBluetoothInformation {
    serialNumberString: string | null,
    deviceNameString: string | null,
    battery: number | null
}

interface Aranet4SpecificInformation {
    co2CharacteristicValue: Aranet4_1503CO2 | null,
    secondsSinceLastMeasurement: number | null,
    lastMeasurementTimeAsUTC: Date,
    measurementInterval: number | null,
}




export const manager = new BleManager();
manager.setLogLevel(LogLevel.Debug);

// const BleManagerModule = NativeModules.BleManager;
// const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);



// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function getCharacteristicFromDeviceService(device: Device, serviceUUID: string, characteristicUUID: string) {
    if (!device) {
        debugger;
    }
    const services = await device.services();
    const foundService = services.find((service) => service.uuid === serviceUUID);
    if (!foundService) {
        debugger;
        throw new Error("Whoops. Missing service.");
    }
    const characteristics = await foundService.characteristics();
    const foundCharacteristic = characteristics.find((characteristic) => characteristic.uuid === characteristicUUID);
    if (!foundCharacteristic) {
        debugger;
        throw new Error("Whoops. Missing characteristic.");
    }
    return foundCharacteristic;
}
function checkKnownFunctionDescription(characteristic: Characteristic) {
    if (BLUETOOTH.aranet4KnownCharacteristicUUIDDescriptions.has(characteristic.uuid)) {
        console.log(`\t\t\t${characteristic.uuid}: Known Aranet4 characteristic! '${BLUETOOTH.aranet4KnownCharacteristicUUIDDescriptions.get(characteristic.uuid)}'`);
        return;
    }
    else if (BLUETOOTH.GENERIC_GATT_SERVICE_UUID_DESCRIPTIONS.has(characteristic.uuid)) {
        console.log(`\t\t\t${characteristic.uuid}: Known generic GATT characteristic! '${BLUETOOTH.GENERIC_GATT_SERVICE_UUID_DESCRIPTIONS.get(characteristic.uuid)}'`);
        return;
    }
    console.log(`\t\t\tUNKNOWN GATT characteristic! '${characteristic.uuid}'`);
}

function dumpCharacteristics(characteristics: Characteristic[]) {
    for (let characteristicIndex = 0; characteristicIndex < characteristics.length; ++characteristicIndex) {
        const thisCharacteristic = characteristics[characteristicIndex];
        checkKnownFunctionDescription(thisCharacteristic);
    }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function dumpServiceDescriptions(services: Service[]) {
    for (let serviceIndex = 0; serviceIndex < services.length; ++serviceIndex) {
        const thisService = services[serviceIndex];
        console.log(`\tservice ${serviceIndex}:`)

        const short_uuid = thisService.uuid.substring(4, 8).toUpperCase();
        if (BLUETOOTH.GENERIC_GATT_SERVICE_UUID_DESCRIPTIONS.has(thisService.uuid)) {
            const serviceName = BLUETOOTH.GENERIC_GATT_SERVICE_UUID_DESCRIPTIONS.get(thisService.uuid);
            console.log(`\t\tservices[${serviceIndex}].uuid: ${thisService.uuid}... Known service! ${serviceName}`);
        }
        else if (BLUETOOTH.GENERIC_GATT_SERVICE_SHORT_ID_DESCRIPTIONS.has(short_uuid)) {
            const serviceName = BLUETOOTH.GENERIC_GATT_SERVICE_SHORT_ID_DESCRIPTIONS.get(short_uuid);
            console.log(`\t\tservices[${serviceIndex}].uuid: ${thisService.uuid}... Known service! ${serviceName}`);
        }

        // console.log(`\t\tid: ${thisService.id}`);
        const characteristics = await thisService.characteristics();
        dumpCharacteristics(characteristics);

    }
}


const scanCallback = async (error: BleError | null, scannedDevice: Device | null, dispatch: AppDispatch) => {
    if (error) {
        //TODO: if bluetooth is off, will get BleErrorCode.BluetoothPoweredOff (102);
        // debugger;
        if (error.errorCode === BleErrorCode.BluetoothPoweredOff) {
            console.log("Bluetooth off.");
            dispatch(setNeedsBluetoothTurnOn(true));
            dispatch(setScanningStatusString("Please turn bluetooth on."));

        }
        else {
            const str = `error scanning: ${error}`;
            console.error(str);
            Sentry.Native.captureMessage(str);
        }
        const str = `Cannot connect to device: ${error.message}, ${error.reason}`;
        dispatch(setScanningErrorStatusString(str));
        Sentry.Native.captureMessage(str);
        // Handle error (scanning will be stopped automatically)
        return;
    }


    dumpNewScannedDeviceInfo(scannedDevice);
    if (!scannedDevice) {
        return;
    }
    if (scannedDevice.name === null) {
        return;
    }
    if ((scannedDevice.name.startsWith('Aranet4'))) {
        await foundAranet4(scannedDevice, dispatch);
    }
}

const aranetService = [BLUETOOTH.ARANET4_SENSOR_SERVICE_UUID];

const scanAndIdentify = (dispatch: AppDispatch) => {
    
    dispatch(setScanningStatusString(`Beginning scan for devices with services: ${aranetService}...`));
    manager.startDeviceScan(aranetService, null, (error, scannedDevice) => scanCallback(error, scannedDevice, dispatch));
}

const requestAllBluetoothPermissions = async (dispatch: AppDispatch) => {
    dispatch(setScanningStatusString('Need permission to use bluetooth first.'));

    //https://reactnative.dev/docs/permissionsandroid
    const fineLocationResult = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);

    if (fineLocationResult === PermissionsAndroid.RESULTS.GRANTED) {
        // console.log("good");
        // dispatch(setHasBluetooth(true));
        dispatch(setScanningStatusString('Fine location permission granted! May need scan permission too...'));
        // Do something
    } else {
        console.log(`no good: ${fineLocationResult}`);
        dispatch(setScanningStatusString(`Bluetooth (location for bluetooth) permission denied by user: ${fineLocationResult}`));
        dispatch(setHasBluetooth(false));
        debugger;
        // Denied
        // Do something
    }
    
    // const scan = PermissionsAndroid.PERMISSIONS.android.permission.BLUETOOTH_SCAN;
    const scan = 'android.permission.BLUETOOTH_SCAN';
    // const typeofRequest = ((permission: string, rationale?: any): unknown)

    console.log(`Requesting bluetooth scan permission... ${scan}`);

    // This worked! It's disgusting enoguh that I don't want to use it, but I'm mildly impressed with myself.
    // const bluetoothScanResult = await (PermissionsAndroid.request as (permission: string) => Promise<any>)(scan);
    
    //Work around android.permission.BLUETOOTH_SCAN not existing in old version of react native...
    const bluetoothScanPermissionResult = await PermissionsAndroid.request(scan as Permission);
    console.log(`PermissionsAndroid.request(android.permission.BLUETOOTH_SCAN) result: ${bluetoothScanPermissionResult}`)
    if (bluetoothScanPermissionResult === PermissionsAndroid.RESULTS.GRANTED) {
        dispatch(setHasBluetooth(true));
        dispatch(setScanningStatusString('Bluetooth scan permission granted!'));
    }
    else {
        dispatch(setScanningStatusString(`Bluetooth scan permission denied by user: ${bluetoothScanPermissionResult}`));
        dispatch(setHasBluetooth(false));
    }
}

function parseUTF8StringBuffer(data: Buffer): string {
    const chars = new Array(data.byteLength);
    for (let i = 0; i < (data.byteLength); i++) {
        chars[i] = data.readUInt8(i);
    }
    const converted = String.fromCharCode.apply(null, chars);
    return converted;
}

function parseUint8Buffer(data: Buffer): number {
    if (data.byteLength > 1) {
        throw new Error("Only for parsing single byte buffers?")
    }

    const value = data.readUInt8(0);
    return value;
}

async function readStringCharacteristicFromDevice(deviceID: string, serviceUUID: string, characteristicUUID: string, serviceName: string, characteristicName: string): Promise<string> {
    const rawStringCharacteristicValue = await manager.readCharacteristicForDevice(deviceID, serviceUUID, characteristicUUID);
    if (rawStringCharacteristicValue.value === null) {
        debugger;
        throw new Error(`${serviceName}: ${characteristicName} value is null?`);
    }
    const stringCharacteristicAsBuffer = Buffer.from(rawStringCharacteristicValue.value, 'base64');
    const stringCharacteristicAsString = parseUTF8StringBuffer(stringCharacteristicAsBuffer);
    return stringCharacteristicAsString;
}

async function readSerialNumberFromBluetoothDevice(deviceID: string): Promise<string> {
    return readStringCharacteristicFromDevice(deviceID, BLUETOOTH.DEVICE_INFORMATION_SERVICE_UUID, BLUETOOTH.GENERIC_GATT_SERIAL_NUMBER_STRING_UUID, "DEVICE_INFORMATION_SERVICE_UUID", "GENERIC_GATT_SERIAL_NUMBER_STRING_UUID");
}

async function readUint8CharacteristicFromDevice(deviceID: string, serviceUUID: string, characteristicUUID: string, serviceName: string, characteristicName: string): Promise<number> {
    const rawUint8CharacteristicValue = await manager.readCharacteristicForDevice(deviceID, serviceUUID, characteristicUUID);
    if (rawUint8CharacteristicValue.value === null) {
        debugger;
        throw new Error(`${serviceName}: ${characteristicName} value is null?`);
    }
    const uint8CharacteristicAsBuffer = Buffer.from(rawUint8CharacteristicValue.value, 'base64');
    const uint8CharacteristicAsUint8 = parseUint8Buffer(uint8CharacteristicAsBuffer);
    return uint8CharacteristicAsUint8;
}

async function readUint16CharacteristicFromDevice(deviceID: string, serviceUUID: string, characteristicUUID: string, serviceName: string, characteristicName: string): Promise<number> {
    const rawUint16CharacteristicValue = await manager.readCharacteristicForDevice(deviceID, serviceUUID, characteristicUUID);
    if (rawUint16CharacteristicValue.value === null) {
        debugger;
        throw new Error(`${serviceName}: ${characteristicName} value is null?`);
    }
    const uint16CharacteristicAsBuffer = Buffer.from(rawUint16CharacteristicValue.value, 'base64');
    const uint16CharacteristicAsUint8 = uint16CharacteristicAsBuffer.readUInt16LE(0);
    return uint16CharacteristicAsUint8;
}



async function readDeviceNameFromBluetoothDevice(deviceID: string): Promise<string> {
    const deviceName = readStringCharacteristicFromDevice(deviceID, BLUETOOTH.GENERIC_ACCESS_SERVICE_UUID, BLUETOOTH.GENERIC_GATT_DEVICE_NAME_UUID, "GENERIC_ACCESS_SERVICE_UUID", "GENERIC_GATT_DEVICE_NAME_UUID");
    // console.log(`Device name: ${deviceName}`);
    return deviceName;
}

async function readBatteryLevelFromBluetoothDevice(deviceID: string): Promise<number> {
    const batteryPercent = readUint8CharacteristicFromDevice(deviceID, BLUETOOTH.BATTERY_SERVICE_UUID, BLUETOOTH.GENERIC_GATT_DEVICE_BATTERY_LEVEL_UUID, "BATTERY_SERVICE_UUID", "GENERIC_GATT_DEVICE_BATTERY_LEVEL_UUID");

    return batteryPercent
}


// function noDevice(deviceID: string | null): boolean {
//     if (deviceID === null) {
//         return true;
//     }
//     return false;
// }

function co2CharacteristicLogStringIfNotNull(co2CharacteristicMeasurement: Aranet4_1503CO2 | null): string {
    if (co2CharacteristicMeasurement === null) {
        return `(Co2 characterisitc was NULL - likely error reading?)`
    }
    return `CO2: ${co2CharacteristicMeasurement?.co2}ppm`

}

function logDeviceNameSerialAndCO2(genericInfo: GenericBluetoothInformation, co2CharacteristicMeasurement: Aranet4_1503CO2 | null, lastMeasurementTimeAsUTC: Date) {
    const co2LogString = co2CharacteristicLogStringIfNotNull(co2CharacteristicMeasurement);
    console.log(`\t(${timeNowAsString()}): Last measurement taken: ${lastMeasurementTimeAsUTC.toUTCString()} (UTC), Serial number: ${genericInfo.serialNumberString}, Device name: ${genericInfo.deviceNameString}, ${co2LogString}`);
}

async function readGenericBluetoothInformation(deviceID: string): Promise<GenericBluetoothInformation> {
    const serialNumberString = await readSerialNumberFromBluetoothDevice(deviceID);
    
    
    if (serialNumberString.length === 0) {
        console.warn(`Device ${deviceID} has an empty serial number string?`);
    }

    const deviceNameString = await readDeviceNameFromBluetoothDevice(deviceID)
    if (deviceNameString.length === 0) {
        console.warn(`Device ${deviceID} has an empty name?`);
    }
    const battery = await readBatteryLevelFromBluetoothDevice(deviceID);
    return {
        deviceNameString,
        serialNumberString,
        battery
    };

}
function co2MeasurementCharacteristicBufferToMeasurementState(co2CharacteristicAsBuffer: Buffer): Aranet4_1503CO2 {
    const co2Offset = BLUETOOTH.ARANET4_1503_CO2_SENSOR_CHARACTERISTIC_OFFSETS.get('CO2');
    const temperatureOffset = BLUETOOTH.ARANET4_1503_CO2_SENSOR_CHARACTERISTIC_OFFSETS.get('TEMPERATURE');
    const pressureOffset = BLUETOOTH.ARANET4_1503_CO2_SENSOR_CHARACTERISTIC_OFFSETS.get('PRESSURE');
    const humidityOffset = BLUETOOTH.ARANET4_1503_CO2_SENSOR_CHARACTERISTIC_OFFSETS.get('HUMIDITY');
    const batteryOffset = BLUETOOTH.ARANET4_1503_CO2_SENSOR_CHARACTERISTIC_OFFSETS.get('BATTERY');
    const statusColorOffset = BLUETOOTH.ARANET4_1503_CO2_SENSOR_CHARACTERISTIC_OFFSETS.get('STATUS_COLOR');
    if (co2Offset === undefined) {
        throw new Error("Compile time bug: co2 offset not in map!");
    }
    if (temperatureOffset === undefined) {
        throw new Error("Compile time bug: temperature offset not in map!");
    }
    if (pressureOffset === undefined) {
        throw new Error("Compile time bug: pressure offset not in map!");
    }
    if (humidityOffset === undefined) {
        throw new Error("Compile time bug: humidity offset not in map!");
    }
    if (batteryOffset === undefined) {
        throw new Error("Compile time bug: battery offset not in map!");
    }
    if (statusColorOffset === undefined) {
        throw new Error("Compile time bug: statusColor offset not in map!");
    }

    const co2 = co2CharacteristicAsBuffer.readUInt16LE(co2Offset);
    const rawTemperature = co2CharacteristicAsBuffer.readUInt16LE(temperatureOffset);
    const temperature = rawTemperature / 20;
    const rawPressure = co2CharacteristicAsBuffer.readUInt16LE(pressureOffset);
    const pressure = rawPressure / 10;
    const humidity = co2CharacteristicAsBuffer.readUInt8(humidityOffset);
    const battery = co2CharacteristicAsBuffer.readUInt8(batteryOffset);
    const statusColor = co2CharacteristicAsBuffer.readUInt8(BLUETOOTH.ARANET4_1503_CO2_SENSOR_CHARACTERISTIC_OFFSETS.get('STATUS_COLOR'));
    const measurementState: Aranet4_1503CO2 = {
        co2,
        temperatureC: temperature,
        barometricPressure: pressure,
        humidity,
        battery,
        statusColor,
    };

    return measurementState
}

async function readAranet4Co2Characteristic(deviceID: string): Promise<Aranet4_1503CO2 | null> {
    const rawCO2CharacteristicValue = await manager.readCharacteristicForDevice(deviceID, BLUETOOTH.ARANET4_SENSOR_SERVICE_UUID, BLUETOOTH.ARANET_CO2_MEASUREMENT_CHARACTERISTIC_UUID);
    if (rawCO2CharacteristicValue.value === null) {
        debugger;
        throw new Error("ARANET_CO2_MEASUREMENT_CHARACTERISTIC_UUID.value is null?")
    }
    const co2CharacteristicAsBuffer = Buffer.from(rawCO2CharacteristicValue.value, 'base64');
    console.assert(co2CharacteristicAsBuffer.length === (72 / 8));
    const measurementState = co2MeasurementCharacteristicBufferToMeasurementState(co2CharacteristicAsBuffer);

    return measurementState;
}


async function readAranet4SecondsSinceLastMeasurementCharacteristic(deviceID: string): Promise<number> {
    return readUint16CharacteristicFromDevice(deviceID, BLUETOOTH.ARANET4_SENSOR_SERVICE_UUID, BLUETOOTH.ARANET_SECONDS_LAST_UPDATE_UUID, "BLUETOOTH.ARANET4_SENSOR_SERVICE_UUID", "BLUETOOTH.ARANET_SECONDS_LAST_UPDATE_UUID");
}

async function readAranet4MeasurementInterval(deviceID: string): Promise<number> {
    return readUint16CharacteristicFromDevice(deviceID, BLUETOOTH.ARANET4_SENSOR_SERVICE_UUID, BLUETOOTH.ARANET_MEASUREMENT_INTERVAL_UUID, "BLUETOOTH.ARANET4_SENSOR_SERVICE_UUID", "BLUETOOTH.ARANET_MEASUREMENT_INTERVAL_UUID");
}

function aranet4Ready(device: Device | null): boolean {
    if (!device) {
        return false;
    }
    if (!device.serviceUUIDs) {
        return false;
    }
    if (device?.serviceUUIDs?.includes(BLUETOOTH.ARANET4_SENSOR_SERVICE_UUID)) {
        return true;
    }
    console.warn("Device has service UUIDs but not the one we want??");
    return false;
}

async function readAranet4SpecificInformation(deviceID: string, dispatch: AppDispatch): Promise<Aranet4SpecificInformation> {
    // if(!device?.serviceUUIDs?.includes(BLUETOOTH.ARANET4_SENSOR_SERVICE_UUID)) {
    //     debugger;
    // }
    const co2CharacteristicValue = await readAranet4Co2Characteristic(deviceID)
    
    // console.log(`Aranet4 measurement:`);
    // console.log(`\tCO2: ${co2CharacteristicMeasurement?.co2}ppm`);
    // console.log(`\tTemperature: ${co2CharacteristicMeasurement?.temperatureC}C`);
    // console.log(`\tHumidity: ${co2CharacteristicMeasurement?.humidity}%`);

    dispatch(setDeviceStatusString('Reading aranet4 seconds since last measurement...'));
    const secondsSinceLastMeasurement = await readAranet4SecondsSinceLastMeasurementCharacteristic(deviceID)
    /*

            if (action.payload) {
                const now = Date.now();
                const seconds = action.payload * 1000;
                state.device.aranet4SpecificData.aranet4MeasurementTime = (new Date(now - seconds)).toLocaleTimeString();
            }


            ...

            dispatch(setAranet4SecondsSinceLastMeasurement(aranet4SpecificInformation.secondsSinceLastMeasurement));
    */

    const now = Date.now();
    const seconds = secondsSinceLastMeasurement * 1000;
    const lastMeasurementTimeAsUTC = (new Date(now - seconds));
    // console.log(`Last measurement taken: ${lastMeasurementTimeAsUTC.toUTCString()} (UTC)`);


    dispatch(setDeviceStatusString('Reading aranet4 measurement interval...'));
    const measurementInterval = await readAranet4MeasurementInterval(deviceID);
    // console.log(`Measurement interval: ${interval}`)

    return {
        co2CharacteristicValue,
        measurementInterval,
        secondsSinceLastMeasurement,
        lastMeasurementTimeAsUTC
    }
}


const headlessForegroundScanConnectRead = async (deviceID: string, supportedDevices: UserInfoDevice[]): Promise<Aranet4GenericAndSpecificInformation | boolean> => {    
    try {


        const connectedDevice = await connectOrAlreadyConnected(deviceID);

    
        if (connectedDevice === null) {
            console.error("Connection to aranet4 failed.");
            return false;
        }
        if (connectedDevice === true) {
            console.error("connection failed, but should retry...");
            return true;
        }
        if (connectedDevice === false) {
            return false;
        }
    
        console.log("Discovering services and characteristics...");
        const deviceWithServicesAndCharacteristics = await connectedDevice.discoverAllServicesAndCharacteristics();
        
        console.log("Connected to aranet4, services discovered!");
    
        const services = await deviceWithServicesAndCharacteristics.services();
        const hasServiceSanityCheck = checkContainsAranet4Service(services);
        if (!hasServiceSanityCheck) {
            console.warn("Missing aranet4 service?");
        }
    
        const genericInfo = await readGenericBluetoothInformation(deviceID);
        // const aranet4Info = await readAranet4SpecificInformation(deviceID, dispatch);
        
        
        const co2CharacteristicValue = await readAranet4Co2Characteristic(deviceID);
        
        
        const secondsSinceLastMeasurement = await readAranet4SecondsSinceLastMeasurementCharacteristic(deviceID)
        const now = Date.now();
        const seconds = secondsSinceLastMeasurement * 1000;
        const lastMeasurementTimeAsUTC = (new Date(now - seconds));
        logDeviceNameSerialAndCO2(genericInfo, co2CharacteristicValue, lastMeasurementTimeAsUTC);
        // console.log(`Last measurement taken: ${lastMeasurementTimeAsUTC.toUTCString()} (UTC)`);
    
    
        const measurementInterval = await readAranet4MeasurementInterval(deviceID);
    
        /*
    
        
        return {
            co2CharacteristicValue: co2CharacteristicMeasurement,
            measurementInterval: interval,
            secondsSinceLastMeasurement,
            lastMeasurementTimeAsUTC: lastMeasurementTime
        }
    
                return {
                specificInfo: aranet4Info,
                genericInfo
            };
    
    */
        // const closed = await manager.cancelDeviceConnection(deviceID);
        return {
            specificInfo: {
                co2CharacteristicValue,
                measurementInterval,
                secondsSinceLastMeasurement,
                lastMeasurementTimeAsUTC
            },
            genericInfo
        }

    }
    catch(error) {
        const filtered = headlessFilterBleReadError(error, deviceID);
        if (!filtered.retry) {
            Sentry.Native.captureMessage(`NON-RETRYABLE ble error: ${filtered.message}`);
        }
        const retryable = filtered.retry ? "Retryable " : "Non-retryable ";
        console.log(`${retryable}error: ${filtered.message}`);
        console.log(`\terror fitered: ${JSON.stringify(filtered)}`)
        // if (!filtered.retry) {
        //     debugger;
        // }
        return filtered.retry;
    }

}
const headlessForegroundScanConnectReadWithRetry = async (deviceID: string, supportedDevices: UserInfoDevice[]): Promise<Aranet4GenericAndSpecificInformation | null> => {
    const updatedOrNeedsRetry = await headlessForegroundScanConnectRead(deviceID, supportedDevices);
    if (updatedOrNeedsRetry === false) {
        console.warn("non recoverable error, not retrying...");
        return null;
    }
    if (updatedOrNeedsRetry === true) {
        console.warn(`Retrying ONCE...`);
        const triedAgainOrNeedsRetry = await headlessForegroundScanConnectRead(deviceID, supportedDevices);

        if (triedAgainOrNeedsRetry === false) {
            return null;
        }
        if (triedAgainOrNeedsRetry === true) {
            return null;
        }
        return triedAgainOrNeedsRetry;
    }

    return updatedOrNeedsRetry;
    
}


export const onHeadlessTaskTriggerBluetooth = async (deviceID: string, supportedDevices: UserInfoDevice[]): Promise<MeasurementDataForUpload | null> => {
    const updated = await headlessForegroundScanConnectReadWithRetry(deviceID, supportedDevices);
    if (updated === null) {
        console.error("failed to read in headless task!");
        // debugger;
        return null;
    }
    if (updated.specificInfo.co2CharacteristicValue === null) {
        console.log("Missing co2 value in headless task??");
        return null;
    }
    if (updated.genericInfo.serialNumberString === null) {
        console.log("Missing serial number in headless task?");
        return null;
    }

    const deviceIDInDatabase = deviceIDFromUserInfoDevice(supportedDevices, updated.genericInfo.serialNumberString);
    const fullMeasurement: MeasurementDataForUpload = {
        co2ppm: updated.specificInfo.co2CharacteristicValue.co2,
        measurementtime: updated.specificInfo.lastMeasurementTimeAsUTC,
        device_id: deviceIDInDatabase
    };
    
    return fullMeasurement;

    /*

    const updated = await updateCallback(deviceID, dispatch, beginWithDeviceConnection, finish);
    if (updated === undefined) {
        console.log("Failed to read measurement from known device. Nothing to upload");
        // debugger;
        return;
    }


    
    const fullMeasurement: MeasurementDataForUpload = {
        co2ppm: updated.specificInfo.co2CharacteristicValue.co2,
        measurementtime: updated.specificInfo.lastMeasurementTimeAsUTC,
        device_id: deviceIDInDatabase
    };
    setMeasurement(fullMeasurement);

    */
}

function checkContainsAranet4Service(services: Service[]): boolean {
    const found = services.find((service) => {return service.uuid === BLUETOOTH.ARANET4_SENSOR_SERVICE_UUID});
    if (found === undefined) {
        return false;
    }
    return true;
}

const beginWithDeviceConnection = async (deviceID: string | null, dispatch: AppDispatch) => {
    if (deviceID === null) {
        debugger;
        return null;
    }
    // const connectedDevice = await attemptConnectScannedDevice(deviceID, device);
    const connectedDevice = await connectOrAlreadyConnected(deviceID);

    if (connectedDevice === null) {
        dispatch(setScanningErrorStatusString("Connection to aranet4 failed."));
        return null;
    }
    if (connectedDevice === true) {
        dispatch(setScanningErrorStatusString("Connection to aranet4 failed... Likely will work if tried again"));
        return null;
    }
    if (connectedDevice === false) {
        throw new Error("Connection to aranet4 failed: BUG");
    }

    dispatch(setScanningStatusString(`Connected to aranet4 ${deviceID}). Discovering services and characteristics...`));
    const deviceWithServicesAndCharacteristics = await connectedDevice.discoverAllServicesAndCharacteristics();

    dispatch(setScanningStatusString("Connected to aranet4, services discovered!"));

    const services = await deviceWithServicesAndCharacteristics.services();
    const hasServiceSanityCheck = checkContainsAranet4Service(services);
    if (!hasServiceSanityCheck) {
        console.warn("Missing aranet4 service?");
    }
    const withRSSI = await deviceWithServicesAndCharacteristics.readRSSI();

    
    if (withRSSI.rssi) {
        dispatch(setRssi(withRSSI.rssi));
    }
    else {
        console.error("No rssi?");
        debugger;
        dispatch(setScanningErrorStatusString("RSSI field missing. Huh?"));
    }
    dispatch(setScanningStatusString(null));
    return withRSSI;
}

// const finish = async (deviceID: string, setDevice: React.Dispatch<React.SetStateAction<Device | null>>) => {
//     // if (deviceID === null) {
//     //     debugger;
//     //     console.error("Called in incorrect order.")
//     //     throw new Error("broken.");
//     // }
//     // const closed = await manager.cancelDeviceConnection(deviceID);
    
//     // return closed;
//     // console.log("Device connection closed.");

// }

const updateAranet4SpecificInformation = async (deviceID: string, dispatch: AppDispatch) => {
    
    dispatch(setDeviceStatusString('Reading aranet4 specific information...'));
    const read = await readAranet4SpecificInformation(deviceID, dispatch);
    // setAranet4SpecificInformation(read);
    dispatch(setDeviceStatusString('Done reading aranet4 specific information...'));
    return read;
}

function bleErrorToUsefulString(error: BleError): string {
    const asStringManualFormat = `Error name: "${error.name}", error message: "${error.message}", error code: "${error.errorCode}", error reason: "${error.reason}", error code (IOS specific): "${error.iosErrorCode}", error code (android specific): "${error.androidErrorCode}", error code (ATT specific, whatever that is): "${error.attErrorCode}"`;
    console.log(`formatted BLE error string for human consumption: ${asStringManualFormat}`);
    return asStringManualFormat;
}

interface BleErrorInfo {
    retry: boolean;
    message: string | null;

}

function headlessFilterBleReadError(error: unknown, deviceID: string | null): BleErrorInfo {
    if (error instanceof BleError) {
        if (error.errorCode === BleErrorCode.OperationCancelled) {
            return {
                message: 'Bluetooth read was cancelled for some reason. Will try again.',
                retry: true
            }
        }
        if (error.errorCode === BleErrorCode.DeviceNotConnected) {
            console.log(`Device ${deviceID} not connected. Data not available. Will try again.`);
            return {
                message: '(headless) Read failed, connection lost! Will try again..',
                retry: true
            }
        }
        if (error.errorCode === BleErrorCode.DeviceDisconnected) {
            console.log(`(headless) Device ${deviceID} connection LOST. Data not available. Will try again.`);
            return {
                message: 'Read failed, connection lost! Will try again..',
                retry: true
            }
        }
        if (error.errorCode === BleErrorCode.DeviceAlreadyConnected) {
            console.log(`Device ${deviceID} already connected!`);
            return {
                message: null,
                retry: true
            }
        }
        if (error.errorCode === BleErrorCode.OperationTimedOut) {
            console.log(`Bluetooth operation timed out.`);
            return {
                message: 'Read failed, OS reports operation timed out! Will try again..',
                retry: true
            }
        }
        if (error.errorCode === BleErrorCode.BluetoothPoweredOff) {
            console.log(`Bluetooth is powered off. Will power back on.`);
            manager.enable();
            return {
                message: 'Bluetooth was powered off. Will try again..',
                retry: true
            }
        }
        //0x11 === GATT_INSUF_RESOURCE
        //Need to cast because react-native-ble-plx doesn't enumerate this? :)
        if ((error.androidErrorCode as number) === 0x11) {
            return {
                message: "Your device didn't even have enough memory to process the error message! There's something wrong, I will NOT try again. I didn't expect to see this problem, ever!",
                retry: false
            }
        }
        //NoResources === 0x80
        if (error.androidErrorCode === BleAndroidErrorCode.NoResources) {
            console.error("Your device is out of memory, no point in trying again!");
        }
        //0x81 === GATT_INTERNAL_ERROR (android messed up)
        if (error.androidErrorCode === 0x81) {
            console.log("Google screwed up!");
            return {
                message: `Android did something wrong (GATT_INTERNAL_ERROR: ${bleErrorToUsefulString(error)}), nothing I can do except try again...`,
                retry: true
            }
        }
        //0x85 === GATT_ERROR (a generic error)
        if (error.androidErrorCode === 0x85) {
            console.log("Stupid-ass generic android error: https://cs.android.com/android/platform/superproject/+/master:packages/modules/Bluetooth/system/stack/include/gatt_api.h;l=65?q=%20%22GATT_ERROR%22&start=1");
            return {
                message: 'Read failed, android gives no specific reason... Will try again..',
                retry: true
            }
        }
        if (error.androidErrorCode === 0x89) {
            console.log("Authentication failed.");
            return {
                message: 'Read failed, authentication failed or you cancelled it... Will try again..',
                retry: true
            }
        }
        const unexpectedStr = `----UNEXPECTED bluetooth error while reading from device: ${bleErrorToUsefulString(error)}----`;
        console.error(unexpectedStr);
        Sentry.Native.captureMessage(unexpectedStr);
        debugger;
        throw error;
    }
    const unexpectedStr = `----UNEXPECTED error while reading from device: ${String(error)}----`;
    console.error(unexpectedStr);
    Sentry.Native.captureMessage(unexpectedStr);
    debugger;
    throw error;
}

function filterBleReadError(error: unknown, dispatch: AppDispatch, deviceID: string | null): void | boolean {
    if (error instanceof BleError) {
        if (error.errorCode === BleErrorCode.OperationCancelled) {
            dispatch(setDeviceStatusString('Bluetooth read was cancelled for some reason. Will try again.'));
            return true;
        }
        if (error.errorCode === BleErrorCode.DeviceNotConnected) {
            console.log(`Device ${deviceID} not connected. Data not available. Will try again.`);
            dispatch(setDeviceStatusString('Read failed, connection lost! Will try again..'));
            return true;
        }
        if (error.errorCode === BleErrorCode.DeviceDisconnected) {
            console.log(`Device ${deviceID} connection LOST. Data not available. Will try again.`);
            dispatch(setDeviceStatusString('Read failed, connection lost! Will try again..'));
            return true;
        }
        if (error.errorCode === BleErrorCode.DeviceAlreadyConnected) {
            console.log(`Device ${deviceID} already connected!`);
            dispatch(setDeviceStatusString(null));
            return true;
        }
        if (error.errorCode === BleErrorCode.OperationTimedOut) {
            console.log(`Bluetooth operation timed out.`);
            dispatch(setDeviceStatusString('Read failed, OS reports operation timed out! Will try again..'));
            return true;
        }
        if (error.errorCode === BleErrorCode.BluetoothPoweredOff) {
            console.log(`Bluetooth is powered off. Will power back on.`);
            dispatch(setDeviceStatusString('Read failed, Bluetooth is powered off. Will power back on and try again.'));
            manager.enable();
            return true;
        }

        //0x11 === GATT_INSUF_RESOURCE
        //Need to cast because react-native-ble-plx doesn't enumerate this? :)
        if ((error.androidErrorCode as number) === 0x11) {
            dispatch(setDeviceStatusString("Your device didn't even have enough memory to process the error message! There's something wrong, I will NOT try again. I didn't expect to see this problem, ever!"));
            debugger;
            return false;
        }
        //NoResources === 0x80
        if (error.androidErrorCode === BleAndroidErrorCode.NoResources) {
            dispatch(setDeviceStatusString("Your device is out of memory, no point in trying again!"));
        }
        //0x81 === GATT_INTERNAL_ERROR (android messed up)
        if (error.androidErrorCode === 0x81) {
            console.log("Google screwed up!");
            dispatch(setDeviceStatusString("Android did something wrong (GATT_INTERNAL_ERROR), nothing I can do except try again..."));
            return true;
        }
        //0x85 === GATT_ERROR (a generic error)
        if (error.androidErrorCode === 0x85) {
            console.log("Stupid-ass generic android error: https://cs.android.com/android/platform/superproject/+/master:packages/modules/Bluetooth/system/stack/include/gatt_api.h;l=65?q=%20%22GATT_ERROR%22&start=1");
            dispatch(setDeviceStatusString('Read failed, android gives no specific reason... Will try again..'));
            return true;
        }
        if (error.androidErrorCode === 0x89) {
            console.log("Authentication failed.");
            dispatch(setDeviceStatusString('Read failed, authentication failed or you cancelled it... Will try again..'));
            return true;
        }
        const unexpectedStr = `Unexpected bluetooth error while reading from device: ${bleErrorToUsefulString(error)}`;
        dispatch(setDeviceStatusString(unexpectedStr));
        Sentry.Native.captureMessage(unexpectedStr);
        debugger;
        throw error;
    }
    const unexpectedStr = `Unexpected error while reading from device: ${String(error)}`;
    dispatch(setDeviceStatusString(unexpectedStr));
    Sentry.Native.captureMessage(unexpectedStr);
    debugger;
    throw error;
}

async function forceEnableBluetooth(dispatch: AppDispatch) {
    const bluetothState = await manager.state();
    if (bluetothState === State.PoweredOff) {
        dispatch(setScanningStatusString(`Bluetooth powered off, turning on...`));
        await manager.enable();
        dispatch(setScanningStatusString(`Bluetooth turned on!`));
        dispatch(setScanningErrorStatusString(null));
    }
    else {
        dispatch(setScanningStatusString(`Bluetooth manager status: ${bluetothState}`));
    }
}

interface Aranet4GenericAndSpecificInformation {
    specificInfo: Aranet4SpecificInformation,
    genericInfo: GenericBluetoothInformation
}

async function updateCallback(deviceID: string, dispatch: AppDispatch): Promise<Aranet4GenericAndSpecificInformation | undefined> {
    // console.log("update co2 triggered!");
    dispatch(setDeviceStatusString("Updating CO2 over bluetooth..."));
    
    try {
        await forceEnableBluetooth(dispatch);
        const deviceOrNull = await beginWithDeviceConnection(deviceID, dispatch);
        if (deviceOrNull === null) {
            console.error("connection failed.");
            return;
        }
        const genericInfo = await readGenericBluetoothInformation(deviceID);
        dispatch(setDeviceStatusString('Reading generic bluetooth information...'));
        
        const specificInfo = await updateAranet4SpecificInformation(deviceID, dispatch);
        // console.log(`Last measurement taken: ${specificInfo.lastMeasurementTimeAsUTC.toUTCString()} (UTC)`);
        logDeviceNameSerialAndCO2(genericInfo, specificInfo.co2CharacteristicValue, specificInfo.lastMeasurementTimeAsUTC);
        dispatch(setDeviceStatusString(null));
        dispatch(incrementUpdates());
        // const closed = await finish(deviceID, setDevice);
        // setDevice(closed);
        /*
            device_id: number,
            co2ppm: number,
            measurementtime: Date,
            google_place_id: string,
            sub_location_id: number
        */
       if (specificInfo.co2CharacteristicValue === null) {
           debugger;
           console.warn("missing co2 characteristic result!");
           return;
       }
        return {
            specificInfo,
            genericInfo
        };
    }
    catch(error) {
        console.log(`update callback exception handler...`);
        if (!filterBleReadError(error, dispatch, deviceID)) {
            debugger;
        }
    }
}

async function pollAranet4(setTimeoutHandle: React.Dispatch<React.SetStateAction<NodeJS.Timeout | null>>, deviceID: string, dispatch: AppDispatch, supportedDevices: UserInfoDevice[] | null, setMeasurement: React.Dispatch<React.SetStateAction<MeasurementDataForUpload | null>>, loggedIn: boolean) {
    setTimeoutHandle(null);
    if (deviceID === '?') {
        debugger;
    }

    console.log("polling in foreground...");
    const updated = await updateCallback(deviceID, dispatch);
    if (updated === undefined) {
        console.warn("Failed to read measurement from known device. Nothing to upload");
        return;
    }
    // console.log(JSON.stringify(updated));

    dispatch(setDeviceSerialNumber(updated.genericInfo.serialNumberString));
    dispatch(setDeviceName(updated.genericInfo.deviceNameString));
    setFromAranet4SpecificInfo(dispatch, updated.specificInfo);
    if (updated.specificInfo.co2CharacteristicValue === null) {
        console.error("missing co2");
        return;
    }
    if (supportedDevices === null) {
        if (!loggedIn) {
            dispatch(setUploadStatus('Please log in.'));
            return;
        }
        dispatch(setUploadStatus('Still loading user devices, cannot upload measurement to server. This should go away in a minute or so.'));
        return;
    }
    else {
        dispatch(setUploadStatus(null));
    }
    if (updated.genericInfo.serialNumberString === null) {
        console.error("missing serial number AFTER read?");
        return;
    }
    if (supportedDevices.length === 0) {
        dispatch(setUploadStatus(`You haven't configured any devices in the web interface! You need to do that before you can upload data :)`));
        return;
    }
    const deviceIDInDatabase = deviceIDFromUserInfoDevice(supportedDevices, updated.genericInfo.serialNumberString);
    const fullMeasurement: MeasurementDataForUpload = {
        co2ppm: updated.specificInfo.co2CharacteristicValue.co2,
        measurementtime: updated.specificInfo.lastMeasurementTimeAsUTC,
        device_id: deviceIDInDatabase
    };
    setMeasurement(fullMeasurement);
}

function setFromAranet4SpecificInfo(dispatch: AppDispatch, aranet4SpecificInformation: Aranet4SpecificInformation) {
    dispatch(setMeasurementInterval(aranet4SpecificInformation.measurementInterval));
    dispatch(setAranet4SecondsSinceLastMeasurement(aranet4SpecificInformation.secondsSinceLastMeasurement));
    if (aranet4SpecificInformation.co2CharacteristicValue !== null) {
        dispatch(setMeasurementDataFromCO2Characteristic(aranet4SpecificInformation.co2CharacteristicValue));
        dispatch(setDeviceBatteryLevel(aranet4SpecificInformation.co2CharacteristicValue.battery));
        dispatch(setAranet4Color(aranet4SpecificInformation.co2CharacteristicValue.statusColor));
    }
}

export const useBluetoothConnectAndPollAranet = () => {
    const dispatch = useDispatch();

    const hasBluetooth = useSelector(selectHasBluetooth);
    const supportedDevices = useSelector(selectSupportedDevices);
    const [knownDeviceBluetooth, setKnownDeviceBluetooth] = useState(null as (boolean | null));
    
    const needsBluetoothTurnOn = useSelector(selectNeedsBluetoothTurnOn);
    
    const deviceID = useSelector(selectDeviceID);
    const serialNumberString = useSelector(selectDeviceSerialNumberString);

    // const [device, setDevice] = useState(null as (Device | null));
    const [timeoutHandle, setTimeoutHandle] = useState(null as (null | NodeJS.Timeout));
    // const [aranet4SpecificInformation, setAranet4SpecificInformation] = useState(null as (null | Aranet4SpecificInformation));
    const [measurement, setMeasurement] = useState(null as (MeasurementDataForUpload | null));
    

        //measurementInterval
        //secondsSinceLastMeasurement
    
    const measurementInterval = useSelector(selectMeasurementInterval);
    const lastMeasurementTime = useSelector(selectMeasurementTime);

    const backgroundPollingEnabled = useSelector(selectBackgroundPollingEnabled);

    const {loggedIn} = useIsLoggedIn();

    useEffect(() => {
        requestAllBluetoothPermissions(dispatch);
    }, []);

    useEffect(() => {
        if (!hasBluetooth) {
            return;
        }
        if (needsBluetoothTurnOn) {
            return;
        }
        scanAndIdentify(dispatch);
    }, [hasBluetooth, needsBluetoothTurnOn]);



    useEffect(() => {
        const known = isSupportedDevice(supportedDevices, serialNumberString);
        // console.log(`Setting device known to ${knownBluetooth}`);
        setKnownDeviceBluetooth(known);
        // debugger;
        if (known) {
            console.log(`Device ${serialNumberString} is known to bluetooth hook!`);
            dispatch(setUploadStatus(null));
            return;
        }
        if (known === null) {
            dispatch(setUploadStatus("Loading user devices from server..."));
            return;
        }
        console.log(`Device ${serialNumberString} is NOT known to bluetooth hook!`);
        dispatch(setUploadStatus(`Device ${serialNumberString} is NOT a known device. Please add in the web console.`));
    }, [supportedDevices, serialNumberString])

    useEffect(() => {
        if (deviceID === null) {
            return;
        }
        if (!hasBluetooth) {
            dispatch(setDeviceStatusString("User has NOT granted bluetooth permissions. Beginning first read over bluetooth anyways..."));
        }
        else {
            dispatch(setDeviceStatusString(`Beginning first read over bluetooth... device known: ${knownDeviceBluetooth}`));
        }

        // console.log(`First bluetooth read, deviceID ${deviceID}`);

        firstBluetoothUpdate(deviceID, dispatch).then((info) => {
            if (info === undefined) {
                return;
            }
            dispatch(setDeviceSerialNumber(info.genericInfo.serialNumberString));
            dispatch(setDeviceName(info.genericInfo.deviceNameString));
            return setFromAranet4SpecificInfo(dispatch, info.specificInfo);

            // setAranet4SpecificInformation(info.specificInfo);
        }).catch((error) => {
            Sentry.Native.captureException(error);
            dispatch(setScanningErrorStatusString(`Unexpected error on first bluetooth update: ${String(error)}`));
        })
    }, [deviceID])


    useEffect(() => {
        // console.log(`deviceID ${deviceID}, timeoutHandle ${timeoutHandle}, knownDeviceBluetooth ${knownDeviceBluetooth}, backgroundPollingEnabled ${backgroundPollingEnabled}`);
        if (timeoutHandle !== null) {
            // console.log("Timeout already set, ignoring.")
            return;
        }

        if (deviceID === null) {
            return;
        }
        if (backgroundPollingEnabled) {
            console.log("NOT polling in foreground, backgroundPollingEnabled");
            return;
        }
        //measurementInterval
        //secondsSinceLastMeasurement

        const lastMeasurementTimeDate = (lastMeasurementTime !== null) ? new Date(lastMeasurementTime) : new Date(Date.now());
        const timerTime = maybeNextMeasurementInOrDefault(measurementInterval, lastMeasurementTimeDate);
        console.log(`timerTime: ${timerTime/1000} seconds`);
        const handle = setTimeout(() => pollAranet4(setTimeoutHandle, deviceID, dispatch, supportedDevices, setMeasurement, loggedIn), timerTime);
        // console.log(`Set update timer: ${handle}`)
        setTimeoutHandle(handle);

        return () => {
            if (timeoutHandle !== null) {
                console.log("Clearing co2 timer...");
                clearTimeout(timeoutHandle);
                setTimeoutHandle(null);
                clearTimeout(handle);
            }
        }
    }, [deviceID, timeoutHandle, knownDeviceBluetooth, backgroundPollingEnabled, supportedDevices])



    return { measurement };
}

async function firstBluetoothUpdate(deviceID: string, dispatch: AppDispatch): Promise<Aranet4GenericAndSpecificInformation | undefined>  {
    try {
        //FIRST and ONLY the first of these.
        // const deviceOrNull = await beginWithDeviceConnection(deviceID, device, dispatch);
        const connectedDevice = await connectOrAlreadyConnected(deviceID);

        if (connectedDevice === null) {
            dispatch(setScanningErrorStatusString("Connection to aranet4 failed."));
            return;
        }
        if (connectedDevice === true) {
            dispatch(setScanningErrorStatusString("Connection to aranet4 failed... Likely will work if tried again"));
            return;
        }
        if (connectedDevice === false) {
            throw new Error("Connection to aranet4 failed: BUG");
        }
        dispatch(setScanningStatusString(`Connected to aranet4 ${deviceID}). Discovering services and characteristics...`));
        const deviceWithServicesAndCharacteristics = await connectedDevice.discoverAllServicesAndCharacteristics();

        dispatch(setScanningStatusString("Connected to aranet4, services discovered!"));

        const services = await deviceWithServicesAndCharacteristics.services();
        const hasServiceSanityCheck = checkContainsAranet4Service(services);
        if (!hasServiceSanityCheck) {
            console.warn("Missing aranet4 service?");
        }
    

        
        dispatch(setDeviceStatusString('Reading generic bluetooth information...'));
        const genericInfo = await readGenericBluetoothInformation(deviceID);
        
        const specificInfo = await updateAranet4SpecificInformation(deviceID, dispatch);
        
        logDeviceNameSerialAndCO2(genericInfo, specificInfo.co2CharacteristicValue, specificInfo.lastMeasurementTimeAsUTC);
        // await finish(deviceID);
        dispatch(setDeviceStatusString(null));
        dispatch(incrementUpdates());

        return {
            genericInfo,
            specificInfo
        }
    }
    catch (error) {
        console.log(`First bluetooth read exception handler...`);
        if (!filterBleReadError(error, dispatch, deviceID)) {
            console.error(`UNHANDLED ble read error: ${String(error)}, device: ${deviceID}`);
        }
    }
}

const connectOrAlreadyConnected = async (deviceID: string): Promise<Device | boolean | null> => {
    // console.log(`Checking if ${deviceID} is connected first...`);
    const isConnected = await manager.isDeviceConnected(deviceID);
    if (!isConnected) {
        // console.log("NOT connected, connecting...");
        return manager.connectToDevice(deviceID);
    }
    // console.log("connected, checking connection manager for connection...");
    const connectedDevices = await manager.connectedDevices([BLUETOOTH.ARANET4_SENSOR_SERVICE_UUID]);
    if (connectedDevices.length === 0) {
        console.log(`Manager reports ZERO connected devices`);
    }
    if (connectedDevices.length > 1) {
        console.log(`Manager reports ${connectedDevices.length} connected devices`);
    }
    
    const inConnectedDevices = connectedDevices.find((eachDevice) => eachDevice.id === deviceID);
    if (inConnectedDevices === undefined) {
        const err = "BUG! device is connected, but not in connected devices? Maybe race condition? Maybe try again?";
        console.error(err);
        Sentry.Native.captureMessage(err);
        return true;
    }
    return inConnectedDevices;
}


async function attemptConnectScannedDevice(scannedDevice: DeviceId, device: Device | null): Promise<Device | null> {
    // console.log(`Attempting connection to ${scannedDevice}`);
    if (device !== null) {
        const isAlreadyConnected = await device.isConnected();
        if (isAlreadyConnected) {
            console.log('ALREADY connected, returning extant device object');
            return device;
        }
    }
    const connectedDevice = await manager.connectToDevice(scannedDevice);
    // console.log("Connected!");
    return connectedDevice;

}


async function foundAranet4(scannedDevice: Device, dispatch: AppDispatch) {
    dispatch(setScanningStatusString(`Found aranet4! (${scannedDevice.id}) Connecting...`));
    // console.log("Connecting to aranet4...");
    if (scannedDevice.id) {
        if (scannedDevice.id === '?') {
            debugger;
        }
        dispatch(setDeviceID(scannedDevice.id));
    }
    else {
        //TODO: bubble error up?
        console.error("No ID?");
        debugger;
    }
    if (scannedDevice.name) {
        dispatch(setDeviceName(scannedDevice.name));
    }
    else {
        console.error("No name?");
        debugger;
    }
    manager.stopDeviceScan();
    // debugger;
}

async function headlessFoundAranet4(scannedDevice: Device) {
    console.log("Connecting to aranet4...");
    if (scannedDevice.id) {
        if (scannedDevice.id === '?') {
            debugger;
        }
    }
    else {
        //TODO: bubble error up?
        console.error("No ID?");
        debugger;
    }
    manager.stopDeviceScan();
}


function dumpNewScannedDeviceInfo(scannedDevice: Device | null) {
    // console.log("New device!");
    if (scannedDevice) {
        if (scannedDevice.id) {
            console.log(`\tscannedDevice.id: ${scannedDevice.id}`);
        }
        if (scannedDevice.localName) {
            console.log(`\tscannedDevice.localName ${scannedDevice.localName}`);
        }
        if (scannedDevice.name) {
            console.log(`\tscannedDevice.name: ${scannedDevice.name}`);
        }
        if (scannedDevice.serviceData) {
            // console.log(`\tscannedDevice.serviceData: ${scannedDevice.serviceData}`);
            Object.keys(scannedDevice.serviceData).forEach((service) => {
                const data = scannedDevice.serviceData;
                if (data === null) {
                    console.warn("missing?");
                    return;
                }
                console.log(`\t\t${service}: ${data[service]}`)
            })
            // debugger;
        }
    }
}

function deviceIDFromUserInfoDevice(supportedDevices: UserInfoDevice[], serialNumber: string): number {
    const device = supportedDevices.find((device) => device.serial === serialNumber);
    if (device === undefined) {
        throw new Error("Device not found in user info devices?");
    }
    return device.device_id;    
}

export function isSupportedDevice(supportedDevices: UserInfoDevice[] | null, serialNumber: string | null): boolean | null {
    if (supportedDevices === null) {
        return null;
    }
    if (!serialNumber) {
        return false;
    }

    const isKnown = supportedDevices.find((device) => device.serial === serialNumber);
    // debugger;
    return (isKnown !== undefined);
}

function maybeNextMeasurementIn(aranet4MeasurementInterval: number | null, aranet4SecondsSinceLastMeasurement: number | null) {
    if (aranet4SecondsSinceLastMeasurement === null) {
        return null;
    }
    if (aranet4MeasurementInterval === null) {
        // debugger;
        return null;
    }
    const maybeNext = (aranet4MeasurementInterval - aranet4SecondsSinceLastMeasurement);
    return maybeNext;
}

function atLeastOneMinuteOrDev(maybeNextSeconds: number): number {
    if (__DEV__) {
        if (maybeNextSeconds > 30) {
            console.log(`__DEV__ (${maybeNextSeconds}) short, but not too short`)
            return maybeNextSeconds * 1000;
        }
        console.log(`__DEV__ (${maybeNextSeconds}) too short for dev`);
        const plusMinute = maybeNextSeconds + 60;
        console.log(plusMinute)
        const asMS = plusMinute * 1000;
        return asMS;
    
    }
    const plus15Minute = maybeNextSeconds + (60 * 15);
    const asMS = plus15Minute * 1000;
    return asMS;
}

function maybeNextMeasurementInOrDefault(measurementInterval: number | null, lastMeasurementTime: Date | null) {
    const defaultTime = (1000 * 10);
    // console.log(`defaultTime: ${defaultTime}`);
    if (measurementInterval === null) {
        return defaultTime;
    }
    if (lastMeasurementTime === null) {
        return defaultTime;
    }
    // console.log(`measurement interval: ${aranet4SpecificInformation.measurementInterval}, seconds since last measurement: ${aranet4SpecificInformation.secondsSinceLastMeasurement}`);
    const maybeNextSeconds = (measurementInterval) + 1;
    // console.log(`maybeNextSeconds: ${maybeNextSeconds}`);
    // console.log("FARTIPELAGOFARTIPELAGOFARTIPELAGOFARTIPELAGOFARTIPELAGOFARTIPELAGOFARTIPELAGOFARTIPELAGO");
    debugger;
    if (maybeNextSeconds < 60) {
        // debugger;
        return atLeastOneMinuteOrDev(maybeNextSeconds);
    }
    if (__DEV__ && (maybeNextSeconds > 30)) {
        return 30 * 1000;
    }
    const maybeNextMs = (maybeNextSeconds * 1000);
    if (maybeNextMs < 5000) {
        if (maybeNextMs < 100) {
            debugger;
        }
        console.log("Interval too short. Setting interval to 5 seconds");
        return 5000;
    }
    
    return maybeNextMs;
}


function dbOrDbAndWeakMessage(rssi: number | null): string {
    if (rssi === null) {
        return "db";
    }
    if (rssi > -88) {
        return "db";
    }
    return `db - weak signal. You may have connection problems!`;
}

const RSSIOrWeakRSSI: React.FC<{rssi: number | null}> = ({rssi}) => {
    return (
        <MaybeIfValue text="rssi: " value={rssi} suffix={dbOrDbAndWeakMessage(rssi)} />
    );
}

// eslint-disable-next-line @typescript-eslint/ban-types
const BluetoothMaybeNeedsTurnOn:React.FC<{}> = () => {
    const dispatch = useDispatch();
    const needsBluetoothTurnOn = useSelector(selectNeedsBluetoothTurnOn);
    const [nativeErrors, setNativeErrors] = useState(null as (string | null));

    const turnOn = (ev: NativeSyntheticEvent<NativeTouchEvent>) => {
        console.log(String(ev));
        manager.enable().then(() => {
            dispatch(setNeedsBluetoothTurnOn(false));
            return dispatch(setScanningErrorStatusString(null))
        }).catch((error) => {
            Sentry.Native.captureException(error);
            setNativeErrors(String(error));
        })
    }
    if (needsBluetoothTurnOn) {
        return (
            <>
                <MaybeIfValue text="Native errors turning bluetooth on: " value={nativeErrors}/>
                <Button title="Turn Bluetooth on" onPress={(ev) => {turnOn(ev)}}/>
            </>
        );
    }

    return null;
}


async function openCO2TrackerDevicesPage(setNativeErrors: React.Dispatch<React.SetStateAction<string | null>>) {
    try {
        Linking.openURL(COVID_CO2_TRACKER_DEVICES_URL);
    }
    catch (exception) {
        setNativeErrors(`Error opening web console: ${String(exception)}`)
    }
}


// eslint-disable-next-line @typescript-eslint/ban-types
const MaybeNoSupportedBluetoothDevices: React.FC<{}> = () => {
    const supportedDevices = useSelector(selectSupportedDevices);
    const [nativeErrors, setNativeErrors] = useState(null as (string | null));
    const {openable} = useOpenableLink(COVID_CO2_TRACKER_DEVICES_URL, setNativeErrors);


    if (supportedDevices === null) {
      return null;
    }
    if (supportedDevices.length === 0) {
      return (
        <>
          <Text>You do not have any devices entered into the database. To upload data, please create a device in the web console.</Text>
          <IfNotOpenable openable={openable} url={COVID_CO2_TRACKER_DEVICES_URL}/>
          <MaybeIfValue text="Native errors: " value={nativeErrors}/>
          <Button title="Open web console" onPress={() => openCO2TrackerDevicesPage(setNativeErrors)}/>
        </>
      )
    }
    return null;
  }
  
export const useAranet4NextMeasurementTime = () => {
    const aranet4Data = useSelector(selectAranet4SpecificData);
    const [nextMeasurementTime, setNextMeasurement] = useState(null as (number | null));

    useEffect(() => {
        setNextMeasurement(maybeNextMeasurementIn(aranet4Data?.aranet4MeasurementInterval, aranet4Data?.aranet4SecondsSinceLastMeasurement));
    }, [aranet4Data?.aranet4MeasurementInterval, aranet4Data?.aranet4SecondsSinceLastMeasurement])

    return {nextMeasurementTime};
}

const MaybeDate = (props: {aranet4MeasurementTime?: string | null}) => {
    if (props.aranet4MeasurementTime === undefined) {
        return null;
    }
    if (props.aranet4MeasurementTime === null) {
        return null;
    }

    return (
        <MaybeIfValue text="Measurement time: " value={new Date(props.aranet4MeasurementTime).toLocaleTimeString()} />
    );
}

export const BluetoothData: React.FC<{ knownDevice: boolean | null, nextMeasurement: number | null }> = ({ knownDevice, nextMeasurement }) => {
    const id = useSelector(selectDeviceID);
    const name = useSelector(selectDeviceName);
    const rssi = useSelector(selectDeviceRSSI);
    const bluetoothScanningStatus = useSelector(selectScanningStatusString);
    const bluetoothScanningErrorStatus = useSelector(selectScanningErrorStatusString);
    const serialNumber = useSelector(selectDeviceSerialNumberString);
    const deviceBatteryLevel = useSelector(selectDeviceBatterylevel);
    const measurementData = useSelector(selectMeasurementData);
    const aranet4Data = useSelector(selectAranet4SpecificData);
    // const deviceName = useSelector(selectD)
    const deviceStatus = useSelector(selectDeviceStatusString);
    
    
    const updateCount = useSelector(selectUpdateCount);
    const backgroundPollingEnabled = useSelector(selectBackgroundPollingEnabled);

    return (
        <>
            <MaybeIfValue text="bluetooth status: " value={bluetoothScanningStatus} />
            <MaybeIfValue text="bluetooth errors: " value={(bluetoothScanningErrorStatus.length > 0) ? bluetoothScanningErrorStatus : null} />
            <MaybeIfValue text="Device status: " value={deviceStatus}/>
            <Text>Updates from device this session: {updateCount}</Text>
            <MaybeIfValue text="id: " value={id} />
            <MaybeIfValue text="name: " value={name} />
            
            <RSSIOrWeakRSSI rssi={rssi}/>
            <MaybeIfValue text="Serial number: " value={serialNumber} />
            <MaybeIfValue text="Battery: " value={deviceBatteryLevel} suffix="%" />
            <MaybeIfValue text="Known user device?: " value={knownDevice} suffix="yes"/>

            {/* <MaybeIfValue text="localName: " value={(device?.localName) ? device.localName : null} /> */}
            {/* <MaybeIfValue text="manufacturerData: " value={(device?.manufacturerData) ? device?.manufacturerData : null} /> */}

            <MaybeIfValue text="CO2: " value={measurementData?.co2} suffix="ppm" />
            <MaybeIfValue text="Humidity: " value={measurementData?.humidity} suffix="%" />
            <MaybeIfValue text="Temperature: " value={measurementData?.temperature} suffix="°C" />
            {/* <MaybeIfValue text="Pressure: " value={measurementData?.barometricPressure} suffix="hPa" /> */}
            
            <MaybeDate aranet4MeasurementTime={aranet4Data.aranet4MeasurementTime}/>
            <MaybeIfValue text="Measurement interval: " value={aranet4Data?.aranet4MeasurementInterval} suffix=" seconds" />
            <MaybeIfValue text="Next measurement: " value={nextMeasurement} suffix=" seconds" />
            <MaybeIfValueTrue text="Background polling: " value={backgroundPollingEnabled}/>
            <BluetoothMaybeNeedsTurnOn/>
            <MaybeNoSupportedBluetoothDevices/>
        </>
    );
}
