/* eslint-disable no-debugger */
// See updated (more restrictive) licensing restrictions for this subproject! Updated 02/03/2022.

import notifee, {IOSNotificationSettings, Notification} from '@notifee/react-native';
import * as Device from 'expo-device';
import { StatusBar } from 'expo-status-bar';
import * as WebBrowser from 'expo-web-browser';
import {useEffect, useState} from 'react';
import { AppState, StyleSheet, Button, Linking, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider, useDispatch, useSelector } from 'react-redux';



import { userRequestOptions, postRequestOptions } from '../co2_client/src/utils/DefaultRequestOptions';
import { UserInfoDevice } from '../co2_client/src/utils/DeviceInfoTypes';
import {ErrorObjectType, formatErrors, withErrors} from '../co2_client/src/utils/ErrorObject';
// import {} from '../co2_client/src/utils/UserInfoTypes';
import { userSettingsResponseDataAsPlainSettings, userSettingsResponseToStrongType} from '../co2_client/src/utils/QuerySettingsTypes';
import {UserSettings} from '../co2_client/src/utils/UserSettings';
import { incrementSuccessfulUploads, selectBatteryOptimizationEnabled, selectJWT, selectSuccessfulUploads, setBatteryOptimizationEnabled } from './src/app/globalSlice';
import { AppDispatch, store } from './src/app/store';
import {AuthContainer} from './src/features/Auth/Auth';
import { MeasurementDataForUpload } from './src/features/Measurement/MeasurementTypes';
import { selectUploadStatus, setUploadStatus } from './src/features/Uploading/uploadSlice';
import { UserSettingsMaybeDisplay } from './src/features/UserSettings/UserSettingsDisplay';
import { BluetoothData, useBluetoothConnectAranet } from './src/features/bluetooth/Bluetooth';
import { selectSupportedDevices, setSupportedDevices, setUNSupportedDevices } from './src/features/userInfo/devicesSlice';
import { selectUserName, selectUserSettings, setUserSettings, setUserSettingsErrors } from './src/features/userInfo/userInfoSlice';
import { withAuthorizationHeader } from './src/utils/NativeDefaultRequestHelpers';
import {fetchJSONWithChecks} from './src/utils/NativeFetchHelpers';
import { MaybeIfValue } from './src/utils/RenderValues';
import { REAL_TIME_UPLOAD_URL_NATIVE, USER_DEVICES_URL_NATIVE, USER_SETTINGS_URL_NATIVE } from './src/utils/UrlPaths';
import { isLoggedIn, isNullString, isUndefinedString } from './src/utils/isLoggedIn';


// import {AppStatsResponse, queryAppStats} from '../co2_client/src/utils/QueryAppStats';

function checkUserInfoDevice(device: UserInfoDevice): void {
  console.assert(device.device_id);
  console.assert(device.serial);
  console.assert(device.device_model);
  console.assert(device.device_model_id);
  console.assert(device.device_manufacturer);
  console.assert(device.device_manufacturer_id);
}


// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function userDevicesInfoResponseToStrongType(responseMaybeUserDevicesInfo: any): UserDevicesInfo {
  console.assert(responseMaybeUserDevicesInfo !== undefined);
  if (responseMaybeUserDevicesInfo.errors !== undefined) {
      console.warn("Found errors, not checking any type correctness.");
      return responseMaybeUserDevicesInfo;
  }
  console.assert(responseMaybeUserDevicesInfo.devices !== undefined);
  console.assert(responseMaybeUserDevicesInfo.devices.length !== undefined);
  if (responseMaybeUserDevicesInfo.devices.length > 0) {
      for (let i = 0; i < responseMaybeUserDevicesInfo.devices.length; ++i) {
          const device = responseMaybeUserDevicesInfo.devices[i];
          checkUserInfoDevice(device);
      }   
  }
  return responseMaybeUserDevicesInfo;
}




export interface UserDevicesInfo {
  devices: UserInfoDevice[],
  errors?: ErrorObjectType[]
}



WebBrowser.maybeCompleteAuthSession();


//
//



interface AppStats {
  users: number;
  measurements: number;
  devices: number;
  manufacturers: number;
  models: number;
  places: number;
  sublocations: number;
}

export type AppStatsResponse = AppStats & withErrors;


// const fartipelago = async () => {
//   console.log(`Fetching ${STATS_URL}...`);
//   const fetchFailedCallback = async (awaitedResponse: Response): Promise<never> => {
//     console.warn("querying app stats failed.");
//     throw new Error(formatErrors((await awaitedResponse.clone().json()).errors));
// }

