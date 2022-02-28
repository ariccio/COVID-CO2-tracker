/* eslint-disable no-debugger */
// See updated (more restrictive) licensing restrictions for this subproject! Updated 02/03/2022.

import notifee from '@notifee/react-native';
import * as Device from 'expo-device';
import { StatusBar } from 'expo-status-bar';
import * as WebBrowser from 'expo-web-browser';
import {useEffect, useState} from 'react';
import { AppState, StyleSheet, Button } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider, useDispatch, useSelector } from 'react-redux';



import { userRequestOptions } from '../co2_client/src/utils/DefaultRequestOptions';
import { UserInfoDevice } from '../co2_client/src/utils/DeviceInfoTypes';
import {ErrorObjectType, formatErrors, withErrors} from '../co2_client/src/utils/ErrorObject';
// import {} from '../co2_client/src/utils/UserInfoTypes';
import { userSettingsResponseDataAsPlainSettings, userSettingsResponseToStrongType} from '../co2_client/src/utils/QuerySettingsTypes';
import {UserSettings} from '../co2_client/src/utils/UserSettings';
import { incrementSuccessfulUploads, selectBatteryOptimizationEnabled, selectJWT, selectShouldUpload, selectSuccessfulUploads, setShouldUpload } from './src/app/globalSlice';
import { AppDispatch, store } from './src/app/store';
import {AuthContainerWithLogic} from './src/features/Auth/Auth';
import { MeasurementDataForUpload } from './src/features/Measurement/MeasurementTypes';
import { selectUploadStatus, setUploadStatus } from './src/features/Uploading/uploadSlice';
import { UserSettingsMaybeDisplay } from './src/features/UserSettings/UserSettingsDisplay';
import { BluetoothData, isSupportedDevice, useAranet4NextMeasurementTime, useBluetoothConnectAndPollAranet } from './src/features/bluetooth/Bluetooth';
import { NotifeeNotificationHookState, useNotifeeNotifications, NotificationInfo } from './src/features/service/Notification';
import { selectSupportedDevices, setSupportedDevices, setUNSupportedDevices } from './src/features/userInfo/devicesSlice';
import { selectUserName, selectUserSettings, setUserSettings, setUserSettingsErrors } from './src/features/userInfo/userInfoSlice';
import { withAuthorizationHeader } from './src/utils/NativeDefaultRequestHelpers';
import {fetchJSONWithChecks} from './src/utils/NativeFetchHelpers';
import { MaybeIfValue } from './src/utils/RenderValues';
import { USER_DEVICES_URL_NATIVE, USER_SETTINGS_URL_NATIVE } from './src/utils/UrlPaths';
import { isLoggedIn, isNullString, isUndefinedString } from './src/utils/isLoggedIn';
import { selectDeviceSerialNumberString } from './src/features/bluetooth/bluetoothSlice';
import { realtimeUpload } from './src/features/Measurement/MeasurementUpload';


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
  // console.log("Fetching devices suceeded!");
  const response = awaitedResponse.json();
  return userDevicesInfoResponseToStrongType(await response);
};

