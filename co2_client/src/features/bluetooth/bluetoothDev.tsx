/// <reference types="web-bluetooth" />
// import { parse } from "path";
import { useEffect, useState } from "react";
import { Button } from "react-bootstrap";

import {useDispatch} from 'react-redux';
import {useSelector} from 'react-redux';
import * as Sentry from "@sentry/react";


import Bowser from "bowser"; 

import {isMobileSafari} from '../../utils/Browsers';
import * as BLUETOOTH from '../../utils/BluetoothConstants';

import { selectDebugText, selectBluetoothAvailableError, setCO2, setBluetoothAvailableError, selectBluetoothAvailable, setBluetoothAvailable, setTemperature, setBarometricPressure, setHumidity, selectBattery, setBattery, setDeviceNameFromCharacteristic, setDeviceID, setDeviceName, selectDeviceName, selectDeviceNameFromCharacteristic, setAranet4MeasurementInterval, setAranet4TotalMeasurements, setModelNumber, setFirmwareRevision, setHardwareRevision, setSoftwareRevision, setManufacturerName, selectGattDeviceInformation, setAranet4SecondsSinceLastMeasurement, appendDebugText, setAranet4Color, setAranet4Calibration, selectMeasurementData, selectAranet4SpecificData, setRFData, selectRFData, RFData, setSupportsGetDevices, setSupportsBluetooth, selectSupportsBluetooth, selectSupportsGetDevices, selectDeviceServer, setDeviceServer } from "./bluetoothSlice";
import { AppDispatch } from "../../app/store";

// declare module BluetoothUUID {
//     export function getService(name: BluetoothServiceUUID ): string;
//     export function getCharacteristic(name: BluetoothCharacteristicUUID): string;
//     export function getDescriptor(name: BluetoothDescriptorUUID): string;
//     export function canonicalUUID(alias: number): string;
// }







function aranet4DeviceRequestOptions(): RequestDeviceOptions {
    const filter: BluetoothLEScanFilter = {
        services: [BLUETOOTH.ARANET4_SENSOR_SERVICE_UUID]
    }
    const services: BluetoothServiceUUID[] = [

        //KNOWN aranet4 services
        'battery_service',
        'device_information',
        'generic_attribute',
        'generic_access',
        
        
        //Aranet4 SHOULD support these, but no.
        'environmental_sensing',
        'immediate_alert',

        
        //Purely investigatory services to query. I haven't seen these, but I'd be curious if they show up!
        // 'alert_notification',
        // 'automation_io', //https://www.bluetooth.org/docman/handlers/DownloadDoc.ashx?doc_id=304971
        'bond_management',
        // 'current_time',
        'link_loss',
        // 'mesh_provisioning',
        // 'mesh_proxy',
        // 'reference_time_update',
        'reconnection_configuration',
        'scan_parameters',
        'tx_power',
        // 'user_data',
      ];

    const deviceRequestOptions: RequestDeviceOptions = {
        filters: [filter],
        optionalServices: services,
        acceptAllDevices: false
    }
    return deviceRequestOptions;

}

function dumpBluetoothCharacteristicProperties(properties: BluetoothCharacteristicProperties, serviceIndex: number, characteristicIndex: number): string {
    // readonly broadcast: boolean;
    // readonly read: boolean;
    // readonly writeWithoutResponse: boolean;
    // readonly write: boolean;
    // readonly notify: boolean;
    // readonly indicate: boolean;
    // readonly authenticatedSignedWrites: boolean;
    // readonly reliableWrite: boolean;
    // readonly writableAuxiliaries: boolean;

    let messages = "";
    messages += (`\tservices[${serviceIndex}], characteristics[${characteristicIndex}].properties:\n`);
    if (properties.broadcast) {
        messages += (`\t\tbroadcast: ${properties.broadcast}\n`);
    }
    if (properties.read) {
        messages += (`\t\tread: ${properties.read}\n`);
    }
    if (properties.writeWithoutResponse) {
        messages += (`\t\twriteWithoutResponse: ${properties.writeWithoutResponse}\n`);
    }
    if (properties.write) {
        messages += (`\t\twrite: ${properties.write}\n`);
    }
    if (properties.notify) {
        messages += (`\t\tnotify: ${properties.notify}\n`);
    }
    if (properties.indicate) {
        messages += (`\t\tindicate: ${properties.indicate}\n`);
    }
    if (properties.authenticatedSignedWrites) {
        messages += (`\t\tauthenticatedSignedWrites: ${properties.authenticatedSignedWrites}\n`);
    }
    if (properties.reliableWrite) {
        messages += (`\t\treliableWrite: ${properties.reliableWrite}\n`);
    }
    if (properties.writableAuxiliaries) {
        messages += (`\t\twritableAuxiliaries: ${properties.writableAuxiliaries}\n`);
    }
    return messages;
}



function messages(objectOrString: string, dispatch: AppDispatch): string {
    // let newMessagesString = messagesString + `${objectOrString}\r\n`;
    // console.log(objectOrString);
    // dispatch(setDebugText(newMessagesString))
    dispatch(appendDebugText(`${objectOrString}\r\n`));
    return `${objectOrString}\r\n`;
}


function aranet4ParseColor(data: DataView, dispatch: AppDispatch): void {
    const unknownFieldMaybeColors = data.getUint8(8);
    const isRedOrYellow = (unknownFieldMaybeColors & 0b000000010);

    if (isRedOrYellow !== 0) {
        // messages(`\t\tCO2 level might be "red" or "yellow"`, dispatch);
        const isRed = (unknownFieldMaybeColors & 0b000000001);
        if (isRed) {
            dispatch(setAranet4Color('red'));
            return;
        }
        dispatch(setAranet4Color('yellow'));
        return;
    }
    // messages(`\t\tCO2 level might be "green" or something else.`, dispatch);
    const isGreen = (unknownFieldMaybeColors & 0b000000001);
    if (isGreen !== 0) {
        dispatch(setAranet4Color('green'));
        return;
    }
    dispatch(setAranet4Color('unspecified'));
}

function parse_ARANET_CO2_MEASUREMENT_CHARACTERISTIC_UUID(data: DataView, dispatch: AppDispatch): void {
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

    const co2 = data.getUint16(co2Offset, true);
    dispatch(setCO2(co2))
    const temperature = (data.getUint16(temperatureOffset, true) / 20);
    dispatch(setTemperature(temperature));
    const barometricPressure = (data.getUint16(pressureOffset, true) / 10);
    dispatch(setBarometricPressure(barometricPressure))
    const humidity = data.getUint8(humidityOffset);
    dispatch(setHumidity(humidity));
    const battery = data.getUint8(batteryOffset);
    dispatch(setBattery(battery));
    // const unknownField = data.getUint8(8);
    // dispatch(setAranet4UnknownField(unknownField));

    aranet4ParseColor(data, dispatch);

    // debugger;

}

function dumpUnknownGatt(data: DataView, dispatch: AppDispatch): void {
    messages(`\t\tDataView length: ${data.byteLength} bytes`, dispatch);
    const asUTF8String = parseUTF8StringDataView(data);
    messages(`\t\tTrying to parse data as UTF-8 string: '${asUTF8String}'`, dispatch);
    const asUint8s = parseAsUint8Numbers(data);
    messages(`\t\tTrying to parse data as uint8 array: '${asUint8s}'`, dispatch);
    const asUint16s = parseAsUint16Numbers(data);
    if (asUint16s.length > 0) {
        messages(`\t\tTrying to parse data as uint16 array: '${asUint16s}'`, dispatch);
    }

    const asUint32s = parseAsUint32Numbers(data);
    if (asUint32s.length > 0) {
        messages(`\t\tTrying to parse data as uint32 array: '${asUint32s}'`, dispatch);
    }

    const asUint64s = parseAsUint64Numbers(data);
    if (asUint64s.length > 0) {
        messages(`\t\tTrying to parse data as uint64 array: '${asUint64s}'`, dispatch);
    }
    const asLEUint16 = parseAsUint16NumbersLittleEndian(data);
    if (asLEUint16.length > 0) {
        messages(`\t\tParsed data as uint16 array as LE: '${asLEUint16}'`, dispatch);
    }

    const asLEUint32 = parseAsUint32NumbersLittleEndian(data);
    if (asLEUint32.length > 0) {
        messages(`\t\tParsed data as uint32 array as LE: '${asLEUint32}'`, dispatch);
    }

    const asLEUint64 = parseAsUint64NumbersLittleEndian(data);
    if (asLEUint64.length > 0) {
        messages(`\t\tParsed data as uint64 array as LE: '${asLEUint64}'`, dispatch);
    }
}

