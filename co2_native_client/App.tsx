/* eslint-disable react/prop-types */
/* eslint-disable no-debugger */
// See updated (more restrictive) licensing restrictions for this subproject! Updated 02/03/2022.

import notifee from '@notifee/react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import {getStatusAsync, BackgroundFetchStatus} from 'expo-background-fetch';
import * as Device from 'expo-device';
import { StatusBar } from 'expo-status-bar';
import * as TaskManager from 'expo-task-manager';
import * as WebBrowser from 'expo-web-browser';
import {useEffect, useState} from 'react';
import { StyleSheet, Button, Text, ViewStyle, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider, useDispatch, useSelector } from 'react-redux';
import * as Sentry from 'sentry-expo';




import { userRequestOptions } from '../co2_client/src/utils/DefaultRequestOptions';
import { UserInfoDevice } from '../co2_client/src/utils/DeviceInfoTypes';
import {ErrorObjectType, formatErrors, withErrors} from '../co2_client/src/utils/ErrorObject';
// import {} from '../co2_client/src/utils/UserInfoTypes';
import { userSettingsResponseDataAsPlainSettings, userSettingsResponseToStrongType} from '../co2_client/src/utils/QuerySettingsTypes';
import {UserSettings} from '../co2_client/src/utils/UserSettings';
import { incrementSuccessfulUploads, selectBatteryOptimizationEnabled, selectFailedUploads, selectJWT, selectNextMeasurementTime, selectShouldUpload, selectSuccessfulUploads, selectUserDeviceErrors, setNextMeasurementTime, setShouldUpload, setUserDeviceErrors } from './src/app/globalSlice';
import { AppDispatch, store } from './src/app/store';
import {AuthContainer, useGoogleAuthForCO2Tracker} from './src/features/Auth/Auth';
// import { selectAuthState, setAuthState } from './src/features/Auth/authSlice';
import { LinkButton } from './src/features/Links/OpenLink';
import { MeasurementDataForUpload } from './src/features/Measurement/MeasurementTypes';
import { realtimeUpload } from './src/features/Measurement/MeasurementUpload';
import { selectUploadStatus, setUploadStatus } from './src/features/Uploading/uploadSlice';
import { UserSettingsMaybeDisplay } from './src/features/UserSettings/UserSettingsDisplay';
import { BluetoothData, isSupportedDevice, useAranet4NextMeasurementTime, useBluetoothConnectAndPollAranet, useOSBluetoothStateListener } from './src/features/bluetooth/Bluetooth';
import { selectDeviceID, selectDeviceSerialNumberString } from './src/features/bluetooth/bluetoothSlice';
import { NotifeeNotificationHookState, useNotifeeNotifications, NotificationInfo, stopUploadingAndPolling, StartOrStopButton, booleanIsBackroundPollingUploadingForButton } from './src/features/service/Notification';
import { selectForegroundServiceNotificationID, selectNotificationState, selectTriggerNotificationID, setNotificationState } from './src/features/service/serviceSlice';
import { initialUserDevicesState, selectSupportedDevices, selectUserDeviceSettingsStatus, setSupportedDevices, setUNSupportedDevices, setUserDeviceSettingsStatus } from './src/features/userInfo/devicesSlice';
import { selectUserName, selectUserSettings, setUserSettings, setUserSettingsErrors } from './src/features/userInfo/userInfoSlice';
import { unknownNativeErrorTryFormat } from './src/utils/FormatUnknownNativeError';
import { withAuthorizationHeader } from './src/utils/NativeDefaultRequestHelpers';
import {fetchJSONWithChecks} from './src/utils/NativeFetchHelpers';
import { MaybeIfValue, MaybeIfValueTrue, MaybeTextIfValueTrue } from './src/utils/RenderValues';
import { timeNowAsString } from './src/utils/TimeNow';
import { COVID_CO2_TRACKER_DEVICES_URL, COVID_CO2_TRACKER_HOME_URL, USER_DEVICES_URL_NATIVE, USER_SETTINGS_URL_NATIVE } from './src/utils/UrlPaths';
import { useIsLoggedIn } from './src/utils/UseLoggedIn';
import { isLoggedIn, isNullString, isUndefinedString } from './src/utils/isLoggedIn';
import { BACKGROUND_FETCH_TASK, registerBackgroundFetchAsync, unregisterBackgroundFetchAsync, useBackgroundTaskToReadBluetoothAranet4 } from './src/features/service/iosBackgroundWork';

