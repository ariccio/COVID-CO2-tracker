/* eslint-disable no-debugger */
/* eslint-disable react/prop-types */
// See updated (more restrictive) licensing restrictions for this subproject! Updated 02/03/2022.
import {Buffer} from 'buffer';
import { useEffect, useState } from 'react';
import { PermissionsAndroid, Text, Button, NativeSyntheticEvent, NativeTouchEvent } from 'react-native';
import { BleManager, Device, BleError, LogLevel, Service, Characteristic, BleErrorCode, Subscription, DeviceId, State } from 'react-native-ble-plx';
import { useDispatch, useSelector } from 'react-redux';


import * as BLUETOOTH from '../../../../co2_client/src/utils/BluetoothConstants';
import { UserInfoDevice } from '../../../../co2_client/src/utils/DeviceInfoTypes';
import { AppDispatch } from '../../app/store';
import { MaybeIfValue, ValueOrLoading } from '../../utils/RenderValues';
import { selectSupportedDevices } from '../userInfo/devicesSlice';
import { Aranet4_1503CO2, incrementUpdates, MeasurementData, selectAranet4SpecificData, selectDeviceBatterylevel, selectDeviceID, selectDeviceName, selectDeviceRSSI, selectDeviceSerialNumberString, selectDeviceStatusString, selectHasBluetooth, selectMeasurementData, selectNeedsBluetoothTurnOn, selectScanningErrorStatusString, selectScanningStatusString, selectUpdateCount, setAranet4Color, setAranet4SecondsSinceLastMeasurement, setDeviceBatteryLevel, setDeviceID, setDeviceName, setDeviceSerialNumber, setDeviceStatusString, setHasBluetooth, setMeasurementData, setMeasurementInterval, setNeedsBluetoothTurnOn, setRssi, setScanningErrorStatusString, setScanningStatusString } from './bluetoothSlice';


//https://github.com/thespacemanatee/Smart-Shef-IoT/blob/4782c95f383040f36e4ae7ce063166cce5c76129/smart_shef_app/src/utils/hooks/useMonitorHumidityCharacteristic.ts

interface GenericBluetoothInformation {
    serialNumberString: string | null,
    // serialNumberError: Error | null,
    deviceNameString: string | null,
    // deviceNameError: Error | null
}

interface Aranet4SpecificInformation {
    co2CharacteristicValue: Aranet4_1503CO2 | null,
    // co2CharacteristicError: Error | null,
    secondsSinceLastMeasurement: number | null,
    // secondsSinceLastMeasurementError: Error | null,
    measurementInterval: number | null,
    // measurementIntervalError: Error | null
}




export const manager = new BleManager();
manager.setLogLevel(LogLevel.Debug);

// const BleManagerModule = NativeModules.BleManager;
// const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);






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

const scanCallback = async (error: BleError | null, scannedDevice: Device | null, setDevice: React.Dispatch<React.SetStateAction<Device | null>>, dispatch: AppDispatch) => {
    if (error) {
        console.error(`error scanning: ${error}`);
        //TODO: if bluetooth is off, will get BleErrorCode.BluetoothPoweredOff (102);
        // debugger;
        if (error.errorCode === BleErrorCode.BluetoothPoweredOff) {
            dispatch(setNeedsBluetoothTurnOn(true));

        }
        dispatch(setScanningErrorStatusString(`Cannot connect to device: ${error.message}, ${error.reason}`));
        dispatch(setScanningStatusString("Please turn bluetooth on."));
        // Handle error (scanning will be stopped automatically)
        return;
    }


    dumpNewScannedDeviceInfo(scannedDevice);
    if (!scannedDevice) {
        // dispatch(setScanningErrorStatusString(`scannedDevice is null?: Something's wrong.`));
        return;
    }
    if (scannedDevice.name === null) {
        // dispatch(setScanningStatusString(`scannedDevice has no name. ID: ${scannedDevice.id}`));
        return;
    }
    if ((scannedDevice.name.startsWith('Aranet4'))) {
        await foundAranet4(scannedDevice, dispatch, setDevice);
        // if (withRSSI.txPowerLevel) {
        //   dispatch(setTxPower(withRSSI.txPowerLevel));
        // }
        // else {
        //   console.error("No txPowerLevel?");
        // }

    }
    // else {
    //     dispatch(setScanningStatusString(`found non-aranet device: ${scannedDevice.name}`));
    // }

    // debugger;
}