// const fetchSuccessCallback = async (awaitedResponse: Response): Promise<AppStatsResponse> => {
//     return (await awaitedResponse.json() as AppStatsResponse);
// }

// const statsResponse = fetchJSONWithChecks(STATS_URL, userRequestOptions(), 200, false, fetchFailedCallback, fetchSuccessCallback) as Promise<never> | Promise<AppStatsResponse>;
// return statsResponse;



// const genericFetchSuccessCallback = async (awaitedResponse: Response): Promise<any> => {
//   console.log("TODO: strong type.")
//   return awaitedResponse.json();
// };

function defaultNativeUserRequestOptions(jwt: string): RequestInit {
  const defaultOptions = userRequestOptions();
  const options = {
    ...defaultOptions,
    headers: {
      ...withAuthorizationHeader(jwt)
    }
  };
  return options;
}

function initDeviceRequestOptions(jwt: string): RequestInit {
  const defaultOptions = userRequestOptions();
  const options = {
    ...defaultOptions,
    headers: {
      ...withAuthorizationHeader(jwt)
    }
  };
  return options;
}

const fetchMyDevicesFailedCallback = async (awaitedResponse: Response): Promise<UserDevicesInfo> => {
  console.error("Fetching user devices failed!");
  // eslint-disable-next-line no-debugger
  // debugger;
  return userDevicesInfoResponseToStrongType(await awaitedResponse.json());
};


const fetchMyDevicesSucessCallback = async (awaitedResponse: Response): Promise<UserDevicesInfo> => {
  console.log("Fetching devices suceeded!");
  const response = awaitedResponse.json();
  return userDevicesInfoResponseToStrongType(await response);
};

const get_my_devices = (jwt: string | null, userName?: string | null) => {
  const eitherNull = isNullString(jwt) || isNullString(userName);
  if (eitherNull) {
    console.log("No JWT or username, not getting devices?");
    return;
  }
  if (isUndefinedString(userName)) {
    console.log("Loading userName...");
    return;
  }
  const loggedIn = isLoggedIn(jwt, userName);
  if (!loggedIn) {
    console.log("Not logged in, not getting devices?");
    return;
  }
  console.log("Getting devices...");
  const deviceRequestOptions = initDeviceRequestOptions(jwt);
  const result = fetchJSONWithChecks(USER_DEVICES_URL_NATIVE, deviceRequestOptions, 200, true, fetchMyDevicesFailedCallback, fetchMyDevicesSucessCallback) as Promise<UserDevicesInfo>;
  return result;
};



// type UserSettingsResponseType = UserSettingsResponseData & with



const fetchSettingsSuccessCallback = async (awaitedResponse: Response): Promise<UserSettings | null> => {
  const response = await awaitedResponse.json();

  const rawUserSettings = userSettingsResponseToStrongType(response);
  const plainSettings = userSettingsResponseDataAsPlainSettings(rawUserSettings);
  return plainSettings;
}

const fetchSettingsFailureCallback = async (awaitedResponse: Response): Promise<unknown> => {
  const response = awaitedResponse.json();
  return response;
}

const getSettings = (jwt: string | null, userName?: string | null):  Promise<UserSettings | null> | undefined => {
  const eitherNull = isNullString(jwt) || isNullString(userName);
  if (eitherNull) {
    return;
  }
  if (isUndefinedString(userName)) {
    console.log("Loading userName...");
    return;
  }
  const loggedIn = isLoggedIn(jwt, userName);
  if (!loggedIn) {
    return;
  }
  console.log("Getting user settings...");
  const settingsRequestOptions = defaultNativeUserRequestOptions(jwt);
  const result = fetchJSONWithChecks(USER_SETTINGS_URL_NATIVE, settingsRequestOptions, 200, true, fetchSettingsFailureCallback, fetchSettingsSuccessCallback) as Promise<UserSettings | null>;
  return result;
}


function filterSupportedDevices(device: UserInfoDevice): boolean {
  const caseInsensitive = device.device_manufacturer.toLowerCase();
  if (caseInsensitive.includes('aranet')) {
    return true;
  }
  return false;
}

