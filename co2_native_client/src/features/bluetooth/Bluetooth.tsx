import { useEffect, useState } from 'react';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { PermissionsAndroid } from 'react-native';

import { BleManager, Device, BleError, LogLevel, Service, Characteristic, BleErrorCode } from 'react-native-ble-plx';

import {Buffer} from 'buffer';


import { MaybeIfValue, ValueOrLoading } from '../../utils/RenderValues';


import * as BLUETOOTH from '../../../../co2_client/src/utils/BluetoothConstants';

import { Aranet4_1503CO2, MeasurementData, selectAranet4SpecificData, selectDeviceBatterylevel, selectDeviceID, selectDeviceName, selectDeviceRSSI, selectDeviceSerialNumberString, selectHasBluetooth, selectMeasurementData, selectScanningErrorStatusString, selectScanningStatusString, setAranet4Color, setAranet4SecondsSinceLastMeasurement, setDeviceBatteryLevel, setDeviceID, setDeviceName, setDeviceSerialNumber, setHasBluetooth, setMeasurementData, setMeasurementInterval, setRssi, setScanningErrorStatusString, setScanningStatusString } from './bluetoothSlice';
import { selectSupportedDevices } from '../userInfo/devicesSlice';
import { UserInfoDevice } from '../../../../co2_client/src/utils/DeviceInfoTypes';
import { AppDispatch } from '../../app/store';


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
        debugger;
        dispatch(setScanningErrorStatusString(`error scanning: ${error}`));
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

const scanAndConnect = (setDevice: React.Dispatch<React.SetStateAction<Device | null>>, dispatch: ReturnType<typeof useDispatch>) => {
    console.log("fartipelago!");
    dispatch(setScanningStatusString('Beginning device scan...'));
    manager.startDeviceScan(null, null, (error, scannedDevice) => scanCallback(error, scannedDevice, setDevice, dispatch));
}

const requestLocationPermission = async (dispatch: ReturnType<typeof useDispatch>) => {
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
    let chars = new Array(data.byteLength);
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


// async function readDataFromAranet4(dispatch: ReturnType<typeof useDispatch>, deviceID: string) {
//   const rawSerialNumberCharacteristicValue = await manager.readCharacteristicForDevice(deviceID, BLUETOOTH.DEVICE_INFORMATION_SERVICE_UUID, BLUETOOTH.GENERIC_GATT_SERIAL_NUMBER_STRING_UUID);
//   if (rawSerialNumberCharacteristicValue.value === null) {
//     console.error("bug");
//     debugger;
//     return;
//   }
//   const deviceSerialNumberCharacteristicAsBuffer = Buffer.from(rawSerialNumberCharacteristicValue.value, 'base64');
//   const deviceSerialNumberCharacteristicAsString = parseUTF8StringBuffer(deviceSerialNumberCharacteristicAsBuffer);
//   dispatch(setDeviceSerialNumber(deviceSerialNumberCharacteristicAsString));
// }


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

    // const rawSerialNumberCharacteristicValue = await manager.readCharacteristicForDevice(deviceID, BLUETOOTH.DEVICE_INFORMATION_SERVICE_UUID, BLUETOOTH.GENERIC_GATT_SERIAL_NUMBER_STRING_UUID);
    // if (rawSerialNumberCharacteristicValue.value === null) {
    //   debugger;
    //   throw new Error("GENERIC_GATT_SERIAL_NUMBER_STRING_UUID.value is null?");
    // }
    // const deviceSerialNumberCharacteristicAsBuffer = Buffer.from(rawSerialNumberCharacteristicValue.value, 'base64');
    // const deviceSerialNumberCharacteristicAsString = parseUTF8StringBuffer(deviceSerialNumberCharacteristicAsBuffer);
    // return deviceSerialNumberCharacteristicAsString; 
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

    // const rawDeviceNameCharacteristicValue = await manager.readCharacteristicForDevice(deviceID, BLUETOOTH.GENERIC_ACCESS_SERVICE_UUID, BLUETOOTH.GENERIC_GATT_DEVICE_NAME_UUID);
    // if (rawDeviceNameCharacteristicValue.value === null) {
    //   debugger;
    //   throw new Error("GENERIC_GATT_DEVICE_NAME_UUID.value is null?");
    // }
    // const deviceNameCharacteristicAsBuffer = Buffer.from(rawDeviceNameCharacteristicValue.value, 'base64');
    // const deviceNameCharacteristicAsString = parseUTF8StringBuffer(deviceNameCharacteristicAsBuffer);
    // return deviceNameCharacteristicAsString;
}

