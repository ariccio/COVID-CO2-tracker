/* eslint-disable no-debugger */
/* eslint-disable react/prop-types */
// See updated (more restrictive) licensing restrictions for this subproject! Updated 02/03/2022.
import {Buffer} from 'buffer';
import Constants from 'expo-constants';
import { startActivityAsync, ActivityAction, IntentLauncherResult, IntentLauncherParams } from 'expo-intent-launcher';
import { useEffect, useState } from 'react';
import { PermissionsAndroid, Text, Button, NativeSyntheticEvent, NativeTouchEvent, Permission, Rationale, Platform } from 'react-native';
import AlertAsync from "react-native-alert-async";
import { BleManager, Device, BleError, LogLevel, Service, Characteristic, BleErrorCode, State, BleAndroidErrorCode } from 'react-native-ble-plx';
import { useDispatch, useSelector } from 'react-redux';
import * as Sentry from 'sentry-expo';


import * as BLUETOOTH from '../../../../co2_client/src/utils/BluetoothConstants';
import { UserInfoDevice } from '../../../../co2_client/src/utils/DeviceInfoTypes';
import { selectBackgroundPollingEnabled } from '../../app/globalSlice';
import { AppDispatch } from '../../app/store';
import { unknownNativeErrorTryFormat } from '../../utils/FormatUnknownNativeError';
import { MaybeIfValue, MaybeIfValueGreaterThan, MaybeIfValueLessThan, MaybeIfValueNot, MaybeIfValueTrue } from '../../utils/RenderValues';
import { timeNowAsString } from '../../utils/TimeNow';
import { COVID_CO2_TRACKER_DEVICES_URL } from '../../utils/UrlPaths';
import { useIsLoggedIn } from '../../utils/UseLoggedIn';
import { LinkButton } from '../Links/OpenLink';
// import { addMeasurement } from '../Measurement/MeasurementSlice';
import { MeasurementDataForUpload } from '../Measurement/MeasurementTypes';
import { setUploadStatus } from '../Uploading/uploadSlice';
import { initialUserDevicesState, selectSupportedDevices, selectUserDeviceSettingsStatus } from '../userInfo/devicesSlice';
import { Aranet4_1503CO2, incrementUpdates, selectAranet4SpecificData, selectDeviceBatterylevel, selectDeviceID, selectDeviceName, selectDeviceRSSI, selectDeviceSerialNumberString, selectDeviceStatusString, selectHasBluetooth, selectMeasurementData, selectMeasurementInterval, selectMeasurementTime, selectNativeOSBluetoothStateListenerErrors, selectNeedsBluetoothTurnOn, selectScanningErrorStatusString, selectScanningStatusString, selectSubscribedOSBluetoothState, selectUpdateCount, setAranet4Color, setAranet4SecondsSinceLastMeasurement, setDeviceBatteryLevel, setDeviceID, setDeviceName, setDeviceSerialNumber, setDeviceStatusString, setHasBluetooth, setMeasurementDataFromCO2Characteristic, setMeasurementInterval, setNativeOSBluetoothStateListenerErrors, setNeedsBluetoothTurnOn, setRssi, setScanningErrorStatusString, setScanningStatusString, setSubscribedBluetoothState } from './bluetoothSlice';


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
const bluetoothDebugDumps = false;
if (__DEV__) {
    console.log("setting ble loglevel high.");
    manager.setLogLevel(LogLevel.Debug);

    // pidof -s riccio.co2.client
    // adb logcat --pid= ...
    console.log('see comment for logcat instructions.');
}

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
function checkKnownFunctionDescription(characteristic: Characteristic, index: number, length: number) {
    if (BLUETOOTH.aranet4KnownCharacteristicUUIDDescriptions.has(characteristic.uuid)) {
        console.log(`\t\t\t${characteristic.uuid} (${index}/${length}): Known Aranet4 characteristic! '${BLUETOOTH.aranet4KnownCharacteristicUUIDDescriptions.get(characteristic.uuid)}'`);
        return;
    }
    else if (BLUETOOTH.GENERIC_GATT_SERVICE_UUID_DESCRIPTIONS.has(characteristic.uuid)) {
        console.log(`\t\t\t${characteristic.uuid} (${index}/${length}): Known generic GATT characteristic! '${BLUETOOTH.GENERIC_GATT_SERVICE_UUID_DESCRIPTIONS.get(characteristic.uuid)}'`);
        return;
    }
    console.log(`\t\t\tUNKNOWN GATT characteristic! (${index}/${length}) '${characteristic.uuid}'`);
}