// console.log(await notifee.getTriggerNotifications());



Sentry.init({
  dsn: "https://5c72ea76ca204179b35fa8a3eb847ab0@o584271.ingest.sentry.io/5737166",
  enableInExpoDevelopment: false,
  debug: true, // If `true`, Sentry will try to print out useful debugging information if something goes wrong with sending the event. Set it to `false` in production
});

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


const fetchMyDevicesSuccessCallback = async (awaitedResponse: Response): Promise<UserDevicesInfo> => {
  // console.log("Fetching devices suceeded!");
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
    // console.log("Loading userName...");
    return;
  }
  const loggedIn = isLoggedIn(jwt, userName);
  if (!loggedIn) {
    console.log("Not logged in, not getting devices?");
    return;
  }
  // console.log("Getting devices...");
  const deviceRequestOptions = initDeviceRequestOptions(jwt);
  const result = fetchJSONWithChecks(USER_DEVICES_URL_NATIVE, deviceRequestOptions, 200, true, fetchMyDevicesFailedCallback, fetchMyDevicesSuccessCallback) as Promise<UserDevicesInfo>;
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
    // console.log("Loading userName...");
    return;
  }
  const loggedIn = isLoggedIn(jwt, userName);
  if (!loggedIn) {
    return;
  }
  // console.log("Getting user settings...");
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

function handleDevicesResponse(devicesResponse: UserDevicesInfo, dispatch: AppDispatch) {
  if (devicesResponse.errors) {
    const str = `Getting devices failed! Reasons: ${formatErrors(devicesResponse.errors)}`;
    console.warn(str);
    dispatch(setSupportedDevices(null));
    dispatch(setUserDeviceErrors(str));
    dispatch(setUserDeviceSettingsStatus(str));
    Sentry.Native.captureMessage(str);
    return;
  }
  // dumpUserDevicesInfoResponse(response);
  const supportedDevices = devicesResponse.devices.filter(filterSupportedDevices);
  const unSupportedDevices = devicesResponse.devices.filter(filterUnsupportedDevices);

  console.log('------');
  console.log("Got supported devices:");
  dumpDeviceInfo(supportedDevices);
  // console.log('------');
  // console.log("UNsupported devices:");
  // dumpDeviceInfo(unSupportedDevices);
  dispatch(setSupportedDevices(supportedDevices));
  dispatch(setUNSupportedDevices(unSupportedDevices));
  // debugger;

}







function measurementChange(measurement: MeasurementDataForUpload | null, userSettings: UserSettings | null | undefined, jwt: string | null, dispatch: AppDispatch, shouldUpload: boolean) {
  // console.log(`Measurement changed! ${JSON.stringify(measurement)}`);

  // dispatch(addMeasurement())
  if (!userSettings) {
    // console.log("No user settings, nothing to upload.");
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
    // console.log("measurement is null?");
    return;
  }
  if (!shouldUpload) {
    console.log("User has not requested to begin uploading.");
    return;
  }
  dispatch(setUploadStatus(`Uploading new measurement (${measurement.co2ppm})...`));
  realtimeUpload(jwt, measurement, userSettings).then((response) => {
    if (response.errors) {
      debugger;
      return dispatch(setUploadStatus(`Error uploading measurement: ${formatErrors(response.errors)}`));
    }
    dispatch(setUploadStatus(`Successful at ${(new Date(Date.now())).toLocaleTimeString()}`));
    return dispatch(incrementSuccessfulUploads());
  }).catch((error) => {
    dispatch(setUploadStatus(`Error uploading measurement: ${String(error)}`));
    debugger;
  });
}