function filterUnsupportedDevices(device: UserInfoDevice): boolean {
  return !(filterSupportedDevices(device));
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function dumpUserDevicesInfoResponse(response: UserDevicesInfo): void {
  console.log(`User devices:`);
  for (let i = 0; i < response.devices.length; i++) {
    console.log(`\tDevice ${response.devices[i].device_id}: ${response.devices[i].device_manufacturer} ${response.devices[i].device_model} #${response.devices[i].serial}`);
  }
}

function dumpDeviceInfo(devices: UserInfoDevice[]): void {
  for (let i = 0; i < devices.length; i++) {
    console.log(`\tSupported device, ID: ${devices[i].device_id}: Model: ${devices[i].device_model} S# '${devices[i].serial}'`);
  }
}

function handleDevicesResponse(devicesResponse: UserDevicesInfo, setUserDeviceErrors: React.Dispatch<React.SetStateAction<string | null>>, dispatch: AppDispatch) {
  if (devicesResponse.errors) {
    setUserDeviceErrors(`Getting devices failed! Reasons: ${formatErrors(devicesResponse.errors)}`);
    return;
  }
  // dumpUserDevicesInfoResponse(response);
  const supportedDevices = devicesResponse.devices.filter(filterSupportedDevices);
  const unSupportedDevices = devicesResponse.devices.filter(filterUnsupportedDevices);

  console.log('------');
  console.log("Supported devices:");
  dumpDeviceInfo(supportedDevices);
  // console.log('------');
  // console.log("UNsupported devices:");
  // dumpDeviceInfo(unSupportedDevices);
  dispatch(setSupportedDevices(supportedDevices));
  dispatch(setUNSupportedDevices(unSupportedDevices));
  // debugger;

}

const COVID_CO2_TRACKER_DEVICES_URL = "https://covid-co2-tracker.herokuapp.com/devices";

function openCO2TrackerDevicesPage() {
  Linking.openURL(COVID_CO2_TRACKER_DEVICES_URL);
}

// eslint-disable-next-line @typescript-eslint/ban-types
const MaybeNoSupportedBluetoothDevices: React.FC<{}> = () => {
  const supportedDevices = useSelector(selectSupportedDevices);
  if (supportedDevices === null) {
    return null;
  }
  if (supportedDevices.length === 0) {
    return (
      <>
        <Text>You do not have any devices entered into the database. To upload data, please create a device in the web console.</Text>
        <Button title="Open web console" onPress={() => openCO2TrackerDevicesPage()}/>
      </>
    )
  }
  return null;
}


function initRealtimeMeasurement(jwt: string, measurement: MeasurementDataForUpload, userSettings: UserSettings): RequestInit {
  const defaultOptions = postRequestOptions();
  const options = {
    ...defaultOptions,
    headers: {
      ...withAuthorizationHeader(jwt),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      measurement: {
        device_id: measurement.device_id,
        co2ppm: measurement.co2ppm,
        google_place_id: userSettings.setting_place_google_place_id,
        sub_location_id: userSettings.realtime_upload_sub_location_id,
        measurementtime: measurement.measurementtime,
        realtime: true
      }
    })
  }
  return options;
}

async function realtimeUpload(jwt: string, measurement: MeasurementDataForUpload, userSettings: UserSettings): Promise<withErrors> {
  const options = initRealtimeMeasurement(jwt, measurement, userSettings);

  const uploadCallback = async (awaitedResponse: Response): Promise<unknown> => {
    const response = awaitedResponse.json();
    return response;
  }
  const result = fetchJSONWithChecks(REAL_TIME_UPLOAD_URL_NATIVE, options, 203, true, uploadCallback, uploadCallback) as Promise<withErrors>;
  return result;
}


function measurementChange(measurement: MeasurementDataForUpload | null, userSettings: UserSettings | null | undefined, jwt: string | null, dispatch: AppDispatch) {
  console.log(`Measurement changed! ${JSON.stringify(measurement)}`);

  // dispatch(addMeasurement())
  if (!userSettings) {
    console.log("No user settings, nothing to upload.");
    return;
  }
  if (!(userSettings.setting_place_google_place_id)) {
    console.log("No place to upload to.");
    return;
  }

  if (!(userSettings.realtime_upload_sub_location_id)) {
    console.log("No sublocation to upload to.");
    return;
  }

  if (jwt === null) {
    console.log("cannot upload, not logged in.");
    return;
  }
  if (measurement === null) {
    console.log("measurement is null?");
    return;
  }
  dispatch(setUploadStatus(`Uploading new measurement (${measurement.co2ppm})...`));
  realtimeUpload(jwt, measurement, userSettings).then((response) => {
    if (response.errors) {
      debugger;
      dispatch(setUploadStatus(`Error uploading measurement: ${formatErrors(response.errors)}`));
      return;
    }
    dispatch(setUploadStatus(`Successful at ${(new Date(Date.now())).toLocaleTimeString()}`));
    dispatch(incrementSuccessfulUploads());
  }).catch((error) => {
    dispatch(setUploadStatus(`Error uploading measurement: ${String(error)}`));
    debugger;
  });
}