function dumpCharacteristics(characteristics: Characteristic[]) {
    for (let characteristicIndex = 0; characteristicIndex < characteristics.length; ++characteristicIndex) {
        const thisCharacteristic = characteristics[characteristicIndex];
        checkKnownFunctionDescription(thisCharacteristic, characteristicIndex, characteristics.length);
    }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function dumpServiceDescriptions(services: Service[]) {
    for (let serviceIndex = 0; serviceIndex < services.length; ++serviceIndex) {
        const thisService = services[serviceIndex];
        console.log(`\tservice ${serviceIndex}/${services.length}:`)

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
    console.log("Dump done.");
}


const scanCallback = async (error: BleError | null, scannedDevice: Device | null, dispatch: AppDispatch) => {
    if (error) {
        //TODO: if bluetooth is off, will get BleErrorCode.BluetoothPoweredOff (102);
        // debugger;
        if (error.errorCode === BleErrorCode.BluetoothPoweredOff) {
            console.log("Bluetooth off.");
            dispatch(setNeedsBluetoothTurnOn(true));
            dispatch(setScanningStatusString("Please turn bluetooth on."));
            return;
        }

        const str_1 = `error scanning: ${bleErrorToUsefulString(error)}`;
        console.error(str_1);
        Sentry.Native.captureMessage(str_1);


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
    const beginStr = `Beginning scan for devices with services: ${aranetService}...`;
    dispatch(setScanningStatusString(beginStr));
    console.log(beginStr);
    manager.startDeviceScan(aranetService, null, (error, scannedDevice) => scanCallback(error, scannedDevice, dispatch));
}

const PERMISSION_MESSAGE_TEXT = "While I don't need your precise location, annoying Android limitations mean I need the 'background location' permission to use bluetooth in the background. Measurements uploaded with this app are intended for public viewing - any interested person can use them to guess the location from which the device is uploading.";
const ALERT_MESSAGE_TEXT = "CO2 tracker uploader needs location permissions so that it may continue to collect measurements while the app is in the background or not in use.";
const ALERT_TITLE = "CO2 tracker needs location!";

const YES_STRING = 'yes';
const NO = Promise.resolve('no');

const CANCEL_DISMISS_OPTIONS = {
    cancelable: true,
    onDismiss: () => NO
};


const messages = async (dispatch: AppDispatch): Promise<boolean> => {
    // alert(alertMessageText);
    const buttons = [
        {text: "Ok!", onPress: () => YES_STRING},
        {text: "No", onPress: () => NO}
    ];

    console.log('starting async alert!');
    const choice = await AlertAsync(ALERT_TITLE, ALERT_MESSAGE_TEXT, buttons, CANCEL_DISMISS_OPTIONS);
    console.log(`async alert done! ${choice}`);
    if (choice !== YES_STRING) {
        dispatch(setScanningStatusString(`User said no.`));
        return true;
    }

    const choiceTwo = await AlertAsync("More detail:", PERMISSION_MESSAGE_TEXT, buttons, CANCEL_DISMISS_OPTIONS);
    if (choiceTwo !== YES_STRING) {
        dispatch(setScanningStatusString(`User said no.`));
        return true;
    }
    return false;
}

function androidPackageName(): string {
    // https://medium.com/toprakio/react-native-how-to-open-app-settings-page-d30d918a7f55
    if (Constants.manifest === null) {
        console.error("Manifest null!");
        throw new Error("Manifest null!");
    }
    console.log(Constants.manifest);
    if (Constants.manifest.releaseChannel === undefined) {
        console.log("Release channel is undefined");
        
        debugger;
        return 'riccio.co2.client';
        // return 'co2_native_client';
        // return 'host.exp.exponent';
    }
    
    if (Constants.manifest.android === undefined) {
        console.error("Not android.");
        throw new Error("Not android");
    }

    if (Constants.manifest.android.package === undefined) {
        console.error("Package undefined?");
        throw new Error("Package undefined?");
    }
    console.log(`Using package: ${Constants.manifest.android.package }`);
    return Constants.manifest.android.package;
    // const pkg = Constants.manifest.releaseChannel
    // ? Constants.manifest.android.package
    // : 'host.exp.exponent'

}


const bluetoothNeverAskAgainDialogMaybeSettings = async(dispatch: AppDispatch): Promise<void> => {
    const settingsButtons = [
        {text: "Open settings", onPress: () => YES_STRING},
        {text: "Cancel", onPress: () => NO}
    ];
    
    const title = "You said no bluetooth, ever!";
    const messageText = `You did not allow this app to bluetooth, and you told android to "never ask again"! You can change this in the app settings, then restart the app.`
    
    const choice = await AlertAsync(title, messageText, settingsButtons, CANCEL_DISMISS_OPTIONS);
    console.log(`Choice: ${choice}`);
    if (choice === YES_STRING) {
        try {
            const intentLauncherParams: IntentLauncherParams = {
                data: `package:${androidPackageName()}`
            }
            const settingsActionResult: IntentLauncherResult = await startActivityAsync(ActivityAction.APPLICATION_DETAILS_SETTINGS, intentLauncherParams);
            console.log(`Bluetooth settings intent returned resultCode: "${settingsActionResult.resultCode}", "data: "${settingsActionResult.data}, extra: "${settingsActionResult.extra}"`);
            if (settingsActionResult.resultCode !== 0) {
                Sentry.Native.captureMessage(`Unexpected IntentLauncherResult: '${JSON.stringify(settingsActionResult)}'`);
            }
            // if (settingsActionResult === )
            return;
    
        }
        catch(error) {
            dispatch(setScanningStatusString(`Some kind of unexpected error when trying to open settings: ${unknownNativeErrorTryFormat(error, true)}`));
            Sentry.Native.captureException(error);
            return;
        }
    
    }
    return;
}

const BLUETOOTH_SCAN_PERMISSION_RATIONALE: Rationale = {
    title: "CO2 tracker needs to use bluetooth to work!",
    message: "I use bluetooth to scan for and talk to your aranet4. Without bluetooth, I can't read your co2ppm.",
    buttonPositive: "Ok, enable bluetooth scanning!"
}

const BLUETOOTH_CONNECT_PERMISSION_RATIONALE: Rationale = {
    title: "CO2 tracker needs to use bluetooth to work!",
    message: "I use bluetooth to scan for and talk to your aranet4. Without bluetooth, I can't read your co2ppm. Android wants me to ask for the permission to connect in addition to all the others too, sorry!",
    buttonPositive: "Ok, enable bluetooth connection!"
}

const LOCATION_PERMISSION_RATIONALE: Rationale = {
    title: ALERT_TITLE,
    message: PERMISSION_MESSAGE_TEXT,
    buttonPositive: "Ok, enable location!"
}

const androidNeedUserLocationPermissions = async (dispatch: AppDispatch): Promise<boolean> => {
    const LOCATION_PERMISSION_STRING = PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION;
    const hasLocationAlready = await PermissionsAndroid.check(LOCATION_PERMISSION_STRING);
    
    if (!hasLocationAlready) {
        console.warn(`Location (${LOCATION_PERMISSION_STRING}) NOT available: ${hasLocationAlready}`);
        console.log('Showing user location permission dialogs.')
        const deny = await messages(dispatch);
        if (deny) {
            console.log("User denied?");
            return true;
        }
        console.log("User allowed?");
        return false;
    }
    console.log(`Location (${LOCATION_PERMISSION_STRING}) available: ${hasLocationAlready}`);
    return false;
}

// const iosUserLocationPermissions = async (dispatch: AppDispatch): Promise<boolean> => {
//     console.log("Not sure what to do for IOS permissions?!")
//     return false;
// }

const maybeNeedPromptUserAboutLocationPermissions = async (dispatch: AppDispatch): Promise<boolean> => {
    
    try {
        console.log("Checking if location is available already...");
        const os = Platform.OS;
        console.log(`On platform: '${os}'`);
        switch (os) {
            case ('ios'): {
                // const iosResult = await iosUserLocationPermissions(dispatch);
                // if (iosResult) {
                //     return true;
                // }
                // break;
                dispatch(setScanningStatusString(null));
                console.log("No location permissions needed on ios?.");
                return true;

            }
            case ('android') : {
                dispatch(setScanningStatusString('Need permission to use bluetooth first.'));
                const denied = await androidNeedUserLocationPermissions(dispatch);
                if (denied) {
                    return true;
                }
                return false;
            }
        }
    }
    catch (error) {
        dispatch(setScanningStatusString(`Some kind of unexpected error when checking location permission: ${unknownNativeErrorTryFormat(error)}`));
        Sentry.Native.captureException(error);
        return true;
    }

    return false;
}


// NOTE TO SELF: if the string is invalid, like 'fartipelago', it will return NEVER_ASK_AGAIN. Possibly because react-native gets a 'false' when it calls shouldShowRequestPermissionRationale.
// const scan = PermissionsAndroid.PERMISSIONS.android.permission.BLUETOOTH_SCAN;
const SCAN_PERMISSION_STRING = 'android.permission.BLUETOOTH_SCAN';
// const typeofRequest = ((permission: string, rationale?: any): unknown)

function logBluetoothScanPermissionProbablyNotAvailable(): void {
    console.warn(`On Platform.Version ${Platform.Version}, BLUETOOTH_SCAN may not be a permission yet. So, NEVER_ASK_AGAIN isn't a problem, it's just the default that react native on android returns for a non-extant permission. This is also a limitation in android itself.`);
}

function logBluetoothConnectScanPermissionProbablyNotAvailable(): void {
    console.log(`On Platform.Version ${Platform.Version}, BLUETOOTH_CONNECT may not be a permission yet. So, NEVER_ASK_AGAIN isn't a problem, it's just the default that react native on android returns for a non-extant permission. This is also a limitation in android itself.`);
}

const checkBluetoothScanPermissions = async(dispatch: AppDispatch): Promise<boolean> => {
    const os = Platform.OS;
    if (os === 'ios') {
        // console.log("No bluetooth scan permissions needed on ios?.");
        return true;
        // const state = await manager.state();
        // switch (state) {
        //     case (State.PoweredOn):
        //         return false;
        //     case (State.Unauthorized):
        //     case (State.PoweredOff):
        //     case (State.Unknown):
        //     case (State.Resetting):
        //         return true;
        //     default:
        //         return true;

        // }
        // // eslint-disable-next-line no-unreachable
        // console.error(`UNREACHABLE code!`);
        // throw new Error("UNREACHABLE");
        // return false;
    }

    try {
        console.log("Checking if bluetooth scan permission is available already...");
        const hasBluetoothScanAlready = await PermissionsAndroid.check(SCAN_PERMISSION_STRING as Permission);
        if (!hasBluetoothScanAlready) {
            console.warn(`hasBluetoothScanAlready: ${hasBluetoothScanAlready}`);    
        }
        else {
            console.log(`hasBluetoothScanAlready: ${hasBluetoothScanAlready}`);
        }
        console.log(`Platform.version: ${Platform.Version}`);
        if (Platform.Version <= 29) {
            logBluetoothScanPermissionProbablyNotAvailable();
            return false;
        }
        console.warn(`Android has returned ${hasBluetoothScanAlready} for PermissionsAndroid.check(${SCAN_PERMISSION_STRING}). I've seen some kind of weird bug when this is false, and that may be because it doesn't exist on some platforms, so it may be worth trying anyways.`);
    }
    catch (error) {
        dispatch(setScanningStatusString(`Some kind of unexpected error when checking bluetooth scan permission: ${unknownNativeErrorTryFormat(error)}`));
        Sentry.Native.captureException(error);
        return true;
    }

    return false;
}


const requestFineLocationPermission = async(dispatch: AppDispatch): Promise<ShouldReturnAndHasBluetooth> => {
    const os = Platform.OS;
    if (os === 'ios') {
        console.log("No location permissions needed on ios?.");
        return {shouldReturn: false, permissionsGranted: true};
    }
    const fineLocStr = 'Requesting fine location permission (needed for bluetooth low energy)...';
    dispatch(setScanningStatusString(fineLocStr));
    console.log(fineLocStr);


    //https://reactnative.dev/docs/permissionsandroid
    try {
        const PERMISSION_TO_REQUEST = PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION;
        const fineLocationResult = await PermissionsAndroid.request(PERMISSION_TO_REQUEST, LOCATION_PERMISSION_RATIONALE);

        if (fineLocationResult === PermissionsAndroid.RESULTS.GRANTED) {
            console.log(`${PERMISSION_TO_REQUEST} granted!`);
            // dispatch(setHasBluetooth(true));
            dispatch(setScanningStatusString('Fine location permission granted! May need scan permission too...'));
            // Do something
            return {shouldReturn: false, permissionsGranted: true};
        } else {
            console.warn(`${PERMISSION_TO_REQUEST} NOT granted! (${fineLocationResult})`);
            dispatch(setScanningStatusString(`Bluetooth (location for bluetooth) permission denied by user: ${fineLocationResult}`));
            dispatch(setHasBluetooth(false));
            debugger;
            // Denied
            // Do something
            return {shouldReturn: true, permissionsGranted: false};
        }    
    }
    catch(error) {
        const coerced = (error as any);
        if (coerced && coerced.code) {
            if (coerced.code === 'E_INVALID_ACTIVITY') {
                console.log("React is idiotic, and that means that sometimes by the time I call PermissionsAndroid.request, the component is no longer mounted or associated with an activity. Android just threw E_INVALID_ACTIVITY in response.");
                return {shouldReturn: true, permissionsGranted: false};
            }
        }
        
        const errStr = `Some kind of unexpected error when requesting location permission: ${unknownNativeErrorTryFormat(error)}`;
        dispatch(setScanningStatusString(errStr));
        console.error(errStr);
        Sentry.Native.captureException(error);
        return {shouldReturn: true, permissionsGranted: false};
    }

    // return false;
}

type ShouldReturnAndHasBluetooth = {
    shouldReturn: boolean;
    permissionsGranted: boolean;
}

const requestBluetoothConnectPermission = async(dispatch: AppDispatch): Promise<ShouldReturnAndHasBluetooth> => {
    const os = Platform.OS;
    if (os === 'ios') {
        console.log("No bluetooth connect permissions needed on ios?.");
        return {shouldReturn: false, permissionsGranted: false};
    }

    const PERMISSION_TO_REQUEST = PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT;
    dispatch(setScanningStatusString(`Requesting ${PERMISSION_TO_REQUEST} permission (needed for bluetooth low energy)...`));
    try {
        const bluetoothConnectPermissionResult = await PermissionsAndroid.request(PERMISSION_TO_REQUEST, BLUETOOTH_CONNECT_PERMISSION_RATIONALE)
        if (bluetoothConnectPermissionResult === PermissionsAndroid.RESULTS.GRANTED) {
            const str = `${PERMISSION_TO_REQUEST} permission granted! May need scan permission too...`;
            dispatch(setScanningStatusString(str));
            console.log(str);
            return {shouldReturn: false, permissionsGranted: true};
        }
        else if (bluetoothConnectPermissionResult === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
            console.warn(`${bluetoothConnectPermissionResult} (NEVER_ASK_AGAIN) for ${PERMISSION_TO_REQUEST}`);
            console.log(`Platform.version: ${Platform.Version}`);
            if (Platform.Version <= 29) {
                logBluetoothConnectScanPermissionProbablyNotAvailable();
                dispatch(setScanningStatusString(null));
                // dispatch(setHasBluetooth(true));
                return {shouldReturn: false, permissionsGranted: true};

            }
            else {
                console.error(`Android has returned ${bluetoothConnectPermissionResult} for PermissionsAndroid.request(${SCAN_PERMISSION_STRING}). I've seen some kind of weird bug when this is false, and that may be because it doesn't exist on some platforms, so it may be worth trying anyways.`);
                dispatch(setScanningStatusString(`Bluetooth scan permission supposedly denied by user PERMANENTLY, may be a bug, will try anyways.`));
                // dispatch(setHasBluetooth(true));
            }
            if (!__DEV__) {
                // Shut up sentry warning for now.
                Sentry.Native.captureMessage(`NEVER_ASK_AGAIN seen.`);
            }
            return {shouldReturn: false, permissionsGranted: true};
            // await bluetoothNeverAskAgainDialogMaybeSettings(dispatch);
            // // IF this was IOS, we could call Linking.openSettings: https://docs.expo.dev/versions/latest/sdk/linking/#linkingopensettings
            // dispatch(setScanningStatusString(`Bluetooth scan permission denied by user PERMANENTLY: ${bluetoothScanPermissionResult}`));
            // dispatch(setHasBluetooth(false));
            // return;
        }
        else {
            console.warn(`${PERMISSION_TO_REQUEST} error: ${bluetoothConnectPermissionResult}`);
            dispatch(setScanningStatusString(`BLUETOOTH_CONNECT permission denied by user: ${bluetoothConnectPermissionResult}`));
            // dispatch(setHasBluetooth(false));
            debugger;
            // Denied
            // Do something
            return {shouldReturn: true, permissionsGranted: false};
        }

    }
    catch(error) {
        const errStr = `Some kind of unexpected error when requesting bluetooth connect permission: ${unknownNativeErrorTryFormat(error)}`;
        dispatch(setScanningStatusString(errStr));
        console.error(errStr);
        Sentry.Native.captureException(error);
        return {shouldReturn: true, permissionsGranted: false};
    }
    // return false;
}


const requestBluetoothScanPermission = async(dispatch: AppDispatch): Promise<ShouldReturnAndHasBluetooth> => {

    try {
        //Work around android.permission.BLUETOOTH_SCAN not existing in old version of react native...
        const bluetoothScanPermissionResult = await PermissionsAndroid.request(SCAN_PERMISSION_STRING as Permission, BLUETOOTH_SCAN_PERMISSION_RATIONALE);
        console.log(`PermissionsAndroid.request(android.permission.BLUETOOTH_SCAN) result: ${bluetoothScanPermissionResult}`)

        // see: https://reactnative.dev/docs/permissionsandroid#result-strings-for-requesting-permissions
        if (bluetoothScanPermissionResult === PermissionsAndroid.RESULTS.GRANTED) {
            // dispatch(setHasBluetooth(true));
            dispatch(setScanningStatusString('Bluetooth scan permission granted!'));
            return {shouldReturn: false, permissionsGranted: true};
        }
        else if (bluetoothScanPermissionResult === PermissionsAndroid.RESULTS.DENIED) {
            const errStr = `Bluetooth scan permission denied by user: ${bluetoothScanPermissionResult}`;
            dispatch(setScanningStatusString(errStr));
            console.warn(errStr);
            // dispatch(setHasBluetooth(false));
            return {shouldReturn: true, permissionsGranted: false};
        }
        else if (bluetoothScanPermissionResult === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
            console.warn(`${bluetoothScanPermissionResult} (NEVER_ASK_AGAIN) for ${SCAN_PERMISSION_STRING}`);
            console.log(`Platform.version: ${Platform.Version}`);
            if (!__DEV__) {
                // Shut up sentry warning for now.
                Sentry.Native.captureMessage(`NEVER_ASK_AGAIN seen.`);
            }

            if (Platform.Version <= 29) {
                logBluetoothScanPermissionProbablyNotAvailable();
                dispatch(setScanningStatusString('NEVER_ASK_AGAIN from bluetooth permissions, but will try anyways.'));
                return {shouldReturn: false, permissionsGranted: true};
                // dispatch(setHasBluetooth(true));
            }
            else {
                console.warn(`Android has returned ${bluetoothScanPermissionResult} for PermissionsAndroid.request(${SCAN_PERMISSION_STRING}). I've seen some kind of weird bug when this is false, and that may be because it doesn't exist on some platforms, so it may be worth trying anyways.`);
                dispatch(setScanningStatusString(`Bluetooth scan permission supposedly denied by user PERMANENTLY, may be a bug, will try anyways.`));
                // dispatch(setHasBluetooth(true));
                return {shouldReturn: false, permissionsGranted: true};
            }
            // await bluetoothNeverAskAgainDialogMaybeSettings(dispatch);
            // // IF this was IOS, we could call Linking.openSettings: https://docs.expo.dev/versions/latest/sdk/linking/#linkingopensettings
            // dispatch(setScanningStatusString(`Bluetooth scan permission denied by user PERMANENTLY: ${bluetoothScanPermissionResult}`));
            // dispatch(setHasBluetooth(false));
            // return;
        }
        else {
            const errStr = `Bluetooth scan permission denied by user (other reason): ${bluetoothScanPermissionResult}`;
            dispatch(setScanningStatusString(errStr));
            console.error(errStr);
            dispatch(setHasBluetooth(false));
            Sentry.Native.captureMessage(`Unexpected scan permission result: '${bluetoothScanPermissionResult}'`);
            return {shouldReturn: true, permissionsGranted: false};
        }

    }
    catch (error) {
        const errStr = `Some kind of unexpected error when requesting bluetooth scan permission: ${unknownNativeErrorTryFormat(error)}`;
        dispatch(setScanningStatusString(errStr));
        console.error(errStr);
        Sentry.Native.captureException(error);
        return {shouldReturn: true, permissionsGranted: false};
    }
}

const iosBluetoothChecks = async (dispatch: AppDispatch, subscribedOSBluetoothState: State | null) => {
    switch (subscribedOSBluetoothState) {
        case (State.PoweredOn): {
            console.log(`ios has bluetooth`);
            dispatch(setHasBluetooth(true));
            return;
        }
        case (null):
            console.log("loading bluetooth state!");
            return;
        case (State.PoweredOff):
        case (State.Resetting):
        case (State.Unauthorized):
        case (State.Unknown):
        case (State.Unsupported):
        default:
            console.warn(`setting hasBluetooth false, ${subscribedOSBluetoothState}`);
            dispatch(setHasBluetooth(false));
            return;
    }
}

// const updateBluetoothPerms = async (dispatch: AppDispatch, subscribedOSBluetoothState: State | null) => {

// }

const requestAllBluetoothPermissions = async (dispatch: AppDispatch, subscribedOSBluetoothState: State | null) => {
    const os = Platform.OS;
    if (os === 'ios') {
        // console.log("No need to request permissions on ios?.");
        
        
        return iosBluetoothChecks(dispatch, subscribedOSBluetoothState);
    }



    const shouldReturnBecauseErrorOrDenyInLocationPermissionsCheck = await maybeNeedPromptUserAboutLocationPermissions(dispatch);
    if (shouldReturnBecauseErrorOrDenyInLocationPermissionsCheck) {
        dispatch(setHasBluetooth(false));
        return;
    }
    
    
    const shouldReturnBecauseErrorOrDenyInRequestingFineLocationPermission = await requestFineLocationPermission(dispatch);
    if (shouldReturnBecauseErrorOrDenyInRequestingFineLocationPermission.shouldReturn) {
        console.assert(!(shouldReturnBecauseErrorOrDenyInRequestingFineLocationPermission.permissionsGranted));
        dispatch(setHasBluetooth(false));
        return;
    }
    if (!(shouldReturnBecauseErrorOrDenyInRequestingFineLocationPermission.permissionsGranted)) {
        dispatch(setHasBluetooth(false));
        return;
    }

    const shouldReturnBecauseErrorOrOtherIssueInBluetoothPermissionsCheck = await checkBluetoothScanPermissions(dispatch);

    if (shouldReturnBecauseErrorOrOtherIssueInBluetoothPermissionsCheck) {
        dispatch(setHasBluetooth(false));
        return;
    }

    const bluetoothConnectShouldReturnAndPermissionsGranted = await requestBluetoothConnectPermission(dispatch);
    if (bluetoothConnectShouldReturnAndPermissionsGranted.shouldReturn) {
        console.assert(!(bluetoothConnectShouldReturnAndPermissionsGranted.permissionsGranted));
        dispatch(setHasBluetooth(false));
        // dispatch(setHasBluetooth(bluetoothConnectShouldReturnAndPermissionsGranted.permissionsGranted));
        return;
    }
    if (!(bluetoothConnectShouldReturnAndPermissionsGranted.permissionsGranted)) {
        dispatch(setHasBluetooth(false));
        return;
    }

    console.log(`Requesting bluetooth scan permission... ${SCAN_PERMISSION_STRING as Permission}`);
    dispatch(setScanningStatusString('Requesting permission to scan bluetooth...'));
    // This worked! It's disgusting enoguh that I don't want to use it, but I'm mildly impressed with myself.
    // const bluetoothScanResult = await (PermissionsAndroid.request as (permission: string) => Promise<any>)(scan);
    const maybeBluetoothScanPermission = await requestBluetoothScanPermission(dispatch);
    if (maybeBluetoothScanPermission.permissionsGranted) {
        console.log("All permissions should be granted?");
        dispatch(setHasBluetooth(true));
        dispatch(setScanningStatusString(null));
    }
    return;
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
    // debugger;
    if (bluetoothDebugDumps) {
        console.log(`Reading ${characteristicUUID}/${characteristicName}`);
    }
    const rawStringCharacteristicValue = await manager.readCharacteristicForDevice(deviceID, serviceUUID, characteristicUUID);
    // debugger;
    if (rawStringCharacteristicValue.value === null) {
        // debugger;
        throw new Error(`${serviceName}: ${characteristicName} value is null?`);
    }
    const stringCharacteristicAsBuffer = Buffer.from(rawStringCharacteristicValue.value, 'base64');
    const stringCharacteristicAsString = parseUTF8StringBuffer(stringCharacteristicAsBuffer);
    return stringCharacteristicAsString;
}

async function readSerialNumberFromBluetoothDevice(deviceID: string): Promise<string> {
    // debugger;
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
    const os = Platform.OS;

    const battery = await readBatteryLevelFromBluetoothDevice(deviceID);

    if (os !== 'ios') {
        const deviceNameString = await readDeviceNameFromBluetoothDevice(deviceID)
        if (deviceNameString.length === 0) {
            console.warn(`Device ${deviceID} has an empty name?`);
        }
        return {
            deviceNameString,
            serialNumberString,
            battery
        };    
    }
    console.assert(os === 'ios');
    console.log("IOS appears to hide the generic access service from usermode apps?! See: https://lists.apple.com/archives/bluetooth-dev/2016/Feb/msg00018.html and https://github.com/dotintent/react-native-ble-plx/issues/657#issuecomment-1331204557")
    return {
        deviceNameString: null,
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

// function aranet4Ready(device: Device | null): boolean {
//     if (!device) {
//         return false;
//     }
//     if (!device.serviceUUIDs) {
//         return false;
//     }
//     if (device?.serviceUUIDs?.includes(BLUETOOTH.ARANET4_SENSOR_SERVICE_UUID)) {
//         return true;
//     }
//     console.warn("Device has service UUIDs but not the one we want??");
//     return false;
// }

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
    let lastOperation = null;
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
            console.warn(`connectedDevice === false, connection may have failed?`)
            return false;
        }
    
        console.log("Discovering services and characteristics...");
        lastOperation = 'discovering';
        const deviceWithServicesAndCharacteristics = await connectedDevice.discoverAllServicesAndCharacteristics();
        
        console.log("Connected to aranet4, services discovered!");
    
        const services = await deviceWithServicesAndCharacteristics.services();
        const hasServiceSanityCheck = checkContainsAranet4Service(services);
        if (!hasServiceSanityCheck) {
            console.warn("Missing aranet4 service?");
        }
    
        lastOperation = 'reading generic information';
        const genericInfo = await readGenericBluetoothInformation(deviceID);
        // const aranet4Info = await readAranet4SpecificInformation(deviceID, dispatch);
        
        lastOperation = 'reading co2 characteristic';
        const co2CharacteristicValue = await readAranet4Co2Characteristic(deviceID);
        
        
        lastOperation = 'reading seconds since last measurement'
        const secondsSinceLastMeasurement = await readAranet4SecondsSinceLastMeasurementCharacteristic(deviceID)
        const now = Date.now();
        const seconds = secondsSinceLastMeasurement * 1000;
        const lastMeasurementTimeAsUTC = (new Date(now - seconds));
        logDeviceNameSerialAndCO2(genericInfo, co2CharacteristicValue, lastMeasurementTimeAsUTC);
        // console.log(`Last measurement taken: ${lastMeasurementTimeAsUTC.toUTCString()} (UTC)`);
    
    
        lastOperation = 'reading measurement interval';
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
        const filtered = headlessFilterBleReadError(error, deviceID, lastOperation);
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
const headlessWithRetryWrapperForegroundScanConnectRead = async (deviceID: string, supportedDevices: UserInfoDevice[]): Promise<Aranet4GenericAndSpecificInformation | null> => {
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
    const updated = await headlessWithRetryWrapperForegroundScanConnectRead(deviceID, supportedDevices);
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

    /**
        https://github.com/dotintent/MultiPlatformBleAdapter/blob/4c959b56eff9b4e63492da0cbb41f0f9900f790a/android/library/src/main/java/com/polidea/multiplatformbleadapter/BleModule.java#L1411
        
        https://github.com/dariuszseweryn/RxAndroidBle/blob/90d729e9dae97195b842331fb048514b916d862c/rxandroidble/src/main/java/com/polidea/rxandroidble2/RxBleConnection.java#L251

        https://github.com/dariuszseweryn/RxAndroidBle/blob/f7f64d77784a8ae6cd7dfa44a332815fbf67d60f/rxandroidble/src/main/java/com/polidea/rxandroidble2/internal/connection/RxBleConnectionImpl.java#L133

        https://github.com/dariuszseweryn/RxAndroidBle/blob/f7f64d77784a8ae6cd7dfa44a332815fbf67d60f/rxandroidble/src/main/java/com/polidea/rxandroidble2/internal/connection/ServiceDiscoveryManager.java#L32

        https://github.com/dariuszseweryn/RxAndroidBle/blob/10c3bb7164579ff5b3f4d2a965dbf24f05774abc/rxandroidble/src/main/java/com/polidea/rxandroidble2/internal/operations/ServiceDiscoveryOperation.java#L39

        https://github.com/dariuszseweryn/RxAndroidBle/blob/10c3bb7164579ff5b3f4d2a965dbf24f05774abc/rxandroidble/src/main/java/com/polidea/rxandroidble2/internal/SingleResponseOperation.java#L61

        https://github.com/dariuszseweryn/RxAndroidBle/blob/10c3bb7164579ff5b3f4d2a965dbf24f05774abc/rxandroidble/src/main/java/com/polidea/rxandroidble2/internal/operations/ServiceDiscoveryOperation.java#L45

        https://developer.android.com/reference/android/bluetooth/BluetoothGatt#discoverServices()

        https://android.googlesource.com/platform/frameworks/base/+/9908112fd085d8b0d91e0562d32eebd1884f09a5/core/java/android/bluetooth/BluetoothGatt.java#818
        https://android.googlesource.com/platform/packages/apps/Bluetooth/+/7c405bac41fc4ebb5c9cc7b5c896b023f7b1e9fc/src/com/android/bluetooth/gatt/GattService.java#1369


        https://android.googlesource.com/platform/packages/apps/Bluetooth/+/android-4.4.2_r2/jni/com_android_bluetooth_gatt.cpp#806
        https://android.googlesource.com/platform/packages/apps/Bluetooth/+/master/jni/com_android_bluetooth_gatt.cpp#1265
        https://android.googlesource.com/platform/packages/apps/Bluetooth/+/master/jni/com_android_bluetooth_gatt.cpp#1272
        https://android.googlesource.com/platform/hardware/libhardware/+/android-4.4.4_r1/include/hardware/bt_gatt_client.h#210
        https://android.googlesource.com/platform/hardware/libhardware/+/kitkat-release/include/hardware/bt_gatt.h#53
        https://source.android.com/reference/hal/structbtgatt__client__interface__t

        interesting:

        https://github.com/Emill/android_bluetooth/blob/master/service/low_energy_client.cpp


        Maybe original impl?:
        https://android.googlesource.com/platform/frameworks/base.git/+/365522a828f529593aa87e4d5a22f0cf2460c45a/core/jni/android_server_BluetoothService.cpp#923
     */
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

function headlessFilterBleReadError(error: unknown, deviceID: string | null, lastOperation: string | null): BleErrorInfo {
    console.log(`Filtering headless error for device: (${deviceID}), last attempted operation: ${lastOperation}`);
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
                message: `Device ${deviceID} already connected!`,
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
        // https://github.com/dotintent/MultiPlatformBleAdapter/blob/master/android/library/src/main/java/com/polidea/multiplatformbleadapter/errors/BleErrorCode.java

        if (error.errorCode === BleErrorCode.OperationCancelled) {
            dispatch(setDeviceStatusString('Bluetooth read was cancelled for some reason. Might try again.'));
            return false;
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
            const errStr = "Your device didn't even have enough memory to process the error message! There's something wrong, I will NOT try again. I didn't expect to see this problem, ever!";
            dispatch(setDeviceStatusString(errStr));
            console.error(errStr);
            debugger;
            return false;
        }
        //NoResources === 0x80
        if (error.androidErrorCode === BleAndroidErrorCode.NoResources) {
            dispatch(setDeviceStatusString("Your device is out of memory, no point in trying again!"));
            return false;
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
        // if (error.errorCode === BleErrorCode.OperationStartFailed) {
        // https://github.com/dotintent/MultiPlatformBleAdapter/blob/4c959b56eff9b4e63492da0cbb41f0f9900f790a/android/library/src/main/java/com/polidea/multiplatformbleadapter/errors/ErrorConverter.java#L105
        //     console.warn(`Error code 4/BleErrorCode.OperationStartFailed - Bluetooth module says "Native module couldn't start operation due to internal state, which doesn't allow to do that"`);
        //     dispatch(setDeviceStatusString(`react-native-ble-plx reports BleErrorCode.OperationStartFailed!`));
        //     return false;
        // }
        const unexpectedStr = `Unexpected bluetooth error while reading from device: ${bleErrorToUsefulString(error)}`;
        console.error(unexpectedStr);
        dispatch(setDeviceStatusString(unexpectedStr));
        Sentry.Native.captureMessage(unexpectedStr);
        debugger;
        throw error;
    }
    const unexpectedStr = `Unexpected error while reading from device: ${String(error)}`;
    dispatch(setDeviceStatusString(unexpectedStr));
    Sentry.Native.captureMessage(unexpectedStr);
    // debugger;
    throw error;
}

async function forceEnableBluetooth(dispatch: AppDispatch) {
    console.log('force enable bluetooth?');
    const bluetothState = await manager.state();
    if (bluetothState === State.PoweredOff) {
        console.warn('was powered off?');
        dispatch(setScanningStatusString(`Bluetooth powered off, turning on...`));
        await manager.enable();
        dispatch(setScanningStatusString(`Bluetooth turned on!`));
        dispatch(setScanningErrorStatusString(null));
    }
    else {
        const statusStr = `Bluetooth manager status: ${bluetothState}`;
        dispatch(setScanningStatusString(statusStr));
        console.log(statusStr);
    }
}

interface Aranet4GenericAndSpecificInformation {
    specificInfo: Aranet4SpecificInformation,
    genericInfo: GenericBluetoothInformation
}

async function updateCallback(deviceID: string, dispatch: AppDispatch): Promise<Aranet4GenericAndSpecificInformation | undefined> {
    // console.log("update co2 triggered!");
    const updateStr = `Updating CO2 over bluetooth ${deviceID}...`;
    dispatch(setDeviceStatusString(updateStr));
    console.log(updateStr);
    
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
            console.error(`UNHANDLED ble read error: ${String(error)}, device: ${deviceID}`);
            // debugger;
            return;
        }
        console.log(`Error '${error}' filtered.`);
    }
}

async function pollAranet4(setTimeoutHandle: React.Dispatch<React.SetStateAction<NodeJS.Timeout | null>>, deviceID: string, dispatch: AppDispatch, supportedDevices: UserInfoDevice[] | null, setMeasurement: React.Dispatch<React.SetStateAction<MeasurementDataForUpload | null>>, loggedIn: boolean) {
    console.log("enter pollAranet4...");
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
    if (updated.genericInfo.serialNumberString === null) {
        console.warn("Device serial number string is null?");
    }

    dispatch(setDeviceSerialNumber(updated.genericInfo.serialNumberString));
    dispatch(setDeviceName(updated.genericInfo.deviceNameString));
    setFromAranet4SpecificInfo(dispatch, updated.specificInfo);
    if (updated.specificInfo.co2CharacteristicValue === null) {
        console.error("missing co2");
        return;
    }
    if (supportedDevices === initialUserDevicesState.userSupportedDevices) {
        if (!loggedIn) {
            dispatch(setUploadStatus('Please log in.'));
            return;
        }
        dispatch(setUploadStatus('Still loading user devices, cannot upload measurement to server yet. This should go away in a minute or so.'));
        return;
    }
    else if (supportedDevices === null) {
        dispatch(setUploadStatus("There may have been some kind of error loading known devices? Cannot upload."));
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


function firstBluetoothUpdater(deviceID: string | null, hasBluetooth: boolean | null, knownDeviceBluetooth: boolean | null, firstUpdateDone: boolean, subscribedOSBluetoothState: State | null, setFirstUpdateDone: React.Dispatch<React.SetStateAction<boolean>>, dispatch: AppDispatch) {
    if (deviceID === null) {
        console.log("deviceID === null");
        return;
    }
    if (hasBluetooth === null) {
        console.log("bluetooth status still loading.");
        dispatch(setDeviceStatusString("bluetooth status not known yet."));
        return;
    }
    if (hasBluetooth === false) {
        console.log("!hasBluetooth (before first scan)");
        dispatch(setDeviceStatusString("User has NOT granted bluetooth permissions."));
        return;
    }
    const beginStr = `Beginning first read over bluetooth... device known: ${knownDeviceBluetooth}`;
    dispatch(setDeviceStatusString(beginStr));
    console.log(beginStr);

    if (knownDeviceBluetooth === null) {
        const str = `Not yet sure if device is known on the server... (knownDeviceBluetooth === null)`;
        console.log(`exiting first bluetooth update, will probably re-enter. ${str}`)
        dispatch(setDeviceStatusString(str));
        return;
    }

    if (subscribedOSBluetoothState !== State.PoweredOn) {
        const str = `Bluetooth state is ${subscribedOSBluetoothState}, will not try first update until in 'PoweredOn' state.`;
        console.warn(str);
        dispatch(setDeviceStatusString(str));
        return;
    }



    console.log(`First bluetooth read ${firstUpdateDone}, deviceID ${deviceID}`);
    if (firstUpdateDone) {
        return;
    }
    console.log(`deviceID: ${deviceID}, subscribedOSBluetoothState: ${subscribedOSBluetoothState}, hasBluetooth: ${hasBluetooth}, knownDeviceBluetooth: ${knownDeviceBluetooth}, firstUpdateDone: ${firstUpdateDone}`);
    firstBluetoothUpdate(deviceID, dispatch, subscribedOSBluetoothState).then((info) => {
        if (info === undefined) {
            return;
        }
        if (info.genericInfo.serialNumberString === null) {
            console.warn("device serial number string is null?");
            dispatch(setScanningErrorStatusString("Warning: Null serial number string... this is weird."));
        }
        dispatch(setDeviceSerialNumber(info.genericInfo.serialNumberString));
        dispatch(setDeviceName(info.genericInfo.deviceNameString));
        setFirstUpdateDone(true);
        setFromAranet4SpecificInfo(dispatch, info.specificInfo);
        // dispatch(setScanningStatusString(`First bluetooth update done.`));
        dispatch(setScanningStatusString(null));
        return;
        // setAranet4SpecificInformation(info.specificInfo);
    }).catch((error) => {
        Sentry.Native.captureException(error);
        dispatch(setScanningErrorStatusString(`Unexpected error on first bluetooth update: ${unknownNativeErrorTryFormat(error)}`));
        setFirstUpdateDone(true);
    });
}

export const useBluetoothConnectAndPollAranet = () => {
    const dispatch = useDispatch();

    const hasBluetooth = useSelector(selectHasBluetooth);
    const supportedDevices = useSelector(selectSupportedDevices);
    const [knownDeviceBluetooth, setKnownDeviceBluetooth] = useState(null as (boolean | null));
    
    const needsBluetoothTurnOn = useSelector(selectNeedsBluetoothTurnOn);
    
    const deviceID = useSelector(selectDeviceID);
    const serialNumberString = useSelector(selectDeviceSerialNumberString);

    const [timeoutHandle, setTimeoutHandle] = useState(null as (null | NodeJS.Timeout));
    const [measurement, setMeasurement] = useState(null as (MeasurementDataForUpload | null));
    
    const measurementInterval = useSelector(selectMeasurementInterval);
    const lastMeasurementTime = useSelector(selectMeasurementTime);

    const backgroundPollingEnabled = useSelector(selectBackgroundPollingEnabled);
    const subscribedOSBluetoothState = useSelector(selectSubscribedOSBluetoothState);
    const [firstUpdateDone, setFirstUpdateDone] = useState(false);

    const {loggedIn} = useIsLoggedIn();

    useEffect(() => {
        console.log("initial request perms")
        requestAllBluetoothPermissions(dispatch, subscribedOSBluetoothState);
    }, []);

    useEffect(() => {
        if (Platform.OS === 'ios') {
            iosBluetoothChecks(dispatch, subscribedOSBluetoothState)
        }
    }, [dispatch, subscribedOSBluetoothState])

    useEffect(() => {
        if (hasBluetooth === false) {
            console.log("!hasBluetooth (before scan)");
            return;
        }
        if (hasBluetooth === null) {
            console.log('waiting for bluetooth state...');
            return;
        }
        if (needsBluetoothTurnOn) {
            console.log("needsBluetoothTurnOn (before scan)");
            return;
        }
        if (subscribedOSBluetoothState !== State.PoweredOn) {
            console.log(`won't scan and identify yet, os bluetooth state is: ${subscribedOSBluetoothState}`);
            return;
        }
        
        console.log(`before first scan: os bluetooth state: ${subscribedOSBluetoothState}`);
        console.log(`before first scan: has bluetooth? ${hasBluetooth}`);
        scanAndIdentify(dispatch);
    }, [hasBluetooth, needsBluetoothTurnOn, dispatch, subscribedOSBluetoothState]);



    useEffect(() => {
        if (supportedDevices === initialUserDevicesState.userSupportedDevices) {
            dispatch(setUploadStatus("Haven't loaded devices from server yet, hang on a sec..."));
        }
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
            if (!loggedIn) {
                dispatch(setUploadStatus("Can't load devices until you're logged in."));
                return;
            }
            dispatch(setUploadStatus("Loading user devices from server..."));
            return;
        }
        console.assert(known === false);
        if (serialNumberString === null) {
            console.log('Serial number string null - No devices detected.');
            if (subscribedOSBluetoothState === State.PoweredOn) {
                dispatch(setUploadStatus(`Null device? Is it within range? Bluetooth is on and working.`));
                return;
            }
            dispatch(setUploadStatus(`Null device? Are you sure bluetooth is working and within range?`));
            return;
        }
        console.log(`Device ${serialNumberString} is NOT known to bluetooth hook!`);
        dispatch(setUploadStatus(`Device ${serialNumberString} is NOT a known device. Please add in the web console.`));
    }, [supportedDevices, serialNumberString, dispatch, subscribedOSBluetoothState, loggedIn])

    useEffect(() => {
        firstBluetoothUpdater(deviceID, hasBluetooth, knownDeviceBluetooth, firstUpdateDone, subscribedOSBluetoothState, setFirstUpdateDone, dispatch);
    }, [deviceID, dispatch, hasBluetooth, knownDeviceBluetooth, subscribedOSBluetoothState, firstUpdateDone])


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
        if (!firstUpdateDone) {
            console.log("First update not complete yet...")
            return;
        }
        if (hasBluetooth === null) {
            console.log("Bluetooth not known yet");
            return;
        }
        if (!hasBluetooth) {
            console.log("Bluetooth unavailable, no polling possible.");
        }

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
    }, [deviceID, timeoutHandle, knownDeviceBluetooth, backgroundPollingEnabled, supportedDevices, dispatch, lastMeasurementTime, loggedIn, measurementInterval, firstUpdateDone, hasBluetooth])


    return { measurement };
}

async function firstBluetoothUpdate(deviceID: string, dispatch: AppDispatch, subscribedOSBluetoothState: State | null): Promise<Aranet4GenericAndSpecificInformation | undefined>  {
    try {
        //FIRST and ONLY the first of these.
        // const deviceOrNull = await beginWithDeviceConnection(deviceID, device, dispatch);
        // dispatch(setScanningStatusString(`Beginning of first bluetooth update. Bluetooth state: ${subscribedOSBluetoothState}`));
        console.log(`\n\n-------\nBeginning of first bluetooth update. Bluetooth state: ${subscribedOSBluetoothState}`)

        const connectedDevice = await connectOrAlreadyConnected(deviceID);

        if (connectedDevice === null) {
            dispatch(setScanningErrorStatusString("Connection to aranet4 failed."));
            console.warn("Connection to aranet4 failed.")
            return;
        }
        if (connectedDevice === true) {
            dispatch(setScanningErrorStatusString("Connection to aranet4 failed... Likely will work if tried again"));
            console.warn("Connection to aranet4 failed... Likely will work if tried again");
            return;
        }
        if (connectedDevice === false) {
            console.error("Probable bug.");
            throw new Error("Connection to aranet4 failed: BUG");
        }
        const connectedStr = `Connected to aranet4 ${deviceID}). Discovering services and characteristics...`;
        console.log(`\n\n${connectedStr}`);
        dispatch(setScanningStatusString(connectedStr));
        const deviceWithServicesAndCharacteristics = await connectedDevice.discoverAllServicesAndCharacteristics();

        const connectedDiscoveredStr = "Connected to aranet4, services discovered!";
        dispatch(setScanningStatusString(connectedDiscoveredStr));
        console.log(connectedDiscoveredStr);

        const services = await deviceWithServicesAndCharacteristics.services();
        const hasServiceSanityCheck = checkContainsAranet4Service(services);
        if (!hasServiceSanityCheck) {
            console.warn("Missing aranet4 service?");
        }

        if (bluetoothDebugDumps) {
            await dumpServiceDescriptions(services);
        }

    
        // const characteristics = await deviceWithServicesAndCharacteristics.characteristicsForService(BLUETOOTH.ARANET4_SENSOR_SERVICE_UUID);
        // for (let i = 0; i < characteristics.length; ++i) {
        //     console.log(`characteristics[${i}]: ${characteristics[i].id}`);
        // }


        // const characteristics_unk = await deviceWithServicesAndCharacteristics.characteristicsForService('f0cd1400-95da-4f4b-9ac8-aa55d312af0c')
    
        // for (let i = 0; i < characteristics_unk.length; ++i) {
        //     console.log(`characteristics_unk[${i}]: ${characteristics_unk[i].id}`);
        // }
    

        
        dispatch(setDeviceStatusString('Reading generic bluetooth information...'));
        console.log('Reading generic bluetooth information...');
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
        console.warn(`First bluetooth read exception handler... ${String(error)}`);
        
        if (!filterBleReadError(error, dispatch, deviceID)) {
            console.error(`UNHANDLED ble read error: ${String(error)}, device: ${deviceID}`);
            // debugger;
            return;
        }
        console.log(`Error '${error}' filtered.`);
        console.log(`Repeating call of firstBluetoothUpdate!`);
        return await firstBluetoothUpdate(deviceID, dispatch, subscribedOSBluetoothState);
    }
}

const connectOrAlreadyConnected = async (deviceID: string): Promise<Device | boolean | null> => {
    console.log(`Checking if ${deviceID} is connected first...`);
    const isConnected = await manager.isDeviceConnected(deviceID);
    if (!isConnected) {
        // console.log("NOT connected, connecting...");
        return manager.connectToDevice(deviceID);
    }
    // console.log("connected, checking connection manager for connection...");
    const connectedDevices = await manager.connectedDevices([BLUETOOTH.ARANET4_SENSOR_SERVICE_UUID]);
    if (connectedDevices.length === 0) {
        console.log(`Manager reports ZERO connected devices. Connection maybe lost in the short time since connected? Will retry.`);
        return true;
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


// async function attemptConnectScannedDevice(scannedDevice: DeviceId, device: Device | null): Promise<Device | null> {
//     // console.log(`Attempting connection to ${scannedDevice}`);
//     if (device !== null) {
//         const isAlreadyConnected = await device.isConnected();
//         if (isAlreadyConnected) {
//             console.log('ALREADY connected, returning extant device object');
//             return device;
//         }
//     }
//     const connectedDevice = await manager.connectToDevice(scannedDevice);
//     // console.log("Connected!");
//     return connectedDevice;
// }


async function foundAranet4(scannedDevice: Device, dispatch: AppDispatch) {
    const status = `Found aranet4! (${scannedDevice.id}) Connecting...`;
    dispatch(setScanningStatusString(status));
    console.log(status);
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

// async function headlessFoundAranet4(scannedDevice: Device) {
//     console.log("Connecting to aranet4...");
//     if (scannedDevice.id) {
//         if (scannedDevice.id === '?') {
//             debugger;
//         }
//     }
//     else {
//         //TODO: bubble error up?
//         console.error("No ID?");
//         debugger;
//     }
//     manager.stopDeviceScan();
// }


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
        console.log(scannedDevice.serviceUUIDs);
        
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
        console.warn("Probably some kind of error - no supported devices were loaded, so can't proceed.");
        return null;
    }
    if (supportedDevices === initialUserDevicesState.userSupportedDevices) {
        console.log("Still loading supported devices... can't say if anything is supported!");
        return null;
    }
    if (supportedDevices.length === 0) {
        console.log("Supported devices array empty, user may not have any or may have not yet loaded.");
        return false;
    }
    if (!serialNumber) {
        if (serialNumber === null) {
            console.log("(checking if supported) Serial number string is null.");
        }
        return false;
    }
    console.log(`Supported devices: ${JSON.stringify(supportedDevices)}`);
    console.log(`Serial number: ${serialNumber}`);

    const isKnown = supportedDevices.find((device) => device.serial === serialNumber);
    // debugger;
    console.log(`is ${serialNumber} known?: ${isKnown}`);
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
    // debugger;
    if (maybeNextSeconds < 60) {
        // debugger;
        return atLeastOneMinuteOrDev(maybeNextSeconds);
    }
    if (__DEV__ && (maybeNextSeconds > 30)) {
        return 32 * 1000;
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
    if (rssi > -70) {
        return "db";
    }
    return `db - weak signal. You may have connection problems!`;
}

const RSSIOrWeakRSSI: React.FC<{rssi: number | null}> = ({rssi}) => {
    return (
        <MaybeIfValueGreaterThan text="rssi: " value={rssi} suffix={dbOrDbAndWeakMessage(rssi)} compareAgainst={-40} />
    );
}

const turnOn = async (ev: NativeSyntheticEvent<NativeTouchEvent>, dispatch: AppDispatch) => {
    console.log(String(ev));
    try {
        const _enabled = await manager.enable();
        dispatch(setNeedsBluetoothTurnOn(false));
        dispatch(setScanningErrorStatusString(null));
        return;
    }
    catch (error) {
        dispatch(setNativeOSBluetoothStateListenerErrors(unknownNativeErrorTryFormat(error)));
        Sentry.Native.captureException(error);
    }
}

const checkBluetoothState = async (setSubscribedBluetoothState: React.Dispatch<React.SetStateAction<State | null>>, setNativeErrors: React.Dispatch<React.SetStateAction<string | null>>) => {
    try {
        const state = await manager.state();
        console.log(`Bluetooth state: ${state}`);
        setSubscribedBluetoothState(state);
    }
    catch (error) {
        setNativeErrors(unknownNativeErrorTryFormat(error));
        Sentry.Native.captureException(error);
    }
}

const bluetoothStateListener = (newState: State, oldState: State | null, dispatch: AppDispatch) => {
    console.log(`Bluetooth state changed! Old state: ${oldState}, new state: ${newState}`)
    dispatch(setSubscribedBluetoothState(newState));
}

export function useOSBluetoothStateListener() {
    // const [subscribedBluetoothState, setSubscribedBluetoothState] = useState(null as (State | null));
    // const [nativeBluetoothStateListenerErrors, setNativeBluetoothStateListenerErrors] = useState(null as (string | null));

    const subscribedOSBluetoothState = useSelector(selectSubscribedOSBluetoothState);
    const dispatch = useDispatch();

    const [listenerSubscription, setListenerSubscription] = useState(null as (ReturnType<typeof manager.onStateChange> | null));

    useEffect(() => {
        const subscription = manager.onStateChange((newState) => bluetoothStateListener(newState, subscribedOSBluetoothState, dispatch), true);
        setListenerSubscription(subscription);

        return () => {
            console.log("Cancelling bluetooth state subscription!");
            listenerSubscription?.remove();
            // setListenerSubscription(null);
        }
    }, [dispatch])

    return {listenerSubscription};

}

// eslint-disable-next-line @typescript-eslint/ban-types
const BluetoothMaybeNeedsTurnOn:React.FC<{}> = () => {
    const dispatch = useDispatch();
    const needsBluetoothTurnOn = useSelector(selectNeedsBluetoothTurnOn);
    const subscribedOSBluetoothState = useSelector(selectSubscribedOSBluetoothState);
    const nativeOSBluetoothStateListenerErrors = useSelector(selectNativeOSBluetoothStateListenerErrors);
    


    if (needsBluetoothTurnOn ) {
        return (
            <>
                <MaybeIfValue text="Native errors turning bluetooth on: " value={nativeOSBluetoothStateListenerErrors}/>
                <MaybeIfValueNot text="Bluetooth state: " value={subscribedOSBluetoothState} compareAgainst={State.PoweredOn}/>
                <Button title="Turn Bluetooth on" onPress={(ev) => {turnOn(ev, dispatch)}}/>
            </>
        );
    }

    return (
        <>
            <MaybeIfValueNot text="Bluetooth state: " value={subscribedOSBluetoothState} compareAgainst={State.PoweredOn}/>
            <MaybeIfValue text="Native errors checking/turning bluetooth on: " value={nativeOSBluetoothStateListenerErrors}/>
        </>
    );

}


// async function openCO2TrackerDevicesPage(setNativeErrors: React.Dispatch<React.SetStateAction<string | null>>) {
//     try {
//         Linking.openURL(COVID_CO2_TRACKER_DEVICES_URL);
//     }
//     catch (exception) {
//         setNativeErrors(`Error opening web console: ${String(exception)}`)
//     }
// }


// eslint-disable-next-line @typescript-eslint/ban-types
export const MaybeNoSupportedBluetoothDevices: React.FC<{}> = () => {
    const supportedDevices = useSelector(selectSupportedDevices);
    const userDeviceSettingsStatus = useSelector(selectUserDeviceSettingsStatus);
    const {loggedIn} = useIsLoggedIn();

    if (supportedDevices === null) {
      return (
        <>
            <Text>There was some kind of error loading supported/known devices from the server.</Text>
            <MaybeIfValue text="Errors: " value={userDeviceSettingsStatus}/>
        </>
      );
    }
    if (supportedDevices === initialUserDevicesState.userSupportedDevices) {
        if (!loggedIn) {
            return (
                <>
                    <Text>You need to log in before you can upload data.</Text>
                </>
            )
        }
        return (
            <>
                <Text>Still loading user device settings...</Text>
            </>
        )
    }
    if (supportedDevices.length === 0) {
      return (
        <>
          <Text>You do not have any devices entered into the database. To upload data, please create a device in the web console.</Text>
          <LinkButton url={COVID_CO2_TRACKER_DEVICES_URL} title="Open web console"/>
          <MaybeIfValue text="Errors: " value={userDeviceSettingsStatus}/>
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
    const userDeviceSettingsStatus = useSelector(selectUserDeviceSettingsStatus);
    
    
    const updateCount = useSelector(selectUpdateCount);
    const backgroundPollingEnabled = useSelector(selectBackgroundPollingEnabled);

    return (
        <>
            <MaybeIfValue text="bluetooth status: " value={bluetoothScanningStatus} />
            <MaybeIfValue text="bluetooth errors: " value={(bluetoothScanningErrorStatus.length > 0) ? bluetoothScanningErrorStatus : null} />
            <MaybeIfValue text="Device status: " value={deviceStatus}/>
            <MaybeIfValue text="User device settings status: " value={userDeviceSettingsStatus}/>
            <Text>Local reads from device this session: {updateCount}</Text>
            <MaybeIfValue text="id: " value={id} />
            <MaybeIfValue text="name: " value={name} />
            
            <RSSIOrWeakRSSI rssi={rssi}/>
            <MaybeIfValue text="Serial number: " value={serialNumber} />
            <MaybeIfValueLessThan text="Battery: " value={deviceBatteryLevel} compareAgainst={50} suffix="%" />
            <MaybeIfValueTrue text="Known user device?: " value={knownDevice} suffix="yes"/>

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