function switchOverCharacteristics(data: DataView, dispatch: AppDispatch, characteristic: BluetoothRemoteGATTCharacteristic): void {
    //yes yes, I know, needs to be genericised.
    switch (characteristic.uuid) {
        case (BLUETOOTH.ARANET_CO2_MEASUREMENT_CHARACTERISTIC_UUID):
            parse_ARANET_CO2_MEASUREMENT_CHARACTERISTIC_UUID(data, dispatch);
            messages(`\t\tAranet4 CO2 measurement parsed.`, dispatch);
            break;
        case (BLUETOOTH.ARANET_SECONDS_LAST_UPDATE_UUID): {
            console.assert(data.byteLength === 2);
            const secondsSinceLastUpdate = data.getUint16(0, true);
            messages(`\t\tAranet4 seconds since last update: ${secondsSinceLastUpdate}`, dispatch);
            dispatch(setAranet4SecondsSinceLastMeasurement(secondsSinceLastUpdate))
            // debugger;
            break;
        }
        case (BLUETOOTH.ARANET_MEASUREMENT_INTERVAL_UUID): {
            console.assert(data.byteLength === 2);
            const interval = data.getUint16(0, true);
            messages(`\t\tAranet4 measurement interval: ${interval}`, dispatch);
            dispatch(setAranet4MeasurementInterval(interval));
            break;
        }
        case (BLUETOOTH.ARANET_TOTAL_MEASUREMENTS_UUID): {
            console.assert(data.byteLength === 2);
            const total = data.getUint16(0, true);
            messages(`\t\tAranet4 total measurements: ${total}`, dispatch);
            dispatch(setAranet4TotalMeasurements(total));
            break;
        }
        case (BLUETOOTH.GENERIC_GATT_DEVICE_INFORMATION_SYSTEM_ID_UUID): {
            //e.g. https://www.bosch-connectivity.com/media/product_detail_scd/scd-ble-communication-protocol.pdf
            messages(`\t\tBluetooth device_information System ID, has variable structures (I think), let's try parsing...`, dispatch);
            console.assert(data.byteLength === 8);
            //maybe also: https://source.chromium.org/chromium/chromium/src/+/main:chrome/browser/resources/bluetooth_internals/device_utils.js;l=23?q=%22Manufacturer%20Data%22&ss=chromium
            //and: https://source.chromium.org/chromium/chromium/src/+/main:device/bluetooth/bluetooth_device.h;l=380?q=%22Manufacturer%20Data%22&ss=chromium
            //first 24 bits/3 bytes
            const OUI = [data.getUint8(0), data.getUint8(1), data.getUint8(2)];
            messages(`\t\t\tOrganizationally Unique Identifier: ${OUI[0]} ${OUI[1]} ${OUI[2]} (NOTE: needs to be displayed as hex, not dec)`, dispatch);
            const MI = [data.getUint8(3), data.getUint8(4), data.getUint8(5), data.getUint8(6), data.getUint8(7)];
            messages(`\t\t\tManufacturer Identifier: ${MI[0]} ${MI[1]} ${MI[2]} ${MI[3]} ${MI[4]} (NOTE: needs to be displayed as hex, not dec)`, dispatch);
            break;
        }
        case (BLUETOOTH.GENERIC_GATT_DEVICE_MODEL_NUMBER_STRING_UUID): {
            const modelNumberString = parseUTF8StringDataView(data);
            messages(`\t\tBluetooth model number string: ${modelNumberString}`, dispatch);
            dispatch(setModelNumber(modelNumberString));
            break;
        }
        case (BLUETOOTH.GENERIC_GATT_FIRMWARE_REVISION_STRING_UUID): {
            const firmwareRevisionString = parseUTF8StringDataView(data);
            messages(`\t\tBluetooth firmware revision string: ${firmwareRevisionString}`, dispatch);
            dispatch(setFirmwareRevision(firmwareRevisionString));
            break;
        }
        case (BLUETOOTH.GENERIC_GATT_HARDWARE_REVISION_STRING_UUID): {
            const hardwareRevisionString = parseUTF8StringDataView(data);
            messages(`\t\tBluetooth hardware revision string: ${hardwareRevisionString}`, dispatch);
            dispatch(setHardwareRevision(hardwareRevisionString));
            break;
        }
        case (BLUETOOTH.GENERIC_GATT_SOFTWARE_REVISION_STRING_UUID): {
            const softwareRevisionString = parseUTF8StringDataView(data);
            messages(`\t\tBluetooth software revision string: ${softwareRevisionString}`, dispatch);
            dispatch(setSoftwareRevision(softwareRevisionString));
            break;
        }
        case (BLUETOOTH.GENERIC_GATT_MANUFACTURER_NAME_STRING_UUID): {
            const manufacturerName = parseUTF8StringDataView(data);
            messages(`\t\tBluetooth manufacturer name string: ${manufacturerName}`, dispatch);
            dispatch(setManufacturerName(manufacturerName));
            break;
        }
        case (BLUETOOTH.GENERIC_GATT_DEVICE_NAME_UUID): {
            const name = parseUTF8StringDataView(data);
            messages(`\t\tBluetooth device name string (from GATT characteristic): ${name}`, dispatch);
            dispatch(setDeviceNameFromCharacteristic(name))
            break;
        }
        case (BLUETOOTH.GENERIC_GATT_DEVICE_BATTERY_LEVEL_UUID): {
            const batteryLevel = data.getUint8(0);
            messages(`\t\tBluetooth device battery level: ${batteryLevel}`, dispatch);
            break;
        }
        case (BLUETOOTH.ARANET_SENSOR_CALIBRATION_DATA_UUID): {
            const rawSensorCalibrationValue = data.getBigUint64(0, true);

            if (rawSensorCalibrationValue === BLUETOOTH.ARANET4_MINIMUM_FACTORY_CALIBRATION_VALUE) {
                dispatch(setAranet4Calibration(BLUETOOTH.ARANET_4_BAD_CALIBRATION_STRING));
                messages(`\t\tI think this calibration value is an error value. ${rawSensorCalibrationValue}`, dispatch);
            }
            else if (rawSensorCalibrationValue > BLUETOOTH.ARANET4_MINIMUM_FACTORY_CALIBRATION_VALUE) {
                messages(`\t\tMaybe at factory calibration? (${rawSensorCalibrationValue})`, dispatch);
                dispatch(setAranet4Calibration(`Maybe at factory? (${rawSensorCalibrationValue})`));
                // Sentry.captureMessage(`Aranet4 calibration: ${rawSensorCalibrationValue}`);
            }
            else if ((rawSensorCalibrationValue < BLUETOOTH.ARANET4_MINIMUM_FACTORY_CALIBRATION_VALUE) && (rawSensorCalibrationValue > BLUETOOTH.UNIX_MONDAY_JANUARY_1_2018)) {
                messages(`\t\tMaybe at factory calibration? (${rawSensorCalibrationValue})`, dispatch);
                dispatch(setAranet4Calibration(`Maybe at factory? (${rawSensorCalibrationValue})`));
                Sentry.captureMessage(`Aranet4 calibration: ${rawSensorCalibrationValue}`);
            }
            else if (rawSensorCalibrationValue < BLUETOOTH.UNIX_MONDAY_JANUARY_1_2018) {
                dispatch(setAranet4Calibration(`Likely NON-factory: (${rawSensorCalibrationValue})`));
                messages(`\t\tLikely NON-Factory calibration (${rawSensorCalibrationValue})`, dispatch);
            }
            break;
        }
        case (BLUETOOTH.GENERIC_GATT_PREFERRED_PERIPHERAL_CONNECTION_PARAMETERS): {
            const minimumConnectionInterval = data.getUint16(0, true);
            const maximumConnectionInterval = data.getUint16(2, true);
            const slaveLatency = data.getUint16(4,true);
            const connectionSupervisionTimeoutMultiplier = data.getUint16(6, true);
            messages(`\t\tMinimum Connection Interval: ${minimumConnectionInterval}, Maximum Connection Interval: ${maximumConnectionInterval}, Slave Latency: ${slaveLatency}, Connection Supervision Timeout Multiplier: ${connectionSupervisionTimeoutMultiplier}`, dispatch);

            break;
        }
        case (BLUETOOTH.ARANET_UNSED_GATT_UUID): {
            messages(`\t\tAranet4 UNUSED characteristic. Should be all zeros!`, dispatch);
            const dataLoaded = [];
            for (let i = 0; i < data.byteLength; i++) {
                dataLoaded.push(data.getUint8(i));
            }
            const nonZero = dataLoaded.filter((value) => value !== 0);
            if (nonZero.length > 0) {
                messages(`\t\t\tNOT all zeros. Dumping & reporting...`, dispatch);
                dumpUnknownGatt(data, dispatch);
                // Sentry.sendMessage(`Aranet4 unused characteristic has non-zero values:`)
            }
            else {
                messages(`\t\t...yes, it's all zeros.`, dispatch)
            }
            break;
        }
        default:
            dumpUnknownGatt(data, dispatch);
        }

}