function loadDevices(jwt: string | null, userName: string | null | undefined, dispatch: AppDispatch) {
  console.log("Getting devices...");
  get_my_devices(jwt, userName)?.then((devicesResponse) => {
    return handleDevicesResponse(devicesResponse, dispatch);
  }).catch((error) => {
    const str = `Getting devices failed! Probably a bad network connection. Error: ${String(error)}`;
    dispatch(setUserDeviceErrors(str));
    dispatch(setUserDeviceSettingsStatus(str));
    console.warn(error);
    Sentry.Native.captureException(error);
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
      dispatch(setUserSettings(null));
      return;
    }
    // console.log(`Got user settings response: ${JSON.stringify(response)}`);
    return dispatch(setUserSettings(response));
    // debugger;
  }).catch((error) => {
    Sentry.Native.captureException(error);
    dispatch(setUserSettingsErrors(String(error)))
    debugger;
  })

}




const RealtimeMeasurementInfo = () => {
  const uploadStatus = useSelector(selectUploadStatus);
  const successfulUploads = useSelector(selectSuccessfulUploads);
  const failedUploads = useSelector(selectFailedUploads);
  const userDeviceErrors = useSelector(selectUserDeviceErrors);
  return (
    <>
      <MaybeIfValue text="Device fetch errors: " value={userDeviceErrors}/>
      <MaybeIfValue text="Realtime upload status/errors: " value={uploadStatus}/>
      <MaybeIfValue text="Measurments uploaded: " value={successfulUploads} />
      <MaybeIfValue text="Failed Measurment uploads: " value={failedUploads} />
      <MaybeIfValue text="Your phone type: " value={Device.modelName}/>    
    </>
  );
}





const UploadingButton = (props: object) => {
  const shouldUpload = useSelector(selectShouldUpload);
  const dispatch = useDispatch();

  const text = (shouldUpload ? "Stop uploading" : "Start uploading from foreground"); 

  return (
    <Button title={text} onPress={() => {dispatch(setShouldUpload(!shouldUpload))}}/>
  );
}

const useCheckKnownDevice = (supportedDevices: UserInfoDevice[] | null, dispatch: AppDispatch, serialNumber?: string | null) => {
  const [knownDevice, setKnownDevice] = useState(null as (boolean | null));
  const {loggedIn} = useIsLoggedIn();
  useEffect(() => {
      if (serialNumber === undefined) {
          // console.log("------------------------------NOT setting known device?");
          setKnownDevice(false);
          // return;
      }
      else {
          console.log("------------------------------setting known device?");
          setKnownDevice(isSupportedDevice(supportedDevices, serialNumber));
          dispatch(setUserDeviceSettingsStatus(null));
      }
      if (supportedDevices === initialUserDevicesState.userSupportedDevices) {
        if (!loggedIn) {
          dispatch(setUserDeviceSettingsStatus('You need to log in before we can load device settings.'));
          return;
        }
        dispatch(setUserDeviceSettingsStatus('Still loading user device settings...'));
      }
  }, [supportedDevices, serialNumber, loggedIn, dispatch]);

  return {knownDevice};

}

function backgroundTaskStatusToString(iOSBackgroundTaskStatus: BackgroundFetchStatus): string {
  if (iOSBackgroundTaskStatus === BackgroundFetchStatus.Available) {
    return '(Available)';
  }
  if (iOSBackgroundTaskStatus === BackgroundFetchStatus.Denied) {
    return '(DENIED!)';
  }
  if (iOSBackgroundTaskStatus === BackgroundFetchStatus.Restricted) {
    return '(restricted - maybe parental controls?)';
  }
  return '(UNKNOWN value)';

}

const BackgroundTaskStatus: React.FC<{iOSBackgroundTaskStatus: BackgroundFetchStatus | null}> = ({iOSBackgroundTaskStatus}) => {
 
  if (iOSBackgroundTaskStatus === null) {
    return null;
  }
  return (
    <>
      <MaybeIfValue text='iosBackgroundTaskStatus: ' value={iOSBackgroundTaskStatus} suffix={backgroundTaskStatusToString(iOSBackgroundTaskStatus)}/>
    </>
  )
}

// Bootstrap sequence function
async function checkInitialNotification() {
  const initialNotification = await notifee.getInitialNotification();

  if (initialNotification) {
    console.log('Notification caused application to open', initialNotification.notification);
    console.log('Press action used to open the app', initialNotification.pressAction);
    debugger;
  }
}