async function readBatteryLevelFromBluetoothDevice(deviceID: string): Promise<number> {
    const batteryPercent = readUint8CharacteristicFromDevice(deviceID, BLUETOOTH.GENERIC_ACCESS_SERVICE_UUID, BLUETOOTH.GENERIC_GATT_DEVICE_BATTERY_LEVEL_UUID, "GENERIC_ACCESS_SERVICE_UUID", "GENERIC_GATT_DEVICE_BATTERY_LEVEL_UUID");

    return batteryPercent
}


function noDevice(deviceID: string | null, device: Device | null): boolean {
    if (device === null) {
        return true;
    }
    if (deviceID === null) {
        return true;
    }
    return false;
}

async function readGenericBluetoothInformation(deviceID: string, device: Device): Promise<GenericBluetoothInformation> {
    // dispatch(setScanningStatusString(`Beginning serial number read...`));
    let serialNumberStringError = null;

    const serialNumberString = await readSerialNumberFromBluetoothDevice(deviceID!)
    
    console.log(`Serial number: ${serialNumberString}`);
    // dispatch(setDeviceSerialNumber(serialNumberString));
    // setSerialNumberString(serialNumberString);
    if (serialNumberString.length === 0) {
        console.warn(`Device ${deviceID} has an empty serial number string?`);
        serialNumberStringError = new Error(`Device ${deviceID} has an empty serial number string?`);
    }
    // dispatch(setScanningStatusString(`Got serial number! ('${serialNumberString}')`));

    const deviceNameString = await readDeviceNameFromBluetoothDevice(deviceID!)
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

// const useAranet4Co2Characteristic = (deviceID: string | null, device: Device | null) => {
//     const dispatch = useDispatch();
//     const [co2CharacteristicValue, setCo2Characteristic] = useState(null as (Aranet4_1503CO2 | null));
//     const [co2CharacteristicError, setCo2CharacteristicError] = useState(null as (Error | null));
//     // const [timeoutHandle, setTimeoutHandle] = useState(null);

//     // const [co2CharacteristicObject, setCo2CharacteristicObject] = useState(null as (Characteristic | null));

//     // const monitorCallback = (error: BleError | null, characteristic: Characteristic | null) => {
//     //   console.log("co2 monitor callback!");
//     // }

//     const update = () => {
//         readAranet4Co2Characteristic(deviceID!).then((co2CharacteristicMeasurement) => {
//             console.log(`Aranet4 measurement:`);
//             console.log(`\tCO2: ${co2CharacteristicMeasurement?.co2}ppm`);
//             console.log(`\tTemperature: ${co2CharacteristicMeasurement?.temperatureC}C`);
//             console.log(`\tHumidity: ${co2CharacteristicMeasurement?.humidity}%`);
//             setCo2Characteristic(co2CharacteristicMeasurement);
//         }).catch((error) => {
//             if (error instanceof BleError) {
//                 if (error.errorCode === BleErrorCode.DeviceNotConnected) {
//                     console.warn(`Device ${deviceID} not connected. co2 not available.`);
//                     setCo2CharacteristicError(error);
//                     // device!.connect();
//                     return;
//                 }
//             }

//             console.log("Re-enable this debugger when done with login code.");
//             // debugger;
//             setCo2CharacteristicError(error);
//         });
//     }
//     useEffect(() => {
//         if (noDevice(deviceID, device)) {
//             return;
//         }
//         update();

//     }, [device, deviceID]);


//     useEffect(() => {
//         if (noDevice(deviceID, device)) {
//             return;
//         }
//         if (co2CharacteristicValue === null) {
//             return;
//         }
//         const handle = setTimeout(() => {
//             console.log("update co2 triggered!");
//             update();
//         }, 1000 * 31);

//         return () => {
//             console.log("Clearing co2 timer...");
//             clearTimeout(handle);
//         }
//     }, [co2CharacteristicValue])

//     return { co2CharacteristicValue, co2CharacteristicError };
// }

async function readAranet4SecondsSinceLastMeasurementCharacteristic(deviceID: string): Promise<number> {
    return readUint16CharacteristicFromDevice(deviceID, BLUETOOTH.ARANET4_SENSOR_SERVICE_UUID, BLUETOOTH.ARANET_SECONDS_LAST_UPDATE_UUID, "BLUETOOTH.ARANET4_SENSOR_SERVICE_UUID", "BLUETOOTH.ARANET_SECONDS_LAST_UPDATE_UUID");
}

// const useAranet4SecondsSinceLastMeasurement = (deviceID: string | null, device: Device | null) => {
//     const [secondsSinceLastMeasurement, setSecondsSinceLastMeasurement] = useState(null as (number | null));
//     const [secondsSinceLastMeasurementError, setSecondsSinceLastMeasurementError] = useState(null as (Error | null));


//     const update = () => {
//         readAranet4SecondsSinceLastMeasurementCharacteristic(deviceID!).then((secondsSinceLastMeasurement) => {
//             setSecondsSinceLastMeasurement(secondsSinceLastMeasurement);
//             console.log(`Seconds since last measurement: ${secondsSinceLastMeasurement}`);
//         }).catch((error) => {
//             // debugger;
//             setSecondsSinceLastMeasurementError(error);
//         })
//     }
//     useEffect(() => {
//         if (noDevice(deviceID, device)) {
//             return;
//         }
//         update();
//     }, [device, deviceID]);

//     useEffect(() => {
//         if (noDevice(deviceID, device)) {
//             return;
//         }
//         if (secondsSinceLastMeasurement === null) {
//             return;
//         }

//         const handle = setTimeout(() => {
//             console.log("update lsat measuremet time triggered!");
//             update();
//         }, 1000 * 31);

//         return () => {
//             console.log("Clearing measurement timer timer...")
//             clearTimeout(handle);
//         }

//     }, [secondsSinceLastMeasurement])

//     return { secondsSinceLastMeasurement, secondsSinceLastMeasurementError }
// }

async function readAranet4MeasurementInterval(deviceID: string): Promise<number> {
    return readUint16CharacteristicFromDevice(deviceID, BLUETOOTH.ARANET4_SENSOR_SERVICE_UUID, BLUETOOTH.ARANET_MEASUREMENT_INTERVAL_UUID, "BLUETOOTH.ARANET4_SENSOR_SERVICE_UUID", "BLUETOOTH.ARANET_MEASUREMENT_INTERVAL_UUID");
}
// const useAranet4MeasurementInterval = (deviceID: string | null, device: Device | null) => {
//     const [measurementInterval, setMeasurementInterval] = useState(null as (number | null));
//     const [measurementIntervalError, setMeasurementIntervalError] = useState(null as (Error | null));
//     useEffect(() => {
//         if (noDevice(deviceID, device)) {
//             return;
//         }
//         readAranet4MeasurementInterval(deviceID!).then((interval) => {
//             console.log(`Measurement interval: ${interval}`)
//             setMeasurementInterval(interval);
//         }).catch((error) => {
//             // debugger;
//             setMeasurementIntervalError(error);
//         })
//     }, [device, deviceID]);

//     return { measurementInterval, measurementIntervalError };
// }


async function readAranet4SpecificInformation(deviceID: string | null, device: Device | null): Promise<Aranet4SpecificInformation> {
    const co2CharacteristicMeasurement = await readAranet4Co2Characteristic(deviceID!)
    
    console.log(`Aranet4 measurement:`);
    console.log(`\tCO2: ${co2CharacteristicMeasurement?.co2}ppm`);
    console.log(`\tTemperature: ${co2CharacteristicMeasurement?.temperatureC}C`);
    console.log(`\tHumidity: ${co2CharacteristicMeasurement?.humidity}%`);

    // setCo2Characteristic(co2CharacteristicMeasurement);
    // then((co2CharacteristicMeasurement) => {
    // }).catch((error) => {
    //     if (error instanceof BleError) {
    //         if (error.errorCode === BleErrorCode.DeviceNotConnected) {
    //             console.warn(`Device ${deviceID} not connected. co2 not available.`);
    //             setCo2CharacteristicError(error);
    //             // device!.connect();
    //             return;
    //         }
    //     }

    //     console.log("Re-enable this debugger when done with login code.");
    //     // debugger;
    //     setCo2CharacteristicError(error);
    // });


    const secondsSinceLastMeasurement = await readAranet4SecondsSinceLastMeasurementCharacteristic(deviceID!)
    
    console.log(`Seconds since last measurement: ${secondsSinceLastMeasurement}`);
    // setSecondsSinceLastMeasurement(secondsSinceLastMeasurement);
    // .then((secondsSinceLastMeasurement) => {
    // }).catch((error) => {
    //     // debugger;
    //     setSecondsSinceLastMeasurementError(error);
    // })

    
    const interval = await readAranet4MeasurementInterval(deviceID!)
    console.log(`Measurement interval: ${interval}`)
    
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

// const useAranet4SpecificInformation = (deviceID: string | null, device: Device | null) => {
//     const { co2CharacteristicValue, co2CharacteristicError } = useAranet4Co2Characteristic(deviceID, device);
//     const { secondsSinceLastMeasurement, secondsSinceLastMeasurementError } = useAranet4SecondsSinceLastMeasurement(deviceID, device);
//     const { measurementInterval, measurementIntervalError } = useAranet4MeasurementInterval(deviceID, device);

//     return { co2CharacteristicValue, co2CharacteristicError, secondsSinceLastMeasurement, secondsSinceLastMeasurementError, measurementInterval, measurementIntervalError };
// }


const useScanConnectAranet4 = () => {
    const dispatch = useDispatch();
    const hasBluetooth = useSelector(selectHasBluetooth);
    const [device, setDevice] = useState(null as (Device | null));
    const [needsReconnect, setNeedsReconnect] = useState(false);

    useEffect(() => {
        requestLocationPermission(dispatch);
    }, [])

    useEffect(() => {
        if (hasBluetooth) {
            scanAndConnect(setDevice, dispatch);
        }
    }, [hasBluetooth]);

    useEffect(() => {
        if (needsReconnect) {
            if (!device) {
                console.warn("device doesn't exist, but needs reconnect??");
                debugger;
                return;
            }
            console.log("Reconnection requested, trying...");
            device.connect().then((reconnectedDevice) => {
                setDevice(reconnectedDevice);
                setNeedsReconnect(false);
            })
        }
    }, [needsReconnect]);


    const disconnectionListener = (error: BleError | null, device: Device) => {
        if (error === null) {
            // debugger;
            console.log("Supposedly, connection has been cancelled. What?")
            // return;
        }
        console.log(`Connection lost! Will attempt to reconnect. Reconnectabe: ${device.isConnectable}`);
        setDevice(null);
        device.connect().then((reconnectedDevice) => {
            console.log("Device reconnected!")
            reconnectedDevice.discoverAllServicesAndCharacteristics().then((deviceWithServices) => setDevice(deviceWithServices));
            // scanAndConnect(setDevice, dispatch);
            // reconnectedDevice.
        })
    }
    useEffect(() => {
        if (!device) {
            return;
        }
        console.log("starting disconnection listener");
        const subscription = device.onDisconnected(disconnectionListener);

        return () => {
            console.log("removing disconnection listener")
            subscription.remove();
        }
    }, [device]);

    useEffect(() => {
        return () => {
            device?.cancelConnection();
        }
    }, [device])

    return { device, needsReconnect, setNeedsReconnect };
}


const updateGenericDeviceInformation = async (setGenericBluetoothInformation: React.Dispatch<React.SetStateAction<GenericBluetoothInformation | null>>, deviceID: string, device: Device) => {
    const read = await readGenericBluetoothInformation(deviceID, device);
    setGenericBluetoothInformation(read);
}

const updateAranet4SpecificInformation = async (setAranet4SpecificInformation: React.Dispatch<React.SetStateAction<Aranet4SpecificInformation | null>>, deviceID: string, device: Device) => {
    const read = await readAranet4SpecificInformation(deviceID, device);
    setAranet4SpecificInformation(read);
}

export const useBluetoothConnectAranet = () => {
    // const [hasBluetooth, setHasBluetooth] = useState(false);
    // const [device, setDevice] = useState(null as (Device | null));
    const hasBluetooth = useSelector(selectHasBluetooth);
    const deviceID = useSelector(selectDeviceID);
    const dispatch = useDispatch();
    const { device, needsReconnect, setNeedsReconnect } = useScanConnectAranet4();

    const [timeoutHandle, setTimeoutHandle] = useState(null);


    // const {serialNumberString, serialNumberError} = useBluetoothSerialNumber(deviceID, device);
    // const {deviceNameString, deviceNameError} = useBluetoothDeviceName(deviceID, device);
    // const {deviceBattery, deviceBatteryError} = useBluetoothBatteryLevel(deviceID, device);
    // const { serialNumberString, serialNumberError, deviceNameString, deviceNameError } = useGenericBluetoothInformation(deviceID, device);
    const [genericBluetoothInformation, setGenericBluetoothInformation] = useState(null as (null | GenericBluetoothInformation));
    const [aranet4SpecificInformation, setAranet4SpecificInformation] = useState(null as (null | Aranet4SpecificInformation));

    
    // const { co2CharacteristicValue, co2CharacteristicError, secondsSinceLastMeasurement, secondsSinceLastMeasurementError, measurementInterval, measurementIntervalError } = useAranet4SpecificInformation(deviceID, device);
    useEffect(() => {
        requestLocationPermission(dispatch);
    }, [])

    useEffect(() => {
        if (needsReconnect) {
            return;
        }
        if (noDevice(deviceID, device)) {
            return;
        }    
        try {
            updateGenericDeviceInformation(setGenericBluetoothInformation, deviceID!, device!);
            updateAranet4SpecificInformation(setAranet4SpecificInformation, deviceID!, device!);
        }
        catch (error) {
            if (error instanceof BleError) {
                if (error.errorCode === BleErrorCode.DeviceNotConnected) {
                    console.log(`Device ${deviceID} not connected. co2 not available. Will try to reconnect.`);
                    setNeedsReconnect(true);
                    return;
                }
                debugger;
            }

            debugger;
            throw error;
        }
    }, [deviceID, device])

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
        if (noDevice(deviceID, device)) {
            return;
        }
        if (aranet4SpecificInformation === null) {
            return;
        }
        if (aranet4SpecificInformation.co2CharacteristicValue === null) {
            return;
        }
        const handle = setTimeout(() => {
            console.log("update co2 triggered!");
            updateAranet4SpecificInformation(setAranet4SpecificInformation, deviceID!, device!);
        }, 1000 * 31);

        return () => {
            console.log("Clearing co2 timer...");
            clearTimeout(handle);
        }
    }, [aranet4SpecificInformation?.co2CharacteristicValue])



    return { device };
}