async function bluetoothTestingStuffFunc(dispatch: AppDispatch) {


    const device = await getADevice();

    //https://source.chromium.org/chromium/chromium/src/+/main:content/browser/bluetooth/web_bluetooth_service_impl.cc;drc=0a303e330572dd85a162460d4d9e9959e2c917a6;bpv=1;bpt=1;l=1986?q=requestDevice%20lang:C%2B%2B&ss=chromium
    messages(`device.id: ${device.id} (unique)`, dispatch);
    dispatch(setDeviceID(device.id));
    messages(`device.name: ${device.name}`, dispatch);
    if (device.name !== undefined) {
        dispatch(setDeviceName(device.name));
    }
    else {
        dispatch(setDeviceName(''));
    }

    if (device.gatt === undefined) {
        debugger;
        return;
    }
    debugger;
    const deviceServer = await device.gatt.connect();

    const services = await deviceServer.getPrimaryServices();
    messages(`${services.length} services:`, dispatch);
    checkServiceNames(services, dispatch);

    messages(`----`, dispatch);
    messages(`----`, dispatch);


    messages(`Got services (length: ${services.length}):`, dispatch)
    await loopOverServices(services, dispatch);
}

function checkServiceNames(services: BluetoothRemoteGATTService[], dispatch: AppDispatch) {
    for (let serviceIndex = 0; serviceIndex < services.length; serviceIndex++) {
        const uuid = services[serviceIndex].uuid;
        const short_uuid = uuid.substring(4, 8).toUpperCase();
        if (BLUETOOTH.GENERIC_GATT_SERVICE_UUID_DESCRIPTIONS.has(uuid)) {
            const serviceName = BLUETOOTH.GENERIC_GATT_SERVICE_UUID_DESCRIPTIONS.get(uuid);
            messages(`\tservices[${serviceIndex}].uuid: ${uuid}... Known service! ${serviceName}`, dispatch);
        }
        else if (BLUETOOTH.GENERIC_GATT_SERVICE_SHORT_ID_DESCRIPTIONS.has(short_uuid)) {
            const serviceName = BLUETOOTH.GENERIC_GATT_SERVICE_SHORT_ID_DESCRIPTIONS.get(short_uuid);
            messages(`\tservices[${serviceIndex}].uuid: ${uuid}... Known service! ${serviceName}`, dispatch);
        }
        else {
            messages(`\tservices[${serviceIndex}].uuid: ${uuid}`, dispatch);
        }
    }
}

async function loopOverServices(services: BluetoothRemoteGATTService[], dispatch: AppDispatch) {
    for (let serviceIndex = 0; serviceIndex < services.length; serviceIndex++) {
        const uuid = services[serviceIndex].uuid;
        messages(`services[${serviceIndex}].uuid: ${uuid}`, dispatch);
        // debugger;
        // if(GENERIC_GATT_SERVICE_UUID_DESCRIPTIONS.has(services[serviceIndex].uuid.substring(0,8))) {
        //     debugger;
        // }
        //
        const short_uuid = uuid.substring(4, 8).toUpperCase();
        if (BLUETOOTH.GENERIC_GATT_SERVICE_UUID_DESCRIPTIONS.has(uuid)) {
            const serviceName = BLUETOOTH.GENERIC_GATT_SERVICE_UUID_DESCRIPTIONS.get(uuid);
            messages(`services[${serviceIndex}].uuid: ${uuid}... Known service! ${serviceName}`, dispatch);
        }
        else if (BLUETOOTH.GENERIC_GATT_SERVICE_SHORT_ID_DESCRIPTIONS.has(short_uuid)) {
            const serviceName = BLUETOOTH.GENERIC_GATT_SERVICE_SHORT_ID_DESCRIPTIONS.get(short_uuid);
            messages(`\t\tKnown service! ${serviceName}`, dispatch);
        }

        messages(`services[${serviceIndex}].isPrimary: ${services[serviceIndex].isPrimary}`, dispatch);
        // debugger;
        //getCharacteristics can fail!
        //Unhandled Rejection (NetworkError): Failed to execute 'getCharacteristics' on 'BluetoothRemoteGATTService': GATT Server is disconnected. Cannot retrieve characteristics. (Re)connect first with `device.gatt.connect`.
        const characteristics = await services[serviceIndex].getCharacteristics();

        messages(`Got characteristics (length ${characteristics.length}):`, dispatch);
        await loopOverCharacteristics(characteristics, serviceIndex, dispatch);
        messages('\n', dispatch);
    }
}

async function loopOverCharacteristics(characteristics: BluetoothRemoteGATTCharacteristic[], serviceIndex: number, dispatch: AppDispatch) {
    for (let characteristicIndex = 0; characteristicIndex < characteristics.length; characteristicIndex++) {
        messages(`\tservices[${serviceIndex}], characteristics[${characteristicIndex}].uuid: ${characteristics[characteristicIndex].uuid}`, dispatch);
        checkKnownFunctionDescription(characteristics, characteristicIndex, dispatch);
        // bluetoothMessages += messages(bluetoothMessages, `\tservices[${serviceIndex}], characteristics[${characteristicIndex}].value: ${characteristics[characteristicIndex].value}`, dispatch);
        const propertiesString = dumpBluetoothCharacteristicProperties(characteristics[characteristicIndex].properties, serviceIndex, characteristicIndex);
        dispatch(appendDebugText(propertiesString));
        if (characteristics[characteristicIndex].properties.read) {
            await readableCharacteristic(characteristics, characteristicIndex, dispatch);
        }
        messages('\n', dispatch);
    }
}

async function readableCharacteristic(characteristics: BluetoothRemoteGATTCharacteristic[], characteristicIndex: number, dispatch: AppDispatch) {
    //https://source.chromium.org/chromium/chromium/src/+/main:third_party/blink/renderer/modules/bluetooth/bluetooth_error.cc;l=142?q=requestDevice%20lang:C%2B%2B&ss=chromium
    try {
        const data = await characteristics[characteristicIndex].readValue();
        switchOverCharacteristics(data, dispatch, characteristics[characteristicIndex]);

    }
    catch (e) {
        if (e instanceof DOMException) {
            messages(`\t\tCannot read from ${characteristics[characteristicIndex].uuid}! Error code: '${e.code}', Error message: '${e.message}'`, dispatch);
        }
        else {
            throw e;
        }
    }
}

function checkKnownFunctionDescription(characteristics: BluetoothRemoteGATTCharacteristic[], characteristicIndex: number, dispatch: AppDispatch) {
    if (BLUETOOTH.aranet4KnownCharacteristicUUIDDescriptions.has(characteristics[characteristicIndex].uuid)) {
        messages(`\t\tKnown Aranet4 characteristic! '${BLUETOOTH.aranet4KnownCharacteristicUUIDDescriptions.get(characteristics[characteristicIndex].uuid)}'`, dispatch);
        return;
    }
    else if (BLUETOOTH.GENERIC_GATT_SERVICE_UUID_DESCRIPTIONS.has(characteristics[characteristicIndex].uuid)) {
        messages(`\t\tKnown generic GATT characteristic! '${BLUETOOTH.GENERIC_GATT_SERVICE_UUID_DESCRIPTIONS.get(characteristics[characteristicIndex].uuid)}'`, dispatch);
        return;
    }
    messages(`\t\tUNKNOWN GATT characteristic! '${characteristics[characteristicIndex].uuid}'`, dispatch);
}

function parseAsUint8Numbers(data: DataView): string {
    const uint8Numbers = new Array(data.byteLength);
    for (let i = 0; i < (data.byteLength); i++) {
        uint8Numbers[i] = data.getUint8(i);
    }
    const numberStringArray = uint8Numbers.map((uint8Number) => {
        return String(uint8Number);
    })
    return numberStringArray.toString();
}

function parseAsUint16Numbers(data: DataView): string {
    if (data.byteLength < 2) {
        return "";
    }
    const uint16Numbers = [];
    for (let i = 0; i < (data.byteLength/2); i++) {
        if ((i*2) > data.byteLength) {
            debugger;
        }
        uint16Numbers[i] = data.getUint16(i);
    }
    // debugger;
    const numberStringArray = uint16Numbers.map((uint16Number) => {
        return String(uint16Number);
    })
    return numberStringArray.toString();
}

function parseAsUint16NumbersLittleEndian(data: DataView): string {
    if (data.byteLength < 2) {
        return "";
    }
    const uint16Numbers = [];
    for (let i = 0; i < (data.byteLength/2); i++) {
        if ((i*2) > data.byteLength) {
            debugger;
        }
        uint16Numbers[i] = data.getUint16(i, true);
    }
    // debugger;
    const numberStringArray = uint16Numbers.map((uint8Number) => {
        return String(uint8Number);
    })
    return numberStringArray.toString();
}