function loadDevices(jwt: string | null, userName: string | null | undefined, setUserDeviceErrors: React.Dispatch<React.SetStateAction<string | null>>, dispatch: AppDispatch) {
  // console.log("Getting devices...");
  get_my_devices(jwt, userName)?.then((devicesResponse) => {
    handleDevicesResponse(devicesResponse, setUserDeviceErrors, dispatch);

  }).catch((error) => {
    setUserDeviceErrors(`Getting devices failed! Probably a bad network connection. Error: ${String(error)}`);
    // eslint-disable-next-line no-debugger
    debugger;
    throw error;
  })
}

function loadSettings(jwt: string | null, userName: string | null | undefined, dispatch: AppDispatch) {
  getSettings(jwt, userName)?.then((response) => {
    if (response === null) {
      console.log("user has no settings.");
      dispatch(setUserSettingsErrors('User has not created settings.'));
      return;
    }
    console.log(`Got user settings response: ${JSON.stringify(response)}`);
    dispatch(setUserSettings(response));
    // debugger;
  }).catch((error) => {
    dispatch(setUserSettingsErrors(String(error)))
    debugger;
  })

}


function defaultNotification(channelId: string): Notification {
  const defaultNotificationOptions: Notification = {
    // See: co2_native_client\node_modules\@notifee\react-native\dist\types\Notification.d.ts
    // See: co2_native_client\node_modules\@notifee\react-native\dist\types\NotificationAndroid.d.ts
    title: 'COVID CO2 tracker', // "The notification title which appears above the body text."
    body: 'Main body content of the notification', // "The main body content of a notification."
    android: { // "Android specific notification options. See the [`NotificationAndroid`](/react-native/reference/notificationandroid) interface for more information and default options which are applied to a notification."
      channelId // "Specifies the `AndroidChannel` which the notification will be delivered on."
      // smallIcon: 'name-of-a-small-icon', // optional, defaults to 'ic_launcher'.
    }
  }
  return defaultNotificationOptions;
}

async function checkedCreateChannel(setNativeErrors: React.Dispatch<React.SetStateAction<string | null>>): Promise<string | null> {
  try {
    return await notifee.createChannel({
      id: 'default',
      name: 'Default Channel',
    });
  }
  catch (exception) {
    //Probably native error.
    setNativeErrors(`Error in createChannel: '${String(exception)}'`);
    debugger;
    return null;
  }
}

async function checkedRequestPermission(setNativeErrors: React.Dispatch<React.SetStateAction<string | null>>): Promise<IOSNotificationSettings | null> {
  try {
    return await notifee.requestPermission();
  }
  catch (exception) {
    //Probably native error.
    setNativeErrors(`Error in requestPermission: '${String(exception)}'`);
    debugger;
    return null;
  }
}

//https://notifee.app/react-native/docs/displaying-a-notification
async function onDisplayNotification(setDisplayNotificationErrors: React.Dispatch<React.SetStateAction<string | null>>, setNativeErrors: React.Dispatch<React.SetStateAction<string | null>>) {
  // Create a channel

  //https://github.com/invertase/notifee/blob/7d03bb4eda27b5d4325473cf155852cef42f5909/docs/react-native/docs/debugging.md
  // To quickly view Android logs in the terminal:
  //   adb logcat '*:S' NOTIFEE:D

  const channelId = await checkedCreateChannel(setNativeErrors);
  if (channelId === null) {
    debugger;
    return;
  }
  // Required for iOS
  // See https://notifee.app/react-native/docs/ios/permissions
  await checkedRequestPermission(setNativeErrors);


  const notificationWithChannel = defaultNotification(channelId);
  try {
    // Display a notification

    // See also:
    //   https://github.com/invertase/notifee/blob/7d03bb4eda27b5d4325473cf155852cef42f5909/android/src/main/java/app/notifee/core/NotificationManager.java#L508
    //     AKA Task<Void> displayNotification(NotificationModel notificationModel, Bundle triggerBundle) 
    //   https://github.com/invertase/notifee/blob/7d03bb4eda27b5d4325473cf155852cef42f5909/android/src/main/java/app/notifee/core/NotificationManager.java#L83
      //   AKA Task<NotificationCompat.Builder> notificationBundleToBuilder(NotificationModel notificationModel)
    // debugger;

    // result is ID.
    // From Notification.d.ts: (See: co2_native_client\node_modules\@notifee\react-native\dist\types\Notification.d.ts)
    //   "A unique identifier for your notification."
    //   "Notifications with the same ID will be created as the same instance, allowing you to update a notification which already exists on the device."
    //   "Defaults to a random string if not provided."
    const result = await notifee.displayNotification(notificationWithChannel);
    console.assert(result !== null);
    console.assert(result !== undefined);
    console.assert(typeof result === 'string');
    console.log("Sucessfully displayed notifee notification.");
    setDisplayNotificationErrors(null);
    return result;
  }
  catch (e) {
    console.error(`Error displaying notification! ${String(e)}`);
    if (e instanceof Error) {
      setDisplayNotificationErrors(String(e));
      return;
    }
    // Usually a Native Module exception?
    // See: https://github.com/facebook/react-native/blob/main/ReactAndroid/src/main/java/com/facebook/react/bridge/PromiseImpl.java
    // usually has some fields like
    //   'code' (e.g. "EUNSPECIFIED")
    //   'message' (e.g. "Invalid notification (no valid small icon): Notification(channel=default pri=0 contentView=null vibrate=null sound=null defaults=0x0 flags=0x10 color=0x00000000 vis=PRIVATE)")
    //   'nativeStackAndroid' (e.g. ...giant array...)
    setDisplayNotificationErrors(String(e));
  }
}

