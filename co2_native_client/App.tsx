// See updated (more restrictive) licensing restrictions for this subproject! Updated 02/03/2022.

import { StatusBar } from 'expo-status-bar';
import * as WebBrowser from 'expo-web-browser';
import {useEffect, useState} from 'react';
import { StyleSheet, Button, Linking, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider, useDispatch, useSelector } from 'react-redux';


import { userRequestOptions } from '../co2_client/src/utils/DefaultRequestOptions';
import { UserInfoDevice } from '../co2_client/src/utils/DeviceInfoTypes';
import {ErrorObjectType, formatErrors, withErrors} from '../co2_client/src/utils/ErrorObject';
// import {} from '../co2_client/src/utils/UserInfoTypes';
import { selectJWT } from './src/app/globalSlice';
import { AppDispatch, store } from './src/app/store';
import {AuthContainer} from './src/features/Auth/Auth';
import { BluetoothData, useBluetoothConnectAranet } from './src/features/bluetooth/Bluetooth';
import { selectSupportedDevices, setSupportedDevices, setUNSupportedDevices } from './src/features/userInfo/devicesSlice';
import { selectUserName } from './src/features/userInfo/userInfoSlice';
import { withAuthorizationHeader } from './src/utils/NativeDefaultRequestHelpers';
import {fetchJSONWithChecks} from './src/utils/NativeFetchHelpers';
import { MaybeIfValue } from './src/utils/RenderValues';
import { USER_DEVICES_URL_NATIVE, USER_SETTINGS_URL_NATIVE } from './src/utils/UrlPaths';
import { isLoggedIn, isNullString } from './src/utils/isLoggedIn';


// import {AppStatsResponse, queryAppStats} from '../co2_client/src/utils/QueryAppStats';

function checkUserInfoDevice(device: UserInfoDevice): void {
  console.assert(device.device_id);
  console.assert(device.serial);
  console.assert(device.device_model);
  console.assert(device.device_model_id);
  console.assert(device.device_manufacturer);
  console.assert(device.device_manufacturer_id);
}


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
  const response = awaitedResponse.json();
  return userDevicesInfoResponseToStrongType(await response);
};

const get_my_devices = (jwt: string | null, userName: string | null) => {
  const eitherNull = isNullString(jwt) || isNullString(userName);
  if (eitherNull) {
    return;
  }
  const loggedIn = isLoggedIn(jwt, userName);
  if (!loggedIn) {
    return;
  }
  console.log("Getting devices...");
  const deviceRequestOptions = initDeviceRequestOptions(jwt);
  const result = fetchJSONWithChecks(USER_DEVICES_URL_NATIVE, deviceRequestOptions, 200, true, fetchMyDevicesFailedCallback, fetchMyDevicesSucessCallback) as Promise<UserDevicesInfo>;
  return result;
};

function userSettingsResponseToStrongType(responseMaybeUserSettings: any): Promise<UserSettingsResponseData> {
  if (responseMaybeUserSettings === null) {
    debugger;
    throw new Error("Missing responseMaybeUserSettings!");
  }
  if (responseMaybeUserSettings === undefined) {
    debugger;
    throw new Error("Missing responseMaybeUserSettings!");
  }
  if (responseMaybeUserSettings.data === null) {
    debugger;
    throw new Error("Missing responseMaybeUserSettings.data!");
  }
  if (responseMaybeUserSettings.data === undefined) {
    debugger;
    throw new Error("Missing responseMaybeUserSettings.data!");
  }
  if (responseMaybeUserSettings.data.id === null) {
    debugger;
    throw new Error("Missing responseMaybeUserSettings.data.id!");
  }
  if (responseMaybeUserSettings.data.id === undefined) {
    debugger;
    throw new Error("Missing responseMaybeUserSettings.data.id!");
  }

  if (responseMaybeUserSettings.data.attributes === null) {
    debugger;
    throw new Error("Missing responseMaybeUserSettings.data.attributes!");
  }

  if (responseMaybeUserSettings.data.attributes === undefined) {
    debugger;
    throw new Error("Missing responseMaybeUserSettings.data.attributes!");
  }

  if (responseMaybeUserSettings.data.attributes.realtime_upload_place === null) {
    debugger;
    throw new Error("Missing responseMaybeUserSettings.data.attributes.realtime_upload_place!");
  }
  if (responseMaybeUserSettings.data.attributes.realtime_upload_place === undefined) {
    debugger;
    throw new Error("Missing responseMaybeUserSettings.data.attributes.realtime_upload_place!");
  }
  if (responseMaybeUserSettings.data.attributes.realtime_upload_place.google_place_id === null) {
    debugger;
    throw new Error("Missing responseMaybeUserSettings.data.attributes.realtime_upload_place.google_place_id!");
  }
  if (responseMaybeUserSettings.data.attributes.realtime_upload_place.google_place_id === undefined) {
    debugger;
    throw new Error("Missing responseMaybeUserSettings.data.attributes.realtime_upload_place.google_place_id!");
  }
  if (responseMaybeUserSettings.data.attributes.realtime_upload_sub_location === null) {
    debugger;
    throw new Error("Missing responseMaybeUserSettings.data.attributes.realtime_upload_sub_location!");
  }
  if (responseMaybeUserSettings.data.attributes.realtime_upload_sub_location === undefined) {
    debugger;
    throw new Error("Missing responseMaybeUserSettings.data.attributes.realtime_upload_sub_location!");
  }
  if (responseMaybeUserSettings.data.attributes.realtime_upload_sub_location.id === null) {
    debugger;
    throw new Error("Missing responseMaybeUserSettings.data.attributes.id!");
  }
  if (responseMaybeUserSettings.data.attributes.realtime_upload_sub_location.id === undefined) {
    debugger;
    throw new Error("Missing responseMaybeUserSettings.data.attributes.id!");
  }
  if (responseMaybeUserSettings.data.attributes.realtime_upload_sub_location.description === null) {
    debugger;
    throw new Error("Missing responseMaybeUserSettings.data.attributes.id!");
  }
  if (responseMaybeUserSettings.data.attributes.realtime_upload_sub_location.description === undefined) {
    debugger;
    throw new Error("Missing responseMaybeUserSettings.data.attributes.id!");
  }
  return responseMaybeUserSettings;
 }