function parseAsUint32Numbers(data: DataView): string {
    if (data.byteLength < 4) {
        return "";
    }
    const uint32Numbers = [];
    for (let i = 0; i < (data.byteLength/4); i++) {
        if ((i*4) > data.byteLength) {
            debugger;
        }
        if ((data.byteLength/4) < 1) {
            return '';
        }
        uint32Numbers[i] = data.getUint32(i);
    }
    // debugger;
    const numberStringArray = uint32Numbers.map((uint32Number) => {
        return String(uint32Number);
    })
    return numberStringArray.toString();
}

function parseAsUint32NumbersLittleEndian(data: DataView): string {
    if (data.byteLength < 4) {
        return "";
    }
    const uint32Numbers = [];
    for (let i = 0; i < (data.byteLength/4); i++) {
        if ((i*4) > data.byteLength) {
            debugger;
        }
        if ((data.byteLength/4) < 1) {
            return '';
        }
        uint32Numbers[i] = data.getUint32(i, true);
    }
    // debugger;
    const numberStringArray = uint32Numbers.map((uint32Number) => {
        return String(uint32Number);
    })
    return numberStringArray.toString();
}


function parseAsUint64Numbers(data: DataView): string {
    if (data.byteLength < 8) {
        return "";
    }
    const uint64Numbers = [];
    for (let i = 0; i < (data.byteLength/8); i++) {
        if ((i*8) > data.byteLength) {
            debugger;
        }
        if ((data.byteLength/8) < 1) {
            return '';
        }

        uint64Numbers[i] = data.getBigUint64(i);
    }
    // debugger;
    const numberStringArray = uint64Numbers.map((uint64Number) => {
        return String(uint64Number);
    })
    return numberStringArray.toString();
}

function parseAsUint64NumbersLittleEndian(data: DataView): string {
    if (data.byteLength < 8) {
        return "";
    }
    const uint64Numbers = [];
    for (let i = 0; i < (data.byteLength/8); i++) {
        if ((i*8) > data.byteLength) {
            debugger;
        }
        if ((data.byteLength/8) < 1) {
            return '';
        }

        uint64Numbers[i] = data.getBigUint64(i, true);
    }
    // debugger;
    const numberStringArray = uint64Numbers.map((uint64Number) => {
        return String(uint64Number);
    })
    return numberStringArray.toString();
}


function parseUTF8StringDataView(data: DataView): string {
    const chars = new Array(data.byteLength);
    for (let i = 0; i < (data.byteLength); i++) {
        chars[i] = data.getUint8(i);
    }
    const converted = String.fromCharCode.apply(null, chars);
    return converted;
}

async function checkBluetooth(dispatch: AppDispatch) {
    console.assert(navigator.bluetooth);
    if (navigator.bluetooth === undefined) {
        dispatch(setBluetoothAvailableError('bluetooth is unavailable on your platform. (navigator.bluetooth undefined)'));
        dispatch(setBluetoothAvailable(false));
        alert('bluetooth is unavailable on your platform. (navigator.bluetooth undefined)');
        return;
    }
    console.assert(navigator.bluetooth.getAvailability);
    const available = await navigator.bluetooth.getAvailability();
    console.log("bluetooth available: ", available);
    dispatch(setBluetoothAvailable(available));
    if (!available) {
        alert("bluetooth may not be available.");
        dispatch(setBluetoothAvailableError('bluetooth may not be available. navigator.bluetooth.getAvailability() returned false.'));
        return;
    }
    dispatch(setBluetoothAvailableError(null));
}

async function getAvailableDevices(): Promise<BluetoothDevice[] | null> {
    console.assert(navigator.bluetooth);
    console.assert(navigator.bluetooth.getDevices);
    const devices = await navigator.bluetooth.getDevices();
    if (devices.length === 0) {
        debugger;
        console.log("no devices available...")
        return null;
    }
    console.log("bluetooth devices:");

    console.table(devices);

    return devices;
}

async function getADevice(): Promise<BluetoothDevice> {

    const options = aranet4DeviceRequestOptions();

    console.assert(navigator.bluetooth);
    console.assert(navigator.bluetooth.requestDevice);
    //https://developer.mozilla.org/en-US/docs/Web/API/Bluetooth/requestDevice
    //https://source.chromium.org/chromium/chromium/src/+/main:third_party/blink/renderer/modules/bluetooth/bluetooth.h;l=47?q=requestDevice%20lang:C%2B%2B&ss=chromium
    const device = await navigator.bluetooth.requestDevice(options);
    return device;


}

async function maybeConnectDevice(dispatch: AppDispatch, maybeConnectedDevice: (BluetoothRemoteGATTServer | null)): Promise<BluetoothRemoteGATTServer | null> {
    if (maybeConnectedDevice) {
        return maybeConnectedDevice;
    }

    // debugger;
    const options = aranet4DeviceRequestOptions();
    
    console.assert(navigator.bluetooth);
    console.assert(navigator.bluetooth.requestDevice);
    //https://developer.mozilla.org/en-US/docs/Web/API/Bluetooth/requestDevice
    //https://source.chromium.org/chromium/chromium/src/+/main:third_party/blink/renderer/modules/bluetooth/bluetooth.h;l=47?q=requestDevice%20lang:C%2B%2B&ss=chromium

    const device = await navigator.bluetooth.requestDevice(options);
    if (device.gatt === undefined) {
        debugger;
        return null;
    }

    //https://source.chromium.org/chromium/chromium/src/+/main:content/browser/bluetooth/web_bluetooth_service_impl.cc;drc=0a303e330572dd85a162460d4d9e9959e2c917a6;bpv=1;bpt=1;l=1986?q=requestDevice%20lang:C%2B%2B&ss=chromium

    //SEE ALSO: https://source.chromium.org/chromium/chromium/src/+/main:third_party/blink/common/bluetooth/web_bluetooth_device_id.cc;drc=0a303e330572dd85a162460d4d9e9959e2c917a6;l=49
    //The value is LITERALLY generated by crypto::RandBytes(bytes);
    dispatch(setDeviceID(device.id));
    if (device.name !== undefined) {
        dispatch(setDeviceName(device.name));
    }
    else {
        dispatch(setDeviceName(''));
    }
    
    const deviceServer = await device.gatt.connect();
    dispatch(setDeviceServer(deviceServer));
    return deviceServer;
}

// function unixTimeToJSTime(rawUnixTime: bigint): Date {
//    
//     const asNumber = Number(rawUnixTime);
//     debugger;
//     const date = new Date(asNumber);
//
//     // const milisecondsScale = BigInt(1000);
//     // const miliseconds = (milisecondsScale * rawUnixTime);
//     // if (miliseconds > Number.MAX_SAFE_INTEGER) {
//     //     Sentry.captureMessage(`miliseconds (${miliseconds}) > Number.MAX_SAFE_INTEGER (${Number.MAX_SAFE_INTEGER})`);
//     //     throw new Error(`miliseconds > Number.MAX_SAFE_INTEGER`);
//     // }
//     // const milisecondsNumber = Number(miliseconds);
//
//     return date;
// }

async function innerGetAllAranet4DataOverBluetooth(dispatch: AppDispatch, maybeConnectedDevice: (BluetoothRemoteGATTServer | null)) {
    const deviceServer = await maybeConnectDevice(dispatch, maybeConnectedDevice);
    if (deviceServer === null) {
        debugger;
        return;
    }
    if (!deviceServer.connected) {
        debugger;
    }
    await queryAranet4BasicInformation(deviceServer, dispatch);


    console.log("Getting device information service...")
    const deviceInformationService = await deviceServer.getPrimaryService(BLUETOOTH.DEVICE_INFORMATION_SERVICE_UUID);


    await queryDeviceInformationService(deviceInformationService, dispatch);

    //TODO: model number string

}
async function innerGetBasicAranet4DataOverBluetooth(dispatch: AppDispatch, maybeConnectedDevice: (BluetoothRemoteGATTServer | null)) {
    const deviceServer = await maybeConnectDevice(dispatch, maybeConnectedDevice);
    if (deviceServer === null) {
        debugger;
        return;
    }
    if (!deviceServer.connected) {
        debugger;
    }
    await queryAranet4BasicInformation(deviceServer, dispatch);
}



async function queryAranet4BasicInformation(deviceServer: BluetoothRemoteGATTServer, dispatch: AppDispatch) {
    console.log("Getting generic access service...");
    const genericAccessService = await deviceServer.getPrimaryService(BLUETOOTH.GENERIC_ACCESS_SERVICE_UUID);

    const name = await queryBluetoothDeviceNameString(genericAccessService);

    dispatch(setDeviceNameFromCharacteristic(name));

    const Aranet4Service = await deviceServer.getPrimaryService(BLUETOOTH.ARANET4_SENSOR_SERVICE_UUID);

    //TODO: should I batch with getCharacteristics instead?
    await queryAranet4InformationService(Aranet4Service, dispatch);
}