function HomeScreen() {
  const dispatch = useDispatch();
  const nextMeasurementTime = useSelector(selectNextMeasurementTime);
  const supportedDevices = useSelector(selectSupportedDevices);
  const serialNumber = useSelector(selectDeviceSerialNumberString);
  // const authState = useSelector(selectAuthState);  
  const [isIOSBackgroundTaskRegistered, setIsIOSBackgroundTaskRegistered] = useState(null as (boolean | null));
  const [iOSBackgroundTaskStatus, setIOSBackgroundTaskStatus] = useState(null as (BackgroundFetchStatus | null));

  const [nativeErrors, setNativeErrors] = useState(null as (string | null));



  useEffect(() => {
    if (Platform.OS === 'ios') {
      checkStatusAsync(setIsIOSBackgroundTaskRegistered, setIOSBackgroundTaskStatus).then((undefinedOrError) => {
        if (undefinedOrError) {
          setNativeErrors(undefinedOrError);
        }
        return;
      }).catch((maybeError) => {
        setNativeErrors(unknownNativeErrorTryFormat(maybeError));
      });
    }
  }, []);
  
  
  const {knownDevice} = useCheckKnownDevice(supportedDevices, dispatch, serialNumber);
  return (
    <SafeAreaProvider style={styles.container}>
      <BluetoothData knownDevice={knownDevice} nextMeasurement={nextMeasurementTime}/>
      
      <AuthContainer/>
      <RealtimeMeasurementInfo/>
      <UserSettingsMaybeDisplay/>
      
      <NotificationInfo/>
      <MaybeIfValue text='iosBackgroundTaskRegistered.' value={isIOSBackgroundTaskRegistered} />
      <BackgroundTaskStatus iOSBackgroundTaskStatus={iOSBackgroundTaskStatus}/>
      <UploadingButton/>
      <MaybeIfValue text='unexpected native errors: ' value={nativeErrors}/>
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}


function LogInIfNot() {
  const {loggedIn} = useIsLoggedIn();
  if (!loggedIn) {
    return (
      <>
          <Text>First, log in:</Text>
          <AuthContainer/>
      </>
    );
  }
  return null;
}


function useHasSupportedDevices() {
  const supportedDevices = useSelector(selectSupportedDevices);

  const [hasSupportedDevices, setHasSupportedDevices] = useState(null as (boolean| null));

  useEffect(() => {
    if (supportedDevices === null) {
      setHasSupportedDevices(false);
      return;
    }
    if (supportedDevices.length === 0) {
      setHasSupportedDevices(false);
      return;
    }
    if (supportedDevices.length > 0) {
      setHasSupportedDevices(true);
    }
  }, [supportedDevices]);
  return {hasSupportedDevices}
}


function CreateDeviceIfNotYet() {
  const supportedDevices = useSelector(selectSupportedDevices);
  const supportedDeviceSettingStatus = useSelector(selectUserDeviceSettingsStatus);
  const {loggedIn} = useIsLoggedIn();

  if (supportedDevices === null) {
    return (
      <>
        <Text>There was some kind of error loading supported devices. See &quot;Home&quot; for full details.</Text>
        <MaybeIfValue value={supportedDeviceSettingStatus} text="Status/Errors: "/>
      </>
    )
  }
  // console.log(`loggedIn: ${loggedIn}`);


  if (!loggedIn) {
    // debugger;
    return null;
  }

  if (supportedDevices.length > 0) {
    return null;
  }

  if (supportedDevices === initialUserDevicesState.userSupportedDevices) {
    console.log("Probably still loading user device settings?");
    return (
      <>
        <Text>Loading your known devices from the server...</Text>
      </>
    )
  }

  return (
    <>
      <Text>Next, create a device if you haven&apos;t yet:</Text>
      <LinkButton url={COVID_CO2_TRACKER_DEVICES_URL} title="Open web console to create device"/>
    </>
  )
}

function RealtimeUploadSettings() {
  const userSettings = useSelector(selectUserSettings);
  const {loggedIn} = useIsLoggedIn();
  


  if (userSettings === undefined) {
    if (!loggedIn) {
      return null;
    }
    return (
      <>
        <Text>Checking if you have created realtime upload settings...</Text>
      </>
    )
  }
  if (userSettings === null) {
    return (
      <>
        <Text>The last two things you need to do are:</Text>
        <Text>1. Manually create a single measurement in the web console for the location you want to use</Text>
        <Text>2. Expand the dropdown with the name of the address.</Text>
        <Text>3. Click &quot;Choose place for realtime upload&quot;</Text>
        <LinkButton url={COVID_CO2_TRACKER_HOME_URL} title="Open web console"/>
      </>
    );
  }
  return null;
}


function AllSet() {
  const {loggedIn} = useIsLoggedIn();
  const userSettings = useSelector(selectUserSettings);
  const {hasSupportedDevices} = useHasSupportedDevices();
  const navigation = useNavigation();

  if (!loggedIn) {
    return null;
  }
  if (!hasSupportedDevices) {
    return null;
  }
  if (userSettings === null) {
    return null;
  }
  if (userSettings === undefined) {
    return null;
  }

  return (
    <>
      <StartOrStopButton onPressAction={() => {navigation.navigate("Home")}}/>
    </>
  )
}

function MaybeStartText() {
  const notificationState = useSelector(selectNotificationState);
  const {loggedIn} = useIsLoggedIn();
  const foregroundServiceNotificationID = useSelector(selectForegroundServiceNotificationID);
  const triggerNotificationID = useSelector(selectTriggerNotificationID);

  const isBackroundPollingUploadingForButton = booleanIsBackroundPollingUploadingForButton(foregroundServiceNotificationID, notificationState, triggerNotificationID);
  if (!loggedIn) {
    return (
      <>
        <Text>
          You need to login before you can proceed.
        </Text>
      </>
    );
  }
  if (isBackroundPollingUploadingForButton === null) {
    return (
      <>
        <Text>Initializing notification state...</Text>
      </>
    );

  }
  if (isBackroundPollingUploadingForButton === true) {
    return (
      <>
        <Text>If the &quot;stop background polling&quot; button is the only thing you see, you should be all set! You may switch apps.</Text>
      </>
    );
  }
  
  return (
    <>
      <Text>If the &quot;start background polling & uploading&quot; button is the only thing you see, you need to click it to start automatic data sharing.</Text>
    </>
  );

}

const openBatteryOptimizationSettings = () => {notifee.openBatteryOptimizationSettings()}

const MaybeOpenBatteryOptimizationScreen: React.FC<{batteryOptimizationEnabled: boolean | null}> = ({batteryOptimizationEnabled}) => {

  if (batteryOptimizationEnabled === null) {
    return null;
  }

  if (!batteryOptimizationEnabled) {
    return null;
  }
  return (
    <>
      <Button title="Open battery optimization settings" onPress={openBatteryOptimizationSettings}/>
    </>
  )
}

function MaybeBatteryOptimization () {
  const batteryOptimizationEnabled = useSelector(selectBatteryOptimizationEnabled);

  return (
    <>
      <MaybeTextIfValueTrue value={batteryOptimizationEnabled} text="WARNING: Battery optimization is enabled. App may not update in background if &quot;Batter Saver&quot; is enabled."/>
      <MaybeOpenBatteryOptimizationScreen batteryOptimizationEnabled={batteryOptimizationEnabled}/> 
    </>
  )
}

function GetStartedScreen() {
  return (
    <>
      <SafeAreaProvider>
        <MaybeStartText/>
        <LogInIfNot/>
        <CreateDeviceIfNotYet/>
        <RealtimeUploadSettings/>
        <MaybeBatteryOptimization/>
        <AllSet/>

      </SafeAreaProvider>
    </>
  )
}


const Tab = createMaterialTopTabNavigator();

const CONTENT_CONTAINER_STYLE: ViewStyle = {
  borderTopWidth: 9
}

const NAVIGATOR_SCREEN_OPTIONS = {
  tabBarContentContainerStyle: CONTENT_CONTAINER_STYLE
};


const checkStatusAsync = async (setIsIOSBackgroundTaskRegistered: React.Dispatch<React.SetStateAction<boolean | null>>, setIOSBackgroundTaskStatus: React.Dispatch<React.SetStateAction<BackgroundFetchStatus | null>>) => {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_FETCH_TASK);
    setIsIOSBackgroundTaskRegistered(isRegistered);
    const status = await getStatusAsync();
    setIOSBackgroundTaskStatus(status);
  }
  catch (error) {
    // Sentry.Native.captureException(error);
    return `unexpected error: ${unknownNativeErrorTryFormat(error)}`;
  }
};