export interface UserSettingsResponseData {
  data: {
    id: number,
    // type: string,
    attributes: {
      realtime_upload_place: {
        google_place_id: string,
        id: number
        // ...
        created_at: unknown,
        last_fetched: unknown,
        updated_at: unknown,
        place_lat: number,
        place_lng: number
      },
      realtime_upload_sub_location: {
        id: number,
        description: string,
        // ...
        place_id: number,
        created_at: unknown,
        updated_at: unknown
      }
    }
  }
};



// type UserSettingsResponseType = UserSettingsResponseData & with



const fetchSettingsSuccessCallback = async (awaitedResponse: Response): Promise<unknown> => {
  const response = await awaitedResponse.json();

  /*
{:data=>
  {:id=>"6",
   :type=>:user_setting,
   :attributes=>
    {:realtime_upload_place=>
      #<Place:0x000000000dc7a828
       id: 22,
       google_place_id: "ChIJAbAvU8dYwokRwAvBDqWmDMo",
       last_fetched: Tue, 25 Jan 2022 22:25:15.667697000 UTC +00:00,
       created_at: Thu, 11 Mar 2021 02:41:38.899104000 UTC +00:00,
       updated_at: Tue, 25 Jan 2022 22:25:15.669135000 UTC +00:00,
       place_lat: 0.40770339e2,
       place_lng: -0.73953588e2>,
     :realtime_upload_sub_location=>
      #<SubLocation:0x000000000f6a5f40
       id: 18,
       description: "None",
       place_id: 22,
       created_at: Sun, 28 Mar 2021 00:41:23.623733000 UTC +00:00,
       updated_at: Sun, 28 Mar 2021 02:14:01.550823000 UTC +00:00>}}}


data:
  attributes:
    realtime_upload_place:
      created_at: "2021-03-11T02:41:38.899Z"
      google_place_id: "ChIJAbAvU8dYwokRwAvBDqWmDMo"
      id: 22
      last_fetched: "2022-01-25T22:25:15.667Z"
      place_lat: "40.770339"
      place_lng: "-73.953588"
      updated_at: "2022-01-25T22:25:15.669Z"
    realtime_upload_sub_location:
      created_at: "2021-03-28T00:41:23.623Z"
      description: "None"
      id: 18
      place_id: 22
      updated_at: "2021-03-28T02:14:01.550Z"
  id: "6"
  type: "user_setting"

  */
  return userSettingsResponseToStrongType(response);
}

const fetchSettingsFailureCallback = async (awaitedResponse: Response): Promise<unknown> => {
  const response = awaitedResponse.json();
  return response;
}

const getSettings = (jwt: string | null, userName: string | null) => {
  const eitherNull = isNullString(jwt) || isNullString(userName);
  if (eitherNull) {
    return;
  }
  const loggedIn = isLoggedIn(jwt, userName);
  if (!loggedIn) {
    return;
  }
  console.log("Getting user settings...");
  const settingsRequestOptions = defaultNativeUserRequestOptions(jwt);
  const result = fetchJSONWithChecks(USER_SETTINGS_URL_NATIVE, settingsRequestOptions, 200, true, fetchSettingsFailureCallback, fetchSettingsSuccessCallback);
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

function App() {
  const {device} = useBluetoothConnectAranet();
  const jwt = useSelector(selectJWT);
  const userName = useSelector(selectUserName);
  const [userDeviceErrors, setUserDeviceErrors] = useState(null as (string | null));
  
  const dispatch = useDispatch();

  // useEffect(() => {
  //   if (device === null) {
  //     return;
  //   }
  //   console.log("has device! Device object:");
  // }, [device]);

  useEffect(() => {
    console.log("NOTE TO SELF: if no fetch requests are going through to local machine in dev, make sure running rails as 'rails s -b 0.0.0.0 to allow all through!");
    console.log("Note to self (TODO): there's really nothing sensitive about the client ID, but I'd like to obfuscate it anyways.");
  }, []);

  useEffect(() => {
    get_my_devices(jwt, userName)?.then((devicesResponse) => {
      handleDevicesResponse(devicesResponse, setUserDeviceErrors, dispatch);

    }).catch((error) => {
      setUserDeviceErrors(`Getting devices failed! Probably a bad network connection. Error: ${String(error)}`);
      // eslint-disable-next-line no-debugger
      debugger;
      throw error;
    })
  }, [userName, jwt])

  useEffect(() => {
    getSettings(jwt, userName)?.then((response) => {
      console.log(`Got user settings response: ${JSON.stringify(response)}`);
      debugger;
    }).catch((error) => {
      debugger;
    })
  }, [userName, jwt])



  return (
    <SafeAreaProvider style={styles.container}>          
      <BluetoothData device={device}/>
      <MaybeNoSupportedBluetoothDevices/>
      <AuthContainer/>
      <MaybeIfValue text="Device fetch errors: " value={userDeviceErrors}/>
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