const scanAndIdentify = (setDevice: React.Dispatch<React.SetStateAction<Device | null>>, dispatch: AppDispatch) => {
    const aranetService = [BLUETOOTH.ARANET4_SENSOR_SERVICE_UUID];
    dispatch(setScanningStatusString(`Beginning scan for devices with services: ${aranetService}...`));
    manager.startDeviceScan(aranetService, null, (error, scannedDevice) => scanCallback(error, scannedDevice, setDevice, dispatch));
}

const requestLocationPermission = async (dispatch: AppDispatch) => {
    dispatch(setScanningStatusString('Need permission to use bluetooth first.'));

    //https://reactnative.dev/docs/permissionsandroid
    const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);

    if (result === PermissionsAndroid.RESULTS.GRANTED) {
        // console.log("good");
        dispatch(setHasBluetooth(true));
        dispatch(setScanningStatusString('Bluetooth permission granted!'));
        // Do something
    } else {
        console.log(`no good: ${result}`);
        dispatch(setScanningStatusString(`Bluetooth permission denied by user: ${result}`));
        dispatch(setHasBluetooth(false));
        debugger;
        // Denied
        // Do something
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
    const batteryPercent = readUint8CharacteristicFromDevice(deviceID, BLUETOOTH.GENERIC_ACCESS_SERVICE_UUID, BLUETOOTH.GENERIC_GATT_DEVICE_BATTERY_LEVEL_UUID, "GENERIC_ACCESS_SERVICE_UUID", "GENERIC_GATT_DEVICE_BATTERY_LEVEL_UUID");

    return batteryPercent
}


// function noDevice(deviceID: string | null): boolean {
//     if (deviceID === null) {
//         return true;
//     }
//     return false;
// }