async function attemptConnectScannedDevice(scannedDevice: Device, dispatch: AppDispatch): Promise<Device | null> {
    try {

        const connectedDevice = await scannedDevice.connect();
        return connectedDevice;
    }
    catch (error) {
        const errStr = `Error connecting to aranet4! Error: ${String(error)}`;
        console.warn(errStr);
        dispatch(setScanningErrorStatusString(errStr));
        debugger;
        return null;
    }

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

    const connectedDevice = await attemptConnectScannedDevice(scannedDevice, dispatch);

    if (connectedDevice === null) {
        // console.error("Connection failed.");
        dispatch(setScanningStatusString("Connection to aranet4 failed."));
        return;
    }
    dispatch(setScanningStatusString(`Connected to aranet4 ${scannedDevice.id}). Discovering services and characteristics...`));
    const deviceWithServicesAndCharacteristics = await connectedDevice.discoverAllServicesAndCharacteristics();

    console.log("Connected!");
    const services = await deviceWithServicesAndCharacteristics.services();
    console.log("services:");
    // console.table(services);
    // dumpServiceDescriptions(services);
    const withRSSI = await deviceWithServicesAndCharacteristics.readRSSI();

    setDevice(withRSSI);
    if (withRSSI.rssi) {
        dispatch(setRssi(withRSSI.rssi));
        if (withRSSI.rssi < -80) {
            dispatch(setScanningErrorStatusString(`${deviceWithServicesAndCharacteristics.name} has a very weak signal! (RSSI: ${withRSSI.rssi}) You may have connection problems!`))
        }
    }
    else {
        console.error("No rssi?");
        debugger;
        dispatch(setScanningErrorStatusString("RSSI field missing. Huh?"));
    }
    dispatch(setScanningStatusString(null));
}