async function queryDeviceInformationService(deviceInformationService: BluetoothRemoteGATTService, dispatch: AppDispatch) {
    const modelNumberString = await queryBluetoothModelNumberString(deviceInformationService);
    dispatch(setModelNumber(modelNumberString));

    const firmwareRevisionString = await queryBluetoothFirmwareRevisionString(deviceInformationService);
    dispatch(setFirmwareRevision(firmwareRevisionString));


    const hardwareRevisionString = await queryBluetoothHardwareRevisionString(deviceInformationService);
    dispatch(setHardwareRevision(hardwareRevisionString));

    const softwareRevisionString = await queryBluetoothSoftwareRevisionSoftwareRevisionString(deviceInformationService);
    dispatch(setSoftwareRevision(softwareRevisionString));

    const manufacturernameString = await queryBluetoothManufacturerNameString(deviceInformationService);
    dispatch(setManufacturerName(manufacturernameString));

    // OK, so there's a problem here. Reading the serial number is currently blocklisted!
    // See:
    //  https://github.com/WebBluetoothCG/web-bluetooth/issues/24
    //  https://github.com/WebBluetoothCG/registries/issues/2#issuecomment-1000950490
    // This is essentially kinda understandable, since lots of devices may not even have unique serial numbers, but it means that I need to work around this. Grr.
    
    // const serialNumberStringCharacteristic = await deviceInformationService.getCharacteristic(GENERIC_GATT_SERIAL_NUMBER_STRING_UUID);
    // const serialNumberStringData = await serialNumberStringCharacteristic.readValue();
    // const serialNumberString = parseUTF8StringDataView(serialNumberStringData);
    // debugger;



}

async function queryAranet4InformationService(Aranet4Service: BluetoothRemoteGATTService, dispatch: AppDispatch) {
    console.log("Got primary sensor service!");

    const co2Characteristic = await Aranet4Service.getCharacteristic(BLUETOOTH.ARANET_CO2_MEASUREMENT_CHARACTERISTIC_UUID);
    // console.log("Got co2 characteristic!");

    try {
        const co2Data = await co2Characteristic.readValue();
        parse_ARANET_CO2_MEASUREMENT_CHARACTERISTIC_UUID(co2Data, dispatch);
    }
    catch (e) {
        if (e instanceof DOMException) {
        /*
            e: DOMException: Authentication canceled.
            code: 19
            message: "Authentication canceled."
            name: "NetworkError"
        */
            if (e.code === 19) {
                //
            }
            else {
                debugger;
            }
        }
        else {
            throw e;
        }
    }

    try {
        const secondsSinceLastmeasurement = await queryAranet4SecondsSinceLastMeasurement(Aranet4Service);
        dispatch(setAranet4SecondsSinceLastMeasurement(secondsSinceLastmeasurement));
    }
    catch (e) {
        debugger;
    }


    const measurementInterval = await queryAranet4MeasurementInterval(Aranet4Service);
    dispatch(setAranet4MeasurementInterval(measurementInterval));

    const totalMeasurements = await queryAranet4TotalMeasurements(Aranet4Service);
    dispatch(setAranet4TotalMeasurements(totalMeasurements));

    const rawSensorCalibrationValue = await queryAranet4SensorCalibration(Aranet4Service);
    // ARANET4_AT_FACTORY_CALIBRATION_VALUE
    // const UNIX_MONDAY_JANUARY_1_2018 = 1514764800;
    if (rawSensorCalibrationValue === BLUETOOTH.ARANET4_MINIMUM_FACTORY_CALIBRATION_VALUE) {
        dispatch(setAranet4Calibration(BLUETOOTH.ARANET_4_BAD_CALIBRATION_STRING));
    }
    else if (rawSensorCalibrationValue > BLUETOOTH.ARANET4_MINIMUM_FACTORY_CALIBRATION_VALUE) {
        dispatch(setAranet4Calibration(`Maybe at factory? (${rawSensorCalibrationValue})`));
        // Sentry.captureMessage(`Aranet4 calibration: ${rawSensorCalibrationValue}`);
    }
    else if ((rawSensorCalibrationValue < BLUETOOTH.ARANET4_MINIMUM_FACTORY_CALIBRATION_VALUE) && (rawSensorCalibrationValue > BLUETOOTH.UNIX_MONDAY_JANUARY_1_2018)) {
        dispatch(setAranet4Calibration(`Maybe at factory? (${rawSensorCalibrationValue})`));
        Sentry.captureMessage(`Aranet4 calibration: ${rawSensorCalibrationValue}`);
    }
    else if (rawSensorCalibrationValue < BLUETOOTH.UNIX_MONDAY_JANUARY_1_2018) {
        dispatch(setAranet4Calibration(`Likely NON-factory: (${rawSensorCalibrationValue})`));
    }
    // UNIX_MONDAY_JANUARY_1_2018

    // console.log("Getting sensor logs...");
    // const sensorLogsCharacteristic = await Aranet4Service.getCharacteristic(ARANET_SENSOR_LOGS_UUID);
    // const sensorLogsData = await sensorLogsCharacteristic.readValue();

}

async function queryBluetoothDeviceNameString(genericAccessService: BluetoothRemoteGATTService) {
    // console.log("Getting generic GATT device name...");
    const nameCharacteristic = await genericAccessService.getCharacteristic(BLUETOOTH.GENERIC_GATT_DEVICE_NAME_UUID);
    const nameData = await nameCharacteristic.readValue();
    const name = parseUTF8StringDataView(nameData);
    return name;
}

async function queryBluetoothManufacturerNameString(deviceInformationService: BluetoothRemoteGATTService) {
    // console.log("Getting manufacturer name....");
    const manufactuterNameStringCharacteristic = await deviceInformationService.getCharacteristic(BLUETOOTH.GENERIC_GATT_MANUFACTURER_NAME_STRING_UUID);
    const manufacturerNameData = await manufactuterNameStringCharacteristic.readValue();
    const manufacturernameString = parseUTF8StringDataView(manufacturerNameData);
    return manufacturernameString;
}

async function queryBluetoothSoftwareRevisionSoftwareRevisionString(deviceInformationService: BluetoothRemoteGATTService) {
    // console.log("Getting software revision string...");
    const softwareRevisionStringCharacteristic = await deviceInformationService.getCharacteristic(BLUETOOTH.GENERIC_GATT_SOFTWARE_REVISION_STRING_UUID);
    const softwareRevisionData = await softwareRevisionStringCharacteristic.readValue();
    const softwareRevisionString = parseUTF8StringDataView(softwareRevisionData);
    return softwareRevisionString;
}

async function queryBluetoothHardwareRevisionString(deviceInformationService: BluetoothRemoteGATTService) {
    // console.log("Getting hardware revision string...");
    const hardwareRevisionStringCharacteristic = await deviceInformationService.getCharacteristic(BLUETOOTH.GENERIC_GATT_HARDWARE_REVISION_STRING_UUID);
    const hardwareRevisionData = await hardwareRevisionStringCharacteristic.readValue();
    const hardwareRevisionString = parseUTF8StringDataView(hardwareRevisionData);
    return hardwareRevisionString;
}

async function queryBluetoothFirmwareRevisionString(deviceInformationService: BluetoothRemoteGATTService) {
    // console.log("Getting firmware revision string...");
    const firmwareStringCharacteristic = await deviceInformationService.getCharacteristic(BLUETOOTH.GENERIC_GATT_FIRMWARE_REVISION_STRING_UUID);
    const firmwareStringData = await firmwareStringCharacteristic.readValue();
    const firmwareRevisionString = parseUTF8StringDataView(firmwareStringData);
    return firmwareRevisionString;
}

async function queryBluetoothModelNumberString(deviceInformationService: BluetoothRemoteGATTService) {
    // console.log("Getting model number string...");
    const modelNumberStringCharacteristic = await deviceInformationService.getCharacteristic(BLUETOOTH.GENERIC_GATT_DEVICE_MODEL_NUMBER_STRING_UUID);
    const modelNumberStringData = await modelNumberStringCharacteristic.readValue();
    const modelNumberString = parseUTF8StringDataView(modelNumberStringData);
    return modelNumberString;
}

async function queryAranet4SensorCalibration(Aranet4Service: BluetoothRemoteGATTService) {
    // console.log("Getting sensor calibration...");
    const sensorCalibrationCharacteristic = await Aranet4Service.getCharacteristic(BLUETOOTH.ARANET_SENSOR_CALIBRATION_DATA_UUID);
    const sensorCalibrationData = await sensorCalibrationCharacteristic.readValue();
    const rawSensorCalibrationValue = sensorCalibrationData.getBigUint64(0, true);
    return rawSensorCalibrationValue;
}

async function queryAranet4TotalMeasurements(Aranet4Service: BluetoothRemoteGATTService) {
    // console.log("Getting total number of measurements...");
    const totalMeasurementsCharacteristic = await Aranet4Service.getCharacteristic(BLUETOOTH.ARANET_TOTAL_MEASUREMENTS_UUID);
    const totalMeasurementsData = await totalMeasurementsCharacteristic.readValue();
    const totalMeasurements = totalMeasurementsData.getUint16(0, true);
    return totalMeasurements;
}