const get_my_devices = (jwt: string | null, userName?: string | null) => {
  const eitherNull = isNullString(jwt) || isNullString(userName);
  if (eitherNull) {
    // console.log("No JWT or username, not getting devices?");
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

function loadDevices(jwt: string | null, userName: string | null | undefined, setUserDeviceErrors: React.Dispatch<React.SetStateAction<string | null>>, dispatch: AppDispatch) {
  // console.log("Getting devices...");
  get_my_devices(jwt, userName)?.then((devicesResponse) => {
    return handleDevicesResponse(devicesResponse, setUserDeviceErrors, dispatch);
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
    return dispatch(setUserSettings(response));
    // debugger;
  }).catch((error) => {
    dispatch(setUserSettingsErrors(String(error)))
    debugger;
  })

}




const RealtimeMeasurementInfo = (props: {userDeviceErrors: string | null}) => {
  const uploadStatus = useSelector(selectUploadStatus);
  const successfulUploads = useSelector(selectSuccessfulUploads);
  return (
    <>
      <MaybeIfValue text="Device fetch errors: " value={props.userDeviceErrors}/>
      <MaybeIfValue text="Realtime upload status/errors: " value={uploadStatus}/>
      <MaybeIfValue text="Measurments uploaded: " value={successfulUploads} />
      <MaybeIfValue text="Your phone type: " value={Device.modelName}/>    
    </>
  );
}





const UploadingButton = (props: object) => {
  const shouldUpload = useSelector(selectShouldUpload);
  const dispatch = useDispatch();

  const text = (shouldUpload ? "Stop uploading" : "Start uploading"); 

  return (
    <Button title={text} onPress={() => {dispatch(setShouldUpload(!shouldUpload))}}/>
  );
}

const useCheckKnownDevice = (supportedDevices: UserInfoDevice[] | null, serialNumber?: string | null) => {
  const [knownDevice, setKnownDevice] = useState(null as (boolean | null));
  useEffect(() => {
      if (serialNumber === undefined) {
          // console.log("------------------------------NOT setting known device?");
          setKnownDevice(false);
          // return;
      }
      else {
          // console.log("------------------------------setting known device?");
          setKnownDevice(isSupportedDevice(supportedDevices, serialNumber))
      }
  }, [supportedDevices, serialNumber]);

  return {knownDevice};

}


function App() {
  const dispatch = useDispatch();

  // const [shouldUpload, setShouldUpload] = useState(false);
  const [userDeviceErrors, setUserDeviceErrors] = useState(null as (string | null));
  
  
  const userSettings = useSelector(selectUserSettings);
  const jwt = useSelector(selectJWT);
  const userName = useSelector(selectUserName);
  const batteryOptimizationEnabled = useSelector(selectBatteryOptimizationEnabled);
  const supportedDevices = useSelector(selectSupportedDevices);
  const serialNumber = useSelector(selectDeviceSerialNumberString);
  const shouldUpload = useSelector(selectShouldUpload);


  const {nextMeasurementTime} = useAranet4NextMeasurementTime();
  const {knownDevice} = useCheckKnownDevice(supportedDevices, serialNumber);
  const {measurement} = useBluetoothConnectAndPollAranet();
  const notificationState: NotifeeNotificationHookState = useNotifeeNotifications();


  //https://notifee.app/react-native/docs/events#app-open-events
  const [loading, setLoading] = useState(true);

  // Bootstrap sequence function
  async function bootstrap() {
    const initialNotification = await notifee.getInitialNotification();

    if (initialNotification) {
      console.log('Notification caused application to open', initialNotification.notification);
      console.log('Press action used to open the app', initialNotification.pressAction);
      debugger;
    }
  }

  useEffect(() => {
    bootstrap()
      .then(() => setLoading(false))
      .catch(console.error);
  }, []);
  
  useEffect(() => {
    loadDevices(jwt, userName, setUserDeviceErrors, dispatch);
  }, [userName, jwt])

  useEffect(() => {
    loadSettings(jwt, userName, dispatch);
  }, [userName, jwt])


  useEffect(() => {
    measurementChange(measurement, userSettings, jwt, dispatch, shouldUpload);
  }, [measurement, userSettings, jwt, shouldUpload])

  useEffect(() => {
    return () => {
      notifee.cancelAllNotifications();
      notifee.stopForegroundService();
      notifee.cancelTriggerNotifications();
    }
  }, [])

  // console.log(batteryOptimizationEnabled);

  return (
    <SafeAreaProvider style={styles.container}>          
      <BluetoothData knownDevice={knownDevice} nextMeasurement={nextMeasurementTime}/>
      
      <AuthContainerWithLogic/>
      <RealtimeMeasurementInfo userDeviceErrors={userDeviceErrors}/>
      <UserSettingsMaybeDisplay/>
      
      <NotificationInfo notificationState={notificationState} batteryOptimizationEnabled={batteryOptimizationEnabled}/>
      <UploadingButton/>
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