// const toggleFetchTask = async (isIOSBackgroundTaskRegistered: boolean, setIsIOSBackgroundTaskRegistered: React.Dispatch<React.SetStateAction<boolean>>, setIOSBackgroundTaskStatus: React.Dispatch<React.SetStateAction<BackgroundFetch.BackgroundFetchStatus | null>>) => {
//   if (isIOSBackgroundTaskRegistered) {
//       await unregisterBackgroundFetchAsync();
//   } else {
//       await registerBackgroundFetchAsync();
//   }

//   checkStatusAsync(setIsIOSBackgroundTaskRegistered, setIOSBackgroundTaskStatus);
// };

function App() {
  const dispatch = useDispatch();

  // const [shouldUpload, setShouldUpload] = useState(false);
  // const [userDeviceErrors, setUserDeviceErrors] = useState(null as (string | null));
  
  //https://notifee.app/react-native/docs/events#app-open-events
  const [loading, setLoading] = useState(true);
  
  const userSettings = useSelector(selectUserSettings);
  const jwt = useSelector(selectJWT);
  const userName = useSelector(selectUserName);
  const shouldUpload = useSelector(selectShouldUpload);
  const supportedDevices = useSelector(selectSupportedDevices);
  const deviceID = useSelector(selectDeviceID);


  const {nextMeasurementTime} = useAranet4NextMeasurementTime();
  
  const {measurement} = useBluetoothConnectAndPollAranet();
  const notificationState: NotifeeNotificationHookState = useNotifeeNotifications(supportedDevices, deviceID);
  const authState = useGoogleAuthForCO2Tracker();
  const _unused_bluetoothListener = useOSBluetoothStateListener();
  const unused_void = useBackgroundTaskToReadBluetoothAranet4();



  useEffect( () => {
    console.log('I literally just need to update the binary');
    registerBackgroundFetchAsync();
    return () => {
      console.log("Unregistering background fetch task");
      unregisterBackgroundFetchAsync();
    }
  }, [])

  // useEffect(() => {
  //   dispatch(setAuthState(authState));
  // }, [authState])
  useEffect(() => {
    dispatch(setNotificationState(notificationState));
  }, [notificationState, dispatch])

  useEffect(() => {
    dispatch(setNextMeasurementTime(nextMeasurementTime));
  }, [nextMeasurementTime, dispatch])

  useEffect(() => {
    console.log(`App starting at ${timeNowAsString()}.`);
    // Sentry.Browser.captureMessage("native fartipelago");
  }, [])

  useEffect(() => {
    checkInitialNotification()
      .then(() => setLoading(false))
      .catch((error) => {
        console.error(unknownNativeErrorTryFormat(error));
        Sentry.Native.captureException(error);
      });
  }, []);
  
  useEffect(() => {
    loadDevices(jwt, userName, dispatch);
  }, [userName, jwt, dispatch])

  useEffect(() => {
    loadSettings(jwt, userName, dispatch);
  }, [userName, jwt, dispatch])


  useEffect(() => {
    measurementChange(measurement, userSettings, jwt, dispatch, shouldUpload);
  }, [measurement, userSettings, jwt, shouldUpload, dispatch])

  // useEffect(() => {
  //   return () => {
  //     // console.log("clearn notif service from app destructor");
  //     // stopUploadingAndPolling();
  //   }
  // }, [])

  // console.log(batteryOptimizationEnabled);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Tab.Navigator screenOptions={NAVIGATOR_SCREEN_OPTIONS} >
          <Tab.Screen name="Get started!" component={GetStartedScreen}/>
          <Tab.Screen name="Home" component={HomeScreen}/>
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}


// const Stack = createNativeStackNavigator();
export default function AppContainer() {

  return (
    <Sentry.Native.ErrorBoundary>
      <Provider store={store}>
        <App/>
      </Provider>
    </Sentry.Native.ErrorBoundary>
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