const useNotifeeNotifications = () => {
  const [displayNotificationErrors, setDisplayNotificationErrors] = useState(null as (string | null));
  const [nativeErrors, setNativeErrors] = useState(null as (string | null));
  const [notificationID, setNotificationID] = useState(null as (string | null));

  const dispatch = useDispatch();

  const handleClickDisplayNotification = async () => {
    const result = await onDisplayNotification(setDisplayNotificationErrors, setNativeErrors);
    if (result !== undefined) {
      setNotificationID(result);
    }
  }


  useEffect(() => {
    // debugger;
    notifee.isBatteryOptimizationEnabled().then((result) => {
      console.log(`Battery optimization: ${result}`);
      dispatch(setBatteryOptimizationEnabled(result));
    }).catch((exception) => {
      // In theory, the native java code can throw exceptions if something is desperatley wrong...
      setNativeErrors(`Error in isBatteryOptimizationEnabled: '${String(exception)}'`);
    })
  }, [])

  return {handleClickDisplayNotification, displayNotificationErrors, nativeErrors, notificationID}
}

function App() {
  const {device, measurement} = useBluetoothConnectAranet();
  const jwt = useSelector(selectJWT);
  const userName = useSelector(selectUserName);
  const [userDeviceErrors, setUserDeviceErrors] = useState(null as (string | null));
  const uploadStatus = useSelector(selectUploadStatus);
  const dispatch = useDispatch();
  const userSettings = useSelector(selectUserSettings);
  const successfulUploads = useSelector(selectSuccessfulUploads);

  const batteryOptimizationEnabled = useSelector(selectBatteryOptimizationEnabled);

  const {handleClickDisplayNotification, displayNotificationErrors, nativeErrors, notificationID} = useNotifeeNotifications();

  useEffect(() => {
    loadDevices(jwt, userName, setUserDeviceErrors, dispatch);
  }, [userName, jwt])

  useEffect(() => {
    loadSettings(jwt, userName, dispatch);
  }, [userName, jwt])


  useEffect(() => {
    measurementChange(measurement, userSettings, jwt, dispatch);

  }, [measurement])

  // console.log(batteryOptimizationEnabled);

  return (
    <SafeAreaProvider style={styles.container}>          
      <BluetoothData device={device}/>
      <MaybeNoSupportedBluetoothDevices/>
      <AuthContainer/>
      <MaybeIfValue text="Device fetch errors: " value={userDeviceErrors}/>
      <MaybeIfValue text="Realtime upload status/errors: " value={uploadStatus}/>
      <MaybeIfValue text="Measurments uploaded: " value={successfulUploads} />
      <MaybeIfValue text="Your phone type: " value={Device.modelName}/>
      <UserSettingsMaybeDisplay/>
      <Button title="Display notifee Notification" onPress={() => {handleClickDisplayNotification()}} />
      <MaybeIfValue text="Errors from displaying notifications: " value={displayNotificationErrors}/>
      <MaybeIfValue text="Battery optimization enabled: " value={(batteryOptimizationEnabled === null) ? null : String(batteryOptimizationEnabled)}/>
      <MaybeIfValue text="Notifee native errors (what?): " value={nativeErrors}/>
      <MaybeIfValue text="Notification ID: " value={notificationID}/>
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}

export default function AppContainer() {

  return (
    <Provider store={store}>
      <App/>
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