async function queryAranet4MeasurementInterval(Aranet4Service: BluetoothRemoteGATTService) {
    // console.log("Getting measurement interval...");
    const measurementIntervalCharacteristic = await Aranet4Service.getCharacteristic(BLUETOOTH.ARANET_MEASUREMENT_INTERVAL_UUID);
    const measurementIntervalData = await measurementIntervalCharacteristic.readValue();
    const measurementInterval = measurementIntervalData.getUint16(0, true);
    return measurementInterval;
}

async function queryAranet4SecondsSinceLastMeasurement(Aranet4Service: BluetoothRemoteGATTService) {
    // console.log("Getting seconds since last update...");
    const secondsSinceLastMeasurementCharacteristic = await Aranet4Service.getCharacteristic(BLUETOOTH.ARANET_SECONDS_LAST_UPDATE_UUID);
    const secondsSinceLastMeasurementData = await secondsSinceLastMeasurementCharacteristic.readValue();
    const secondsSinceLastmeasurement = secondsSinceLastMeasurementData.getUint16(0, true);
    return secondsSinceLastmeasurement;
}

async function getAranet4DataOverBluetooth(dispatch: AppDispatch, maybeConnectedDevice: (BluetoothRemoteGATTServer | null)) {
    //https://source.chromium.org/chromium/chromium/src/+/main:third_party/blink/renderer/modules/bluetooth/bluetooth_error.cc;l=142?q=requestDevice%20lang:C%2B%2B&ss=chromium
    try {
        innerGetAllAranet4DataOverBluetooth(dispatch, maybeConnectedDevice);
    }
    catch (e) {
        if (e instanceof DOMException) {
            debugger;
            alert(`DOMException: bluetooth operation likely cancelled. Error code: ${e.code}, message: ${e.message}`);
            console.error(e);
            Sentry.captureException(e);
            return;
        }
        else {
            debugger;
            console.error(`Unexpected exception during bluetooth. Exception type: ${typeof e}, e: ${e}`);
            alert(`Unexpected exception during bluetooth. Exception type: ${typeof e}, e: ${e}`);
            throw e;
        }

    }
}

async function getBasicAranet4DataOverBluetooth(dispatch: AppDispatch, maybeConnectedDevice: (BluetoothRemoteGATTServer | null)) {
    //https://source.chromium.org/chromium/chromium/src/+/main:third_party/blink/renderer/modules/bluetooth/bluetooth_error.cc;l=142?q=requestDevice%20lang:C%2B%2B&ss=chromium
    try {
        innerGetBasicAranet4DataOverBluetooth(dispatch, maybeConnectedDevice);
    }
    catch (e) {
        if (e instanceof DOMException) {
            debugger;
            alert(`DOMException: bluetooth operation likely cancelled. Error code: ${e.code}, message: ${e.message}`);
            console.error(e);
            Sentry.captureException(e);
            return;
        }
        else {
            console.error(`Unexpected exception during bluetooth. Exception type: ${typeof e}, e: ${e}`);
            alert(`Unexpected exception during bluetooth. Exception type: ${typeof e}, e: ${e}`);
            throw e;
        }

    }
}

function maybeCO2(co2: number | null) {
    if (co2 === null) {
        return (
            <span>
                No CO2 value.
            </span>
        );
    }
    return (
        <span>
            CO2: {co2}ppm
        </span>
    )
}

const RED_COLOR_OBJECT_STYLE = {color: 'red'};

function maybeBluetoothAvailableError(bluetoothAvailableError: string | null) {
    if (bluetoothAvailableError === null) {
        return (
            <div></div>
        );
    }
    return (
        <div style={RED_COLOR_OBJECT_STYLE}>
            Bluetooth might not be available. Error: {bluetoothAvailableError}
        </div>
    )
}

function maybeBluetoothAvailable(bluetoothAvailable: boolean | null) {
    if (bluetoothAvailable === null) {
        return (
            <div></div>
        );
    }
    if (bluetoothAvailable) {
        return (
            <div>
                Bluetooth available.
            </div>
        );
    }
    return (
        <div style={RED_COLOR_OBJECT_STYLE}>
            Bluetooth not available.
        </div>
    );
}

interface WatchAdvertisementsOptions {
    signal: AbortSignal;
  }

type watchAdvertisements = (options: WatchAdvertisementsOptions) => Promise<undefined>;

// type handlerType = ((device: BluetoothDevice, event: BluetoothAdvertisingEvent, abortController: AbortController) => Promise<void>);


function rfDataFromEvent(event: BluetoothAdvertisingEvent) {
    const rfData: RFData = {
        txPower: null,
        rssi: null
    };

    if (event.txPower !== undefined) {
        rfData.txPower = event.txPower;
    }
    if (event.rssi !== undefined) {
        rfData.rssi = event.rssi;
    }
    return rfData;
}

const watchAdvertisementEventReceived = async (device: BluetoothDevice, event: BluetoothAdvertisingEvent, abortController: AbortController, dispatch: AppDispatch): Promise<void> => {
    abortController.abort();
    messages(`Received advertisement from '${device.name}', id: '${device.id}...`, dispatch);

    messages(`Event: name: '${event.name}', appearance: '${event.appearance}', rssi: '${event.rssi}', txPower: '${event.txPower}'`, dispatch);
    debugger;
    const rfData: RFData = rfDataFromEvent(event);

    dispatch(setRFData(rfData));
    if (device.gatt === undefined) {
        messages("device.gatt undefined? CANNOT query seemlessly", dispatch);
        debugger;
        return;
    }

    //https://source.chromium.org/chromium/chromium/src/+/main:content/browser/bluetooth/web_bluetooth_service_impl.cc;drc=0a303e330572dd85a162460d4d9e9959e2c917a6;bpv=1;bpt=1;l=1986?q=requestDevice%20lang:C%2B%2B&ss=chromium
    dispatch(setDeviceID(device.id));
    if (device.name !== undefined) {
        dispatch(setDeviceName(device.name));
    }
    else {
        debugger;
        dispatch(setDeviceName(''));
    }

    const deviceServer = await device.gatt.connect();
    messages(`Connected seamlessly!`, dispatch);
    dispatch(setDeviceServer(deviceServer));

}


const useBluetoothAdvertisementReceived = (bluetoothDevicesKnown: (BluetoothDevice[] | null)): (BluetoothRemoteGATTServer | null) => {
    // const savedHandler: MutableRefObject<handlerType | undefined> = useRef();
    // const [deviceServer, setDeviceServer] = useState(null as (BluetoothRemoteGATTServer | null));
    const deviceServer = useSelector(selectDeviceServer);
    
    const dispatch = useDispatch();

    // useEffect(() => {
    // }, [deviceServer?.connected])

    useEffect(() => {
        if (bluetoothDevicesKnown === null) {
            messages('Loading known bluetooth devices...', dispatch);
            return;
        }
        if (bluetoothDevicesKnown.length === 0) {
            messages('Zero available bluetooth devices from "getDevices" .', dispatch);
            return;
        }
        if (deviceServer) {
            if (deviceServer?.connected) {
                messages('Connected? Eh?', dispatch);
                return;
            }
        }
        messages(`The browser reports ${bluetoothDevicesKnown.length} bluetooth devices known. NOTE: for now, only querying one.`, dispatch);
        for (let i = 0; i < bluetoothDevicesKnown.length; ++i) {
            messages(`\tDevice ${i}: ${bluetoothDevicesKnown[i].name}`, dispatch);
        }
        if (bluetoothDevicesKnown.length > 1) {
            console.warn(`There are ${bluetoothDevicesKnown.length} devices! Will ignore all but first.`);
        }
        // messages("let's try and request them without a user gesture using the 'advertisementreceived' event and 'watchAdvertisements'...", dispatch);

        //See  https://googlechrome.github.io/samples/web-bluetooth/watch-advertisements-and-connect.html
        //also https://googlechrome.github.io/samples/web-bluetooth/watch-advertisements-and-connect-async-await.html
        const abortController = new AbortController();
        const deviceToConnectTo = bluetoothDevicesKnown[0];
        const eventListenerRefShim = (event: BluetoothAdvertisingEvent) => {
            watchAdvertisementEventReceived(deviceToConnectTo, event, abortController, dispatch);
        }

        const options = {once: true};
        if (deviceToConnectTo === undefined) {
            debugger;
            return;
        }
        if (deviceToConnectTo.addEventListener === undefined) {
            debugger;
            return;
        }
        (deviceToConnectTo.addEventListener as any)('advertisementreceived', eventListenerRefShim, options);

        messages("waiting for device advertisements?", dispatch);
        if (deviceToConnectTo.watchAdvertisements === undefined) {
            debugger;
            return;
        }
        ((deviceToConnectTo.watchAdvertisements as watchAdvertisements)({signal: abortController.signal }));

        if (deviceToConnectTo.removeEventListener === undefined) {
            debugger;
            return;
        }

        return () => {
            (deviceToConnectTo.removeEventListener as any)('advertisementreceived', eventListenerRefShim, options);
        };
    }, [bluetoothDevicesKnown, dispatch, deviceServer?.connected]);

    return deviceServer;

}