function dumpNewScannedDeviceInfo(scannedDevice: Device | null) {
    console.log("New device!");
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
            console.log(`\tscannedDevice.serviceData: ${scannedDevice.serviceData}`);
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
    return false;
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
    const knownDevice = isSupportedDevice(supportedDevices, serialNumber);

    const next = maybeNextMeasurementIn(aranet4Data?.aranet4MeasurementInterval, aranet4Data?.aranet4SecondsSinceLastMeasurement);

    return (
        <>
            <MaybeIfValue text={"bluetooth status: "} value={bluetoothScanningStatus} />
            <MaybeIfValue text={"bluetooth errors: "} value={(bluetoothScanningErrorStatus.length > 0) ? bluetoothScanningErrorStatus : null} />
            <ValueOrLoading text={"id: "} value={id} />
            <ValueOrLoading text={"name: "} value={name} />
            <ValueOrLoading text={"rssi: "} value={rssi} suffix={"db"} />
            <ValueOrLoading text={"Serial number: "} value={serialNumber} />
            <ValueOrLoading text={"Battery: "} value={deviceBatteryLevel} suffix={"%"} />
            <MaybeIfValue text={"Known user device?: "} value={knownDevice} suffix={"yes"}/>

            <MaybeIfValue text={"localName: "} value={(device?.localName) ? device.localName : null} />
            <MaybeIfValue text={"manufacturerData: "} value={(device?.manufacturerData) ? device?.manufacturerData : null} />

            <MaybeIfValue text={"CO2: "} value={measurementData?.co2} suffix={"ppm"} />
            <MaybeIfValue text={"Humidity: "} value={measurementData?.humidity} suffix={"%"} />
            <MaybeIfValue text={"Temperature: "} value={measurementData?.temperature} suffix={"°C"} />
            <MaybeIfValue text={"Pressure: "} value={measurementData?.barometricPressure} suffix={"hPa"} />
            <MaybeIfValue text={"Measurement time: "} value={aranet4Data?.aranet4MeasurementTime} />
            <MaybeIfValue text={"Measurement interval: "} value={aranet4Data?.aranet4MeasurementInterval} suffix={" seconds"} />
            <MaybeIfValue text={"Next measurement: "} value={next} suffix={" seconds"} />
        </>
    );
}
