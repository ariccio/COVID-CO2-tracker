// See updated (more restrictive) licensing restrictions for this subproject! Updated 02/03/2022.

import { StatusBar } from 'expo-status-bar';
import * as WebBrowser from 'expo-web-browser';
import {useEffect, useState} from 'react';
import { StyleSheet, Button } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider, useDispatch, useSelector } from 'react-redux';


import { userRequestOptions } from '../co2_client/src/utils/DefaultRequestOptions';
import { UserInfoDevice } from '../co2_client/src/utils/DeviceInfoTypes';
import {formatErrors, withErrors} from '../co2_client/src/utils/ErrorObject';
import {UserDevicesInfo, userDevicesInfoResponseToStrongType} from '../co2_client/src/utils/UserInfoTypes';
import { selectJWT } from './src/app/globalSlice';
import { store } from './src/app/store';
import {AuthContainer} from './src/features/Auth/Auth';
import { BluetoothData, useBluetoothConnectAranet } from './src/features/bluetooth/Bluetooth';
import { setSupportedDevices, setUNSupportedDevices } from './src/features/userInfo/devicesSlice';
import { selectUserName } from './src/features/userInfo/userInfoSlice';
import { withAuthorizationHeader } from './src/utils/NativeDefaultRequestHelpers';
import {fetchJSONWithChecks} from './src/utils/NativeFetchHelpers';
import { MaybeIfValue } from './src/utils/RenderValues';
import { USER_DEVICES_URL_NATIVE } from './src/utils/UrlPaths';


// import {AppStatsResponse, queryAppStats} from '../co2_client/src/utils/QueryAppStats';


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
  return awaitedResponse.json();
};


const fetchMyDevicesSucessCallback = async (awaitedResponse: Response): Promise<UserDevicesInfo> => {
  const response = awaitedResponse.json();
  return response;
};

const get_my_devices = (jwt: string) => {
  const deviceRequestOptions = initDeviceRequestOptions(jwt);
  const result = fetchJSONWithChecks(USER_DEVICES_URL_NATIVE, deviceRequestOptions, 200, true, fetchMyDevicesFailedCallback, fetchMyDevicesSucessCallback) as Promise<UserDevicesInfo>;
  return result;
};



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
    console.log(`\tDevice ${devices[i].device_id}: ${devices[i].device_manufacturer} ${devices[i].device_model} #${devices[i].serial}`);
  }
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
    console.log("Note to self (TODO): there's really nothing sensitive about the client ID, but I'd like to obfuscate it anyways.");
  }, []);

  useEffect(() => {
    if (userName === '') {
      return;
    }
    if (jwt === null) {
      return;
    }
    if (jwt === '') {
      return;
    }
    console.log("Getting devices");
    get_my_devices(jwt).then((responseUnchecked) => {
      const response = userDevicesInfoResponseToStrongType(responseUnchecked);
      if (response.errors) {
        setUserDeviceErrors(`Getting devices failed! Reasons: ${formatErrors(response.errors)}`);
        return;
      }
      // dumpUserDevicesInfoResponse(response);
      const supportedDevices = response.devices.filter(filterSupportedDevices);
      const unSupportedDevices = response.devices.filter(filterUnsupportedDevices);

      console.log('------');
      console.log("Supported devices:");
      dumpDeviceInfo(supportedDevices);
      // console.log('------');
      // console.log("UNsupported devices:");
      // dumpDeviceInfo(unSupportedDevices);
      dispatch(setSupportedDevices(supportedDevices));
      dispatch(setUNSupportedDevices(unSupportedDevices));
      // debugger;
    }).catch((error) => {
      setUserDeviceErrors(`Getting devices failed! Probably a bad network connection. Error: ${String(error)}`);
      // eslint-disable-next-line no-debugger
      debugger;
      throw error;
    })
  }, [userName, jwt])



  return (
    <SafeAreaProvider style={styles.container}>          
      <BluetoothData device={device}/>
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