const MaybeIfValue: React.FC<{text: string, value: any}> = ({text, value}) => {
    if (value === undefined) {
        return null;
    }
    if (value === null) {
        return null;
    }

    // if (value === null) {
    //     return (
    //     <div>
    //         <span>{text}</span>Loading...<br/>
    //     </div>            
    //     )
    // }
    return (
        <div>
            <span>{text}</span>{value}<br/>
        </div>
    );
}

const MaybeIfValueBoolean: React.FC<{text: string, value: boolean | null}> = ({text, value}) => {
    if (value === null) {
        return null;
    }
    if (!value) {
        return null;
    }

    // if (value === null) {
    //     return (
    //     <div>
    //         <span>{text}</span>Loading...<br/>
    //     </div>            
    //     )
    // }
    return (
        <div>
            <span>{text}</span><br/>
        </div>
    );
}

function falsyNavigatorBluetooth(dispatch: AppDispatch) {
    dispatch(setBluetoothAvailable(false));
    if (navigator.bluetooth === null) {
        dispatch(setBluetoothAvailableError("navigator.bluetooth === null, bluetooth is not availabe."));
    }
    else if (navigator.bluetooth === undefined) {
        dispatch(setBluetoothAvailableError("navigator.bluetooth === undefined, bluetooth is not availabe."));
    }
    else {
        Sentry.captureMessage(`navigator.bluetooth === ${navigator.bluetooth}`);
        dispatch(setBluetoothAvailableError(`navigator.bluetooth === ${navigator.bluetooth}, bluetooth is not availabe.`));
    }
    messages('Cannot use bluetooth, navigator.bluetooth is not exposed properly.', dispatch);

}

function falsyGetDevices(dispatch: AppDispatch) {
    if ((navigator.bluetooth.getDevices as any) === undefined) {
        messages('Cannot seamlessly connect, getDevices is undefined', dispatch);
        return;
    }
    else if ((navigator.bluetooth.getDevices as any) === null) {
        messages('Cannot seamlessly connect, getDevices is null', dispatch);
        return;
    }
    Sentry.captureMessage(`getDevices is an unexpected value: ${navigator.bluetooth.getDevices}`);
    messages(`Cannot seamlessly connect, getDevices is an unexpected value: ${navigator.bluetooth.getDevices}`, dispatch);
}

function getDevicesSupported(dispatch: AppDispatch, setBluetoothDevicesKnown: React.Dispatch<React.SetStateAction<BluetoothDevice[] | null>>): boolean {
    if (!(navigator.bluetooth)) {
        falsyNavigatorBluetooth(dispatch);
        setBluetoothDevicesKnown([]);
        dispatch(setSupportsBluetooth(false));
        return false;
    }
    dispatch(setSupportsBluetooth(true));
    // debugger;
    if(!(navigator.bluetooth.getDevices as any)) {
        falsyGetDevices(dispatch);
        setBluetoothDevicesKnown([]);
        dispatch(setSupportsGetDevices(false));
        return false;
    }
    // debugger;
    dispatch(setSupportsGetDevices(true));
    dispatch(setSupportsBluetooth(true));
    return true;
}

// NOTE TO SELF, bluetooth can be finicky! Here's the chrome error handling class:
// https://source.chromium.org/chromium/chromium/src/+/main:third_party/blink/renderer/modules/bluetooth/bluetooth_error.h;l=36;drc=a817d852ea2f2085624d64154ad847dfa3faaeb6
// This should also work? https://source.chromium.org/chromium/chromium/src/+/main:third_party/blink/renderer/modules/bluetooth/bluetooth_error.h
// The full mapping code is here: https://source.chromium.org/chromium/chromium/src/+/main:third_party/blink/renderer/modules/bluetooth/bluetooth_error.cc;l=90

async function tryGetDevices(dispatch: AppDispatch, setBluetoothDevicesKnown: React.Dispatch<React.SetStateAction<BluetoothDevice[] | null>>) {
    if (!getDevicesSupported(dispatch, setBluetoothDevicesKnown)) {
        return;
    }
    console.assert(navigator.bluetooth.getDevices as any);
    //Aha! There's a google doc: https://docs.google.com/document/d/1h3uAVXJARHrNWaNACUPiQhLt7XI-fFFQoARSs1WgMDM/edit#heading=h.jdnga4sjs82y
    messages('User browser supports getDevices!', dispatch);
    const knownDevices = await getAvailableDevices();
    setBluetoothDevicesKnown(knownDevices);
}

function trySeamlessConnectionOnceAvailable(dispatch: AppDispatch, seamlesslyConnectedDeviceServer: BluetoothRemoteGATTServer | null) {
    if (seamlesslyConnectedDeviceServer === null) {
        return;
    }
    if (seamlesslyConnectedDeviceServer.device.name === undefined) {
        messages(`Something is WRONG. device.name is undefined!`, dispatch);
        return;
    }
    if (seamlesslyConnectedDeviceServer.device.name.includes('Aranet')) {
        messages('Starting automatic query...', dispatch);
        getAranet4DataOverBluetooth(dispatch, seamlesslyConnectedDeviceServer).then(() => {
            messages('query complete!', dispatch);
        })
    }
}

//
function DisplayAppleNotSupported(): JSX.Element {
    const [runningOnMobileSafari, ] = useState(isMobileSafari());

    if (runningOnMobileSafari) {
        return (
            <div>
                <a href="https://www.zdnet.com/article/apple-declined-to-implement-16-web-apis-in-safari-due-to-privacy-concerns/">Apple does NOT support Web Bluetooth</a>. Sorry! Complain to Apple :)<br/>
            </div>
        );
    }
    return (
        <div>

        </div>
    );
}

function DisplayChromeSupported(): JSX.Element {
    const supportsGetDevices = useSelector(selectSupportsGetDevices);
    const [browser, ] = useState(Bowser.getParser(window.navigator.userAgent).getBrowser());
    console.warn(`A page or script is accessing at least one of navigator.userAgent, navigator.appVersion, and navigator.platform. Starting in Chrome 101, the amount of information available in the User Agent string will be reduced.
    To fix this issue, replace the usage of navigator.userAgent, navigator.appVersion, and navigator.platform with feature detection, progressive enhancement, or migrate to navigator.userAgentData.
    Note that for performance reasons, only the first access to one of the properties is shown.`);
    console.log("Notes to self, see the following:");
    console.log("https://blog.chromium.org/2021/09/user-agent-reduction-origin-trial-and-dates.html");
    console.log("https://web.dev/migrate-to-ua-ch/");
    console.log("https://www.chromium.org/updates/ua-reduction/");
    const [os, ] = useState(Bowser.getParser(window.navigator.userAgent).getOS());
    if (browser.name === 'Chrome') {
        if ((os.name === 'Android')|| (os.name === 'Windows') || (os.name === 'macOS')) {
            if (!supportsGetDevices)
                return (
                    <div>
                        You might be able to seamlessly work with bluetooth. Try <a href="https://www.androidcentral.com/how-enable-flags-chrome">enabling</a> the new permissions backend and experimental web platform features:<br/>
                        Type <i>chrome://flags/#enable-web-bluetooth-new-permissions-backend</i> into your address bar and hit enter, and enable that option.<br/>
                        Type <i>chrome://flags/#enable-experimental-web-platform-features</i> into your address bar and hit enter, and enable that option.<br/>
                    </div>
                );
        }
    }
    return (
        <div></div>
    )
}

function Compatibility(): JSX.Element {
    const supportsBluetooth = useSelector(selectSupportsBluetooth);
    const supportsGetDevices = useSelector(selectSupportsGetDevices);
    

    return (
        <div>
            <MaybeIfValueBoolean text={"Bluetooth supported."} value={supportsBluetooth}/>
            <MaybeIfValueBoolean text={"getDevicesSupported."} value={supportsGetDevices}/>
            <DisplayAppleNotSupported/>
            <DisplayChromeSupported/>
        </div>
    );
}

// const stopPollingAndReconnect = async (seamlesslyConnectedDeviceServer: BluetoothRemoteGATTServer, timerHandle: number | null, setTimerHandle: React.Dispatch<React.SetStateAction<number | null>>) => {
//     // debugger;
//     console.log('aranet4 disconnected!');
//     await seamlesslyConnectedDeviceServer.connect();
//     // clearIntervalHandle(handle);
//     // await tryGetDevices(dispatch, setBluetoothDevicesKnown);

// }