async function readGenericBluetoothInformation(deviceID: string): Promise<GenericBluetoothInformation> {
    // dispatch(setScanningStatusString(`Beginning serial number read...`));
    let serialNumberStringError = null;

    const serialNumberString = await readSerialNumberFromBluetoothDevice(deviceID);
    
    console.log(`Serial number: ${serialNumberString}`);
    // dispatch(setDeviceSerialNumber(serialNumberString));
    // setSerialNumberString(serialNumberString);
    if (serialNumberString.length === 0) {
        console.warn(`Device ${deviceID} has an empty serial number string?`);
        serialNumberStringError = new Error(`Device ${deviceID} has an empty serial number string?`);
    }
    // dispatch(setScanningStatusString(`Got serial number! ('${serialNumberString}')`));

    const deviceNameString = await readDeviceNameFromBluetoothDevice(deviceID)
    let deviceNameStringError = null;
    console.log(`Device name: ${deviceNameString}`)
    // setDeviceNameString(deviceNameString);
    if (deviceNameString.length === 0) {
        console.warn(`Device ${deviceID} has an empty name?`);
        deviceNameStringError = new Error(`Device ${deviceID} has an empty name?`);
    }
    // dispatch(`Got device name! ('${deviceNameString}')`);
    // dispatch(setScanningStatusString(null));


    return {
        deviceNameString: deviceNameString,
        // deviceNameError: deviceNameStringError,
        // serialNumberError: serialNumberStringError,
        serialNumberString: serialNumberString
    };

}
function co2MeasurementCharacteristicBufferToMeasurementState(co2CharacteristicAsBuffer: Buffer): Aranet4_1503CO2 {
    const co2 = co2CharacteristicAsBuffer.readUInt16LE(0);
    const rawTemperature = co2CharacteristicAsBuffer.readUInt16LE(2);
    const temperature = rawTemperature / 20;
    const rawPressure = co2CharacteristicAsBuffer.readUInt16LE(4);
    const pressure = rawPressure / 10;
    const humidity = co2CharacteristicAsBuffer.readUInt8(5);
    const battery = co2CharacteristicAsBuffer.readUInt8(6);
    const statusColor = co2CharacteristicAsBuffer.readUInt8(7);
    const measurementState: Aranet4_1503CO2 = {
        co2: co2,
        temperatureC: temperature,
        barometricPressure: pressure,
        humidity: humidity,
        battery: battery,
        statusColor: statusColor,
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

async function readAranet4SpecificInformation(deviceID: string | null, dispatch: AppDispatch): Promise<Aranet4SpecificInformation> {
    // if(!device?.serviceUUIDs?.includes(BLUETOOTH.ARANET4_SENSOR_SERVICE_UUID)) {
    //     debugger;
    // }
    const co2CharacteristicMeasurement = await readAranet4Co2Characteristic(deviceID!)
    
    console.log(`Aranet4 measurement:`);
    console.log(`\tCO2: ${co2CharacteristicMeasurement?.co2}ppm`);
    console.log(`\tTemperature: ${co2CharacteristicMeasurement?.temperatureC}C`);
    console.log(`\tHumidity: ${co2CharacteristicMeasurement?.humidity}%`);

    dispatch(setDeviceStatusString('Reading aranet4 seconds since last measurement...'));
    const secondsSinceLastMeasurement = await readAranet4SecondsSinceLastMeasurementCharacteristic(deviceID!)
    
    // console.log(`Seconds since last measurement: ${secondsSinceLastMeasurement}`);
    // setSecondsSinceLastMeasurement(secondsSinceLastMeasurement);
    // .then((secondsSinceLastMeasurement) => {
    // }).catch((error) => {
    //     // debugger;
    //     setSecondsSinceLastMeasurementError(error);
    // })

    dispatch(setDeviceStatusString('Reading aranet4 measurement interval...'));
    const interval = await readAranet4MeasurementInterval(deviceID!)
    // console.log(`Measurement interval: ${interval}`)
    
    // .then((interval) => {
    //     setMeasurementInterval(interval);
    // }).catch((error) => {
    //     // debugger;
    //     setMeasurementIntervalError(error);
    // })

    return {
        // co2CharacteristicError: null,
        co2CharacteristicValue: co2CharacteristicMeasurement,
        measurementInterval: interval,
        // measurementIntervalError: null,
        secondsSinceLastMeasurement: secondsSinceLastMeasurement,
        // secondsSinceLastMeasurementError: null
    }
}

const useScanConnectAranet4 = () => {
    const dispatch = useDispatch();
    const hasBluetooth = useSelector(selectHasBluetooth);
    const [device, setDevice] = useState(null as (Device | null));
    const needsBluetoothTurnOn = useSelector(selectNeedsBluetoothTurnOn);
    // const supportedDevices = useSelector(selectSupportedDevices);

    // const [needsReconnect, setNeedsReconnect] = useState(false);
    // const [subscription, setSubscription] = useState(null as (Subscription | null));
    const deviceID = useSelector(selectDeviceID);

    useEffect(() => {
        if (!hasBluetooth) {
            return;
        }
        if (needsBluetoothTurnOn) {
            return;
        }
        scanAndIdentify(setDevice, dispatch);
    }, [hasBluetooth, needsBluetoothTurnOn]);


    const beginWithDeviceConnection = async () => {
        if (deviceID === null) {
            debugger;
            return null;
        }
        const connectedDevice = await attemptConnectScannedDevice(deviceID, dispatch, device);

        if (connectedDevice === null) {
            console.error("Connection failed.");
            dispatch(setScanningStatusString("Connection to aranet4 failed."));
            return null;
        }
        dispatch(setScanningStatusString(`Connected to aranet4 ${deviceID}). Discovering services and characteristics...`));
        const deviceWithServicesAndCharacteristics = await connectedDevice.discoverAllServicesAndCharacteristics();
    
        dispatch(setScanningStatusString("Connected to aranet4, services discovered!"));

        const services = await deviceWithServicesAndCharacteristics.services();
        // console.log("services:");
        // console.table(services);
        // dumpServiceDescriptions(services);
        const withRSSI = await deviceWithServicesAndCharacteristics.readRSSI();
    
        setDevice(withRSSI);
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

    const finish = async () => {
        if (deviceID === null) {
            debugger;
            console.error("Called in incorrect order.")
            throw new Error("broken.");
        }
        const closed = await manager.cancelDeviceConnection(deviceID);
        setDevice(closed);
        console.log("Device connection closed.");
    }

    return { device, beginWithDeviceConnection, finish };
}


const updateGenericDeviceInformation = async (setGenericBluetoothInformation: React.Dispatch<React.SetStateAction<GenericBluetoothInformation | null>>, deviceID: string, dispatch: AppDispatch) => {
    dispatch(setDeviceStatusString('Reading generic bluetooth information...'));
    const read = await readGenericBluetoothInformation(deviceID);
    setGenericBluetoothInformation(read);
}

const updateAranet4SpecificInformation = async (setAranet4SpecificInformation: React.Dispatch<React.SetStateAction<Aranet4SpecificInformation | null>>, deviceID: string, dispatch: AppDispatch) => {
    
    dispatch(setDeviceStatusString('Reading aranet4 specific information...'));
    const read = await readAranet4SpecificInformation(deviceID, dispatch);
    setAranet4SpecificInformation(read);
    dispatch(setDeviceStatusString('Done reading aranet4 specific information...'));
}

function bleErrorToUsefulString(error: BleError): string {
    const asStringManualFormat = `Error name: "${error.name}", error message: "${error.message}", error code: "${error.errorCode}", error reason: "${error.reason}", error code (IOS specific): "${error.iosErrorCode}", error code (android specific): "${error.androidErrorCode}", error code (ATT specific, whatever that is): "${error.attErrorCode}"`;
    console.log(`formatted BLE error string for human consumption: ${asStringManualFormat}`);
    return asStringManualFormat;
}

function filterBleReadError(error: unknown, dispatch: AppDispatch, deviceID: string | null): void | boolean {
    if (error instanceof BleError) {
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
        //0x85 === GATT_ERROR (a generic error)
        if (error.androidErrorCode === 0x85) {
            console.log("Stupid-ass generic android error: https://cs.android.com/android/platform/superproject/+/master:packages/modules/Bluetooth/system/stack/include/gatt_api.h;l=65?q=%20%22GATT_ERROR%22&start=1");
            dispatch(setDeviceStatusString('Read failed, android gives no specific reason... Will try again..'));
            return true;
        }
        dispatch(setDeviceStatusString(`Unexpected bluetooth error while reading from device: ${bleErrorToUsefulString(error)}`));
        debugger;
        throw error;
    }
    dispatch(setDeviceStatusString(`Unexpected error while reading from device: ${String(error)}`))
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
    return;
}

async function updateCallback(setAranet4SpecificInformation: React.Dispatch<React.SetStateAction<Aranet4SpecificInformation | null>>, deviceID: string, dispatch: AppDispatch, beginWithDeviceConnection: () => Promise<Device | null>, finish: () => Promise<void>, setGenericBluetoothInformation: React.Dispatch<React.SetStateAction<GenericBluetoothInformation | null>>): Promise<void> {
    console.log("update co2 triggered!");
    dispatch(setDeviceStatusString("Updating CO2 over bluetooth..."));
    
    try {
        await forceEnableBluetooth(dispatch);
        const deviceOrNull = await beginWithDeviceConnection();
        await updateGenericDeviceInformation(setGenericBluetoothInformation, deviceID!, dispatch);
        await updateAranet4SpecificInformation(setAranet4SpecificInformation, deviceID!, dispatch);
        dispatch(setDeviceStatusString(null));
        dispatch(incrementUpdates());
        await finish();
    }
    catch(error) {
        filterBleReadError(error, dispatch, deviceID);
        debugger;
    }
}

export const useBluetoothConnectAranet = () => {
    // const [hasBluetooth, setHasBluetooth] = useState(false);
    // const [device, setDevice] = useState(null as (Device | null));
    const hasBluetooth = useSelector(selectHasBluetooth);
    const deviceID = useSelector(selectDeviceID);
    const dispatch = useDispatch();
    
    const { device, beginWithDeviceConnection, finish } = useScanConnectAranet4();


    const [timeoutHandle, setTimeoutHandle] = useState(null as (null | NodeJS.Timeout));

    const [genericBluetoothInformation, setGenericBluetoothInformation] = useState(null as (null | GenericBluetoothInformation));
    const [aranet4SpecificInformation, setAranet4SpecificInformation] = useState(null as (null | Aranet4SpecificInformation));

    

    useEffect(() => {
        if (deviceID === null) {
            return;
        }
        if (!hasBluetooth) {
            dispatch(setDeviceStatusString("User has NOT granted bluetooth permissions. Beginning first read over bluetooth anyways..."));
        }
        else {
            dispatch(setDeviceStatusString("Beginning first read over bluetooth..."));
        }
        try {
            // console.assert(aranet4Ready(device));
            beginWithDeviceConnection().then(() => {
                return updateGenericDeviceInformation(setGenericBluetoothInformation, deviceID, dispatch)
            }).then(() => {
                return updateAranet4SpecificInformation(setAranet4SpecificInformation, deviceID, dispatch);
            }).then(() => {
                return finish();
            }).then(() => {
                dispatch(setDeviceStatusString(null));
                dispatch(incrementUpdates());
            })
            .catch((error) => {
                //handle?
                debugger;
                filterBleReadError(error, dispatch, deviceID);
            })
        }
        catch (error) {
            debugger;
            //handle?
            filterBleReadError(error, dispatch, deviceID);
        }
    }, [deviceID])

    useEffect(() => {
        if (genericBluetoothInformation && (genericBluetoothInformation?.serialNumberString !== null)) {
            dispatch(setDeviceSerialNumber(genericBluetoothInformation?.serialNumberString));
        }

    }, [genericBluetoothInformation?.serialNumberString]);

    useEffect(() => {
        if (genericBluetoothInformation && (genericBluetoothInformation?.deviceNameString !== null)) {
            dispatch(setDeviceName(genericBluetoothInformation?.deviceNameString));
        }
    }, [genericBluetoothInformation?.deviceNameString]);

    useEffect(() => {
        if (aranet4SpecificInformation === null) {
            return;
        }
        if (aranet4SpecificInformation.co2CharacteristicValue !== null) {
            const measurementData: MeasurementData = {
                co2: aranet4SpecificInformation.co2CharacteristicValue.co2,
                temperature: aranet4SpecificInformation.co2CharacteristicValue.temperatureC,
                barometricPressure: aranet4SpecificInformation.co2CharacteristicValue.barometricPressure,
                humidity: aranet4SpecificInformation.co2CharacteristicValue.humidity
            };
            dispatch(setMeasurementData(measurementData));
            dispatch(setDeviceBatteryLevel(aranet4SpecificInformation.co2CharacteristicValue.battery));
            dispatch(setAranet4Color(aranet4SpecificInformation.co2CharacteristicValue.statusColor));
        }

    }, [aranet4SpecificInformation?.co2CharacteristicValue]);

    useEffect(() => {
        if (aranet4SpecificInformation === null) {
            return;
        }
        if (aranet4SpecificInformation.secondsSinceLastMeasurement !== null) {
            dispatch(setAranet4SecondsSinceLastMeasurement(aranet4SpecificInformation.secondsSinceLastMeasurement));
        }
    }, [aranet4SpecificInformation?.secondsSinceLastMeasurement])


    useEffect(() => {
        if (aranet4SpecificInformation === null) {
            return;
        }
        if (aranet4SpecificInformation.measurementInterval) {
            dispatch(setMeasurementInterval(aranet4SpecificInformation.measurementInterval));
        }
    }, [aranet4SpecificInformation?.measurementInterval])


    useEffect(() => {

        const timerTime = maybeNextMeasurementInOrDefault(aranet4SpecificInformation);
        if (deviceID === null) {
            return;
        }
        if (timeoutHandle !== null) {
            console.log("Timeout already set, ignoring.")
            return;
        }
        console.log(`Setting update timer (${timerTime/1000} seconds)...`);
        const handle = setTimeout(() => {
            setTimeoutHandle(null);
            updateCallback(setAranet4SpecificInformation, deviceID, dispatch, beginWithDeviceConnection, finish, setGenericBluetoothInformation);
        }, timerTime);
        // console.log(`Set update timer: ${handle}`)
        setTimeoutHandle(handle);
        return () => {
            if (timeoutHandle !== null) {
                console.log("Clearing co2 timer...");
                clearTimeout(timeoutHandle);
                setTimeoutHandle(null);
            }
        }
    }, [deviceID, timeoutHandle])



    return { device };
}

async function attemptConnectScannedDevice(scannedDevice: DeviceId, dispatch: AppDispatch, device: Device | null): Promise<Device | null> {
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
    // try {
    // }
    // catch (error) {
    //     if (error instanceof BleError) {
    //         if (error.errorCode === BleErrorCode.DeviceAlreadyConnected) {
    //             debugger;
    //         }
    //     }    
    // }
    // try {
    // }
    // catch (error) {
    //     const errStr = `Error connecting to aranet4! Error: ${String(error)}`;
    //     console.warn(errStr);
    //     dispatch(setScanningErrorStatusString(errStr));
    //     debugger;
    //     return null;
    // }

}


async function foundAranet4(scannedDevice: Device, dispatch: AppDispatch, setDevice: React.Dispatch<React.SetStateAction<Device | null>>) {
    dispatch(setScanningStatusString(`Found aranet4! (${scannedDevice.id}) Connecting...`));
    console.log("Connecting to aranet4...");
    if (scannedDevice.id) {
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

/*
    await queryAranet4BasicInformation(deviceServer, dispatch);
 
 
    console.log("Getting device information service...")
    const deviceInformationService = await deviceServer.getPrimaryService(BLUETOOTH.DEVICE_INFORMATION_SERVICE_UUID);
 
 
    await queryDeviceInformationService(deviceInformationService, dispatch);
 
*/

function isSupportedDevice(supportedDevices: UserInfoDevice[] | null, serialNumber: string | null): boolean | null {
    if (!supportedDevices) {
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

function maybeNextMeasurementInOrDefault(aranet4SpecificInformation: Aranet4SpecificInformation | null) {
    const defaultTime = (1000 * 10);
    if (aranet4SpecificInformation === null) {
        return defaultTime;
    }
    if (aranet4SpecificInformation.secondsSinceLastMeasurement === null) {
        return defaultTime;
    }
    if (aranet4SpecificInformation.measurementInterval === null) {
        // debugger;
        return defaultTime;
    }
    // console.log(`measurement interval: ${aranet4SpecificInformation.measurementInterval}, seconds since last measurement: ${aranet4SpecificInformation.secondsSinceLastMeasurement}`);
    const maybeNextSeconds = (aranet4SpecificInformation.measurementInterval - aranet4SpecificInformation.secondsSinceLastMeasurement) + 1;
    const maybeNext = (maybeNextSeconds * 1000);
    if (maybeNext < 5000) {
        if (maybeNext < 100) {
            debugger;
        }
        console.log("Interval too short. Setting interval to 5 seconds");
        return 5000;
    }
    return maybeNext;
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

    const turnOn = (ev: NativeSyntheticEvent<NativeTouchEvent>) => {
        console.log(String(ev));
        manager.enable().then(() => {
            dispatch(setNeedsBluetoothTurnOn(false));
            dispatch(setScanningErrorStatusString(null))
        })
    }
    if (needsBluetoothTurnOn) {
        return (
            <Button title="Turn Bluetooth on" onPress={(ev) => {turnOn(ev)}}/>
        );
    }

    return null;
}


export const BluetoothData: React.FC<{ device: Device | null }> = ({ device }) => {
    const id = useSelector(selectDeviceID);
    const name = useSelector(selectDeviceName);
    const rssi = useSelector(selectDeviceRSSI);
    const bluetoothScanningStatus = useSelector(selectScanningStatusString);
    const bluetoothScanningErrorStatus = useSelector(selectScanningErrorStatusString);
    const serialNumber = useSelector(selectDeviceSerialNumberString);
    const deviceBatteryLevel = useSelector(selectDeviceBatterylevel);
    const measurementData = useSelector(selectMeasurementData);
    const aranet4Data = useSelector(selectAranet4SpecificData);
    const supportedDevices = useSelector(selectSupportedDevices);
    const deviceStatus = useSelector(selectDeviceStatusString);
    const [knownDevice, setKnownDevice] = useState(null as (boolean | null));
    const [nextMeasurement, setNextMeasurement] = useState(null as (number | null));
    const updateCount = useSelector(selectUpdateCount);

    const dispatch = useDispatch();

    useEffect(() => {
        requestLocationPermission(dispatch);
    }, []);


    useEffect(() => {
        setKnownDevice(isSupportedDevice(supportedDevices, serialNumber))
    }, [supportedDevices, serialNumber])

    useEffect(() => {
        setNextMeasurement(maybeNextMeasurementIn(aranet4Data?.aranet4MeasurementInterval, aranet4Data?.aranet4SecondsSinceLastMeasurement));
    }, [aranet4Data?.aranet4MeasurementInterval, aranet4Data?.aranet4SecondsSinceLastMeasurement])

    return (
        <>
            <MaybeIfValue text="bluetooth status: " value={bluetoothScanningStatus} />
            <MaybeIfValue text="bluetooth errors: " value={(bluetoothScanningErrorStatus.length > 0) ? bluetoothScanningErrorStatus : null} />
            <MaybeIfValue text="Device status: " value={deviceStatus}/>
            <Text>Updates: {updateCount}</Text>
            <MaybeIfValue text="id: " value={id} />
            <MaybeIfValue text="name: " value={name} />
            
            <RSSIOrWeakRSSI rssi={rssi}/>
            <MaybeIfValue text="Serial number: " value={serialNumber} />
            <MaybeIfValue text="Battery: " value={deviceBatteryLevel} suffix="%" />
            <MaybeIfValue text="Known user device?: " value={knownDevice} suffix="yes"/>

            <MaybeIfValue text="localName: " value={(device?.localName) ? device.localName : null} />
            <MaybeIfValue text="manufacturerData: " value={(device?.manufacturerData) ? device?.manufacturerData : null} />

            <MaybeIfValue text="CO2: " value={measurementData?.co2} suffix="ppm" />
            <MaybeIfValue text="Humidity: " value={measurementData?.humidity} suffix="%" />
            <MaybeIfValue text="Temperature: " value={measurementData?.temperature} suffix="°C" />
            <MaybeIfValue text="Pressure: " value={measurementData?.barometricPressure} suffix="hPa" />
            <MaybeIfValue text="Measurement time: " value={aranet4Data?.aranet4MeasurementTime} />
            <MaybeIfValue text="Measurement interval: " value={aranet4Data?.aranet4MeasurementInterval} suffix=" seconds" />
            <MaybeIfValue text="Next measurement: " value={nextMeasurement} suffix=" seconds" />
            <BluetoothMaybeNeedsTurnOn/>
        </>
    );
}