const polling = async (seamlesslyConnectedDeviceServer: BluetoothRemoteGATTServer | null, timerHandle: number | null, setTimerHandle: React.Dispatch<React.SetStateAction<number | null>>, dispatch: AppDispatch) => {
    // debugger;
    if (seamlesslyConnectedDeviceServer === null) {
        console.log('no device server to poll...');
        setTimerHandle(null);
        return;
    }
    // console.log('Polling aranet4...');
    if (!seamlesslyConnectedDeviceServer.connected) {
        if (timerHandle !== null) {
            clearTimeout(timerHandle);
            setTimerHandle(null);
        }

        // await stopPollingAndReconnect(seamlesslyConnectedDeviceServer, timerHandle, setTimerHandle, dispatch);
        // debugger;
        // await startPolling(timerHandle, setTimerHandle, dispatch, pollingInterval, polling);
        messages('Connection lost before polling device!', dispatch);
        setTimerHandle(null);
        // debugger
        return;
    }

    //https://source.chromium.org/chromium/chromium/src/+/main:third_party/blink/renderer/modules/bluetooth/bluetooth_error.cc;l=142?q=requestDevice%20lang:C%2B%2B&ss=chromium
    try {

        await getBasicAranet4DataOverBluetooth(dispatch, seamlesslyConnectedDeviceServer);
    }
    catch (e) {
        if (e instanceof DOMException) {
            console.log(e);
            Sentry.captureException(e);
            debugger;
        }
        else {
            console.error(e);
            debugger;
            throw e;
        }
    }
    // messages('Polling aranet4 complete!', dispatch);
    setTimerHandle(null);
};

const POLLING_INTERVAL = (1000 * 10);

const usePolling = (seamlesslyConnectedDeviceServer: BluetoothRemoteGATTServer | null) => {
    const dispatch = useDispatch();
    const [timingHandle, setTimingHandle] = useState(null as (number | null))
    const [bumpPolling, setBumpPolling] = useState(false);

    useEffect(() => {
        if (timingHandle === null) {
            if (seamlesslyConnectedDeviceServer === null) {
                messages('No server, no polling', dispatch);
                return;
            }
            if (!(seamlesslyConnectedDeviceServer.connected)) {
                messages('not connected, cannot poll.', dispatch);
                return;
            }
            // if (seamlesslyConnectedDeviceServer.connected)
            const now = new Date();
            messages(`(${now.toLocaleDateString()} ${now.toLocaleTimeString()}): Requesting aranet4 polling (in ${POLLING_INTERVAL/1000} seconds)...`, dispatch);
            const handle: number = setTimeout(() => {
                try {
                    polling(seamlesslyConnectedDeviceServer, timingHandle, setTimingHandle, dispatch)
                }
                catch(e) {
                    debugger;
                }
            }, POLLING_INTERVAL) as any as number;
            setTimingHandle(handle);
        }
        else {
            console.log("Polling in progress...");
        }
        return (() => {
            if (timingHandle !== null) {
                clearTimeout(timingHandle);
            }
        });
    
    }, [seamlesslyConnectedDeviceServer, dispatch, timingHandle, bumpPolling, seamlesslyConnectedDeviceServer?.connected]);

    useEffect(() => {
        async function connectOnLoss() {
            if (seamlesslyConnectedDeviceServer !== null) {
                if (seamlesslyConnectedDeviceServer.connected) {
                    return;
                }
                const shouldBeFalse = seamlesslyConnectedDeviceServer.connected;
                messages(`Aranet4 connection lost! Reconnecting automatically.`, dispatch)
                await seamlesslyConnectedDeviceServer.connect();
                console.assert(shouldBeFalse !== seamlesslyConnectedDeviceServer.connected);
                // setTimingHandle(null);
                messages('Reconnected...', dispatch);
                setBumpPolling(!bumpPolling);
            }
        }
        connectOnLoss();
    }, [seamlesslyConnectedDeviceServer, dispatch, bumpPolling, seamlesslyConnectedDeviceServer?.connected]);


    // setRepeatingQueryTimerHandle(handle);
    return (timingHandle !== null);

}

export function BluetoothTesting(): JSX.Element {
    const debugText = useSelector(selectDebugText);
    const bluetoothAvailableError = useSelector(selectBluetoothAvailableError);
    const bluetoothAvailable = useSelector(selectBluetoothAvailable);

    const deviceNameFromCharacteristic = useSelector(selectDeviceNameFromCharacteristic);
    const deviceName = useSelector(selectDeviceName);
    // const deviceID = useSelector(selectDeviceID);
    const deviceInformation = useSelector(selectGattDeviceInformation);
    
    const rfData = useSelector(selectRFData);

    const measurementData = useSelector(selectMeasurementData);
    const aranet4SpecificData = useSelector(selectAranet4SpecificData);
    const battery = useSelector(selectBattery);

    const [bluetoothDevicesKnown, setBluetoothDevicesKnown] = useState(null as (BluetoothDevice[] | null));

    const seamlesslyConnectedDeviceServer = useBluetoothAdvertisementReceived(bluetoothDevicesKnown);
    const pollingHook = usePolling(seamlesslyConnectedDeviceServer);
    // const [repeatingQueryTimerHandle, setRepeatingQueryTimerHandle] = useState(null as (ReturnType<typeof setTimeout> | null));

    const dispatch = useDispatch();

    useEffect(() => {
        tryGetDevices(dispatch, setBluetoothDevicesKnown);
    }, [dispatch]);

    useEffect(() => {
        trySeamlessConnectionOnceAvailable(dispatch, seamlesslyConnectedDeviceServer);
    }, [seamlesslyConnectedDeviceServer, dispatch]);
    
    const checkBluetoothAvailable = () => {
        checkBluetooth(dispatch);
    }

    const queryDeviceOverBluetooth = () => {
        debugger;
        bluetoothTestingStuffFunc(dispatch);
    }

    const queryAranet4 = () => {
        getAranet4DataOverBluetooth(dispatch, seamlesslyConnectedDeviceServer);
    }

    const connectDevice = () => {
        maybeConnectDevice(dispatch, seamlesslyConnectedDeviceServer);
    }
    // useEffect(() => {
    // }, [seamlesslyConnectedDeviceServer, dispatch]);


    return (
        <div>
            <h3>Experimental Bluetooth support</h3><br/>
            <Compatibility/><br/>

            <MaybeIfValue text={"Bluetooth device name: "} value={deviceName}/>
            <MaybeIfValue text={"Device name (GATT characteristic): "} value={deviceNameFromCharacteristic}/>
 
 
            {/* It turns out that device.id is just a random runtime string. Not a useful ID */}
            {/* <MaybeIfValue text={"Unique Bluetooth device ID: "} value={deviceID}/> */}

            {maybeCO2(measurementData.co2)}<br/>
            Temperature: {measurementData.temperature}°C<br/>
            Pressure: {measurementData.barometricPressure}hPa<br/>
            Relative Humidity: {measurementData.humidity}%<br/>
            Battery: {battery}%<br/>
            Aranet4 color: {aranet4SpecificData.aranet4Color}<br/>
            <br/>
            
            <MaybeIfValue text={"Measurement interval (seconds): "} value={aranet4SpecificData.aranet4MeasurementInterval}/>
            <MaybeIfValue text={"Measurement taken: "} value={aranet4SpecificData.aranet4MeasurementTime}/>
            <MaybeIfValue text={"Seconds since last update: "} value={aranet4SpecificData.aranet4SecondsSinceLastMeasurement}/>
            <MaybeIfValue text={"Total number of measurements: "} value={aranet4SpecificData.aranet4TotalMeasurements}/>
            <MaybeIfValue text={"Calibration: "} value={aranet4SpecificData.aranet4Calibration}/>
            <br/>
            <MaybeIfValue text={"Manufacturer: "} value={deviceInformation.manufacturerName}/>
            <MaybeIfValue text={"Model number: "} value={deviceInformation.modelNumber}/>
            <MaybeIfValue text={"Firmware revision: "} value={deviceInformation.firmwareRevision}/>
            <MaybeIfValue text={"Software revision: "} value={deviceInformation.softwareRevision}/>
            <MaybeIfValue text={"Hardware revision: "} value={deviceInformation.hardwareRevision}/>
            <MaybeIfValue text={"Signal strength (db): "} value={rfData.rssi}/>
            <MaybeIfValue text={"Aranet4 transmission power (db): "} value={rfData.txPower}/>
            <br/>
            <Button onClick={queryAranet4}>Query Aranet4</Button>
            <Button onClick={queryDeviceOverBluetooth}>Dump ALL Bluetooth device info, attempt query</Button><br/>
            <Button onClick={checkBluetoothAvailable}>Check bluetooth availability</Button>
            <Button onClick={()=>{connectDevice()}} disabled={!!pollingHook}  >Start polling</Button><br/>
            {maybeBluetoothAvailable(bluetoothAvailable)}<br/>
            {maybeBluetoothAvailableError(bluetoothAvailableError)}<br/>
            <br/>

            <pre>{debugText}</pre>
        </div>
    )
}