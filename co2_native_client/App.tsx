// See updated (more restrictive) licensing restrictions for this subproject! Updated 02/03/2022.

import { AuthSessionResult } from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { StatusBar } from 'expo-status-bar';
import * as WebBrowser from 'expo-web-browser';
import {useEffect, useState} from 'react';
import { StyleSheet, Button } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider, useDispatch, useSelector } from 'react-redux';


import { postRequestOptions, userRequestOptions } from '../co2_client/src/utils/DefaultRequestOptions';
import { UserInfoDevice } from '../co2_client/src/utils/DeviceInfoTypes';
import {formatErrors, withErrors} from '../co2_client/src/utils/ErrorObject';
import {API_URL, LOGIN_URL} from '../co2_client/src/utils/UrlPath';
import {UserDevicesInfo, userDevicesInfoResponseToStrongType} from '../co2_client/src/utils/UserInfoTypes';
import { selectJWT, setJWT } from './src/app/globalSlice';
import { AppDispatch, store } from './src/app/store';
import { BluetoothData, useBluetoothConnectAranet } from './src/features/bluetooth/Bluetooth';
import { setSupportedDevices, setUNSupportedDevices } from './src/features/userInfo/devicesSlice';
import { selectUserName, setUserName } from './src/features/userInfo/userInfoSlice';
import { withAuthorizationHeader } from './src/utils/NativeDefaultRequestHelpers';
import {fetchJSONWithChecks} from './src/utils/NativeFetchHelpers';
import { MaybeIfValue } from './src/utils/RenderValues';

// import {AppStatsResponse, queryAppStats} from '../co2_client/src/utils/QueryAppStats';

const {manifest} = Constants;

WebBrowser.maybeCompleteAuthSession();

//ALSO: https://stackoverflow.com/a/49198103/625687
const BASE_EXPO_URL = `http://${manifest?.debuggerHost?.split(':').shift()}:3000`;

//
//

const LOGIN_URL_NATIVE = (BASE_EXPO_URL + LOGIN_URL);
const USER_DEVICES_URL_NATIVE = (BASE_EXPO_URL + '/api/v1/my_devices');


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

//   return statsResponse;
//   // const rawFetchResponse_ = fetch(stats, requestOptions);
//   // return rawFetchResponse_.then(async (body) => {
//   //   const awaitedResponse = await rawFetchResponse_;
//   //   const asJson = await awaitedResponse.json();
//   //   console.table(asJson);
//   //   return asJson;
//   // });
// };

function nativeLoginRequestInit(id_token: string) {
  const def = postRequestOptions();
  const options = {
    ...def,
    body: JSON.stringify({
      user: {
        id_token,
        needs_jwt_value_for_js: true
      }
    })
  };
  return options;
}

const fetchLoginFailedCallback = async (awaitedResponse: Response): Promise<any> => {
  console.error("login to server with google failed");
  debugger;
  return awaitedResponse.json();
};

const genericFetchSuccessCallback = async (awaitedResponse: Response): Promise<any> => {
  console.log("TODO: strong type.")
  return awaitedResponse.json();
};

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
  console.error("Fetching user devices failed.");
  debugger;
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

const CO2_TRACKER_JWT_KEY_NAME = 'riccio-co2-tracker-jwt';

async function saveJWTToAsyncStore(jwt: string, setAsyncStoreError: React.Dispatch<React.SetStateAction<string | null>>): Promise<void> {
  console.log(`Saving JWT (${jwt}) to secure storage...`);
  try {
    return await SecureStore.setItemAsync(CO2_TRACKER_JWT_KEY_NAME, jwt);  
  }
  catch (error) {
    console.error(error);
    setAsyncStoreError(`Error saving login info from secure local storage: '${String(error)}' ...you will need to login again manually!`);
    debugger;
  }
}

const loginWithIDToken = (id_token: string, setAsyncStoreError: React.Dispatch<React.SetStateAction<string | null>>, dispatch: AppDispatch, setLoginErrors: React.Dispatch<React.SetStateAction<string | null>>) => {
  const options = nativeLoginRequestInit(id_token);
  console.log("logging in to server!")
  // const url = (API_URL + '/google_login_token');
  // debugger;
  const result = fetchJSONWithChecks(LOGIN_URL_NATIVE, options, 200, true, fetchLoginFailedCallback, genericFetchSuccessCallback) as Promise<any>;
  return result.then((response) => {
    if (response.errors !== undefined) {
      console.error("Login to server FAILED");
      setLoginErrors(formatErrors(response.errors));
      debugger;
      return null;
    }
    console.log("sucessfully logged in to server!");
    dispatch(setUserName(response.email));
    // console.log(response);
    if (response.jwt === '') {
      console.error("JWT from server is empty?");
      debugger;
      return;
    }
    if (response.jwt === null) {
      console.error("JWT from server is null?");
      debugger;
      return;
    }
    dispatch(setJWT(response.jwt));
    console.assert(response.errors === undefined);

    return saveJWTToAsyncStore(response.jwt, setAsyncStoreError);

  }).catch((error) => {
      console.error(error);
      debugger;
  })
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



async function queryAsyncStoreForStoredJWT(setAsyncStoreError: React.Dispatch<React.SetStateAction<string | null>>): Promise<string | null> {
  const available = await SecureStore.isAvailableAsync();
  if (!available) {
    debugger;
    setAsyncStoreError("SecureStore NOT available! Should be available on Android AND iOS. You will need to login manually on each start of the app.");
    return null;
  }
  try {
    //Note to self, calls into getValueWithKeyAsync in SecureStoreModule.java, then getItemImpl, then readJSONEncodedItem.
    //Can throw numerous errors, including E_SECURESTORE_JSON_ERROR, E_SECURESTORE_DECODE_ERROR, E_SECURESTORE_IO_ERROR, E_SECURESTORE_DECRYPT_ERROR
    const maybeJWT = await SecureStore.getItemAsync(CO2_TRACKER_JWT_KEY_NAME);
    if (maybeJWT === null) {
      console.log("No JWT in secure storage!");
      return null;
    }
    if (maybeJWT === '') {
      console.warn("JWT in storage is empty?");
      debugger;
      return null;
    } 
    console.log("Got JWT from storage!");
    return maybeJWT;
  }
  catch (error) {
    console.error(error);
    setAsyncStoreError(`Error loading login info from secure local storage: ${String(error)}. You will need to login manually.`);
    debugger;
    return null;
  }
}

async function deleteJWTFromAsyncStore(setAsyncStoreError: React.Dispatch<React.SetStateAction<string | null>>): Promise<void> {
  const valueInStore = await queryAsyncStoreForStoredJWT(setAsyncStoreError);
  if (valueInStore === null) {
    return;
  }
  try {
    await SecureStore.deleteItemAsync(CO2_TRACKER_JWT_KEY_NAME);
  }
  catch (error) {
    console.error(error);
    setAsyncStoreError(`Error clearing login info from secure local storage: ${String(error)}. This is weird. Try clearing app data?`);
    debugger;
  }
}

function setIDTokenIfGoodResponseFromGoogle(setIDToken: React.Dispatch<React.SetStateAction<string | null>>, responseFromGoogle: AuthSessionResult | null) {
  // console.table(response);
  // console.log(promptAsync);
  if (responseFromGoogle === undefined) {
    console.log("response is undefined?");
    debugger;
    return;
  }
  if (responseFromGoogle === null) {
    console.log("response is null. Must not have tried logging in yet.");
    // debugger;
    return;
  }
  if (responseFromGoogle.type === 'error') {
    if (responseFromGoogle.error) {
      console.warn(`Authentication error: ${responseFromGoogle.error}`);
    }
    if (responseFromGoogle.errorCode) {
      console.assert(responseFromGoogle.errorCode.length > 0);
      console.warn(`Authentication error code: ${responseFromGoogle.errorCode}`);
    }
    debugger;
    return;
  }
  if (responseFromGoogle.type === 'success') {
    if (responseFromGoogle.authentication === undefined) {
      console.warn('authentication is undefined?');
      debugger;
      return;
    }
    if (responseFromGoogle.authentication === null) {
      console.warn('authentication is null?');
      debugger;
      return;
    }
    //see also, fields:
    //  expiresIn
    //  refreshToken
    console.log(`expiresIn: ${responseFromGoogle.authentication.expiresIn}`);
    console.log(`refreshToken: ${responseFromGoogle.authentication.refreshToken}`);
    // console.log(`idToken: ${response.authentication.idToken}`);
    if (responseFromGoogle.authentication.idToken === null) {
      console.error("id token null??!?");
      debugger;
      return;
    }
    if (responseFromGoogle.authentication.idToken === undefined) {
      console.error("id token undefined??!?");
      debugger;
      return;
    }
    setIDToken(responseFromGoogle.authentication.idToken);
  }
}

const useGoogleAuthForCO2Tracker = () => {
  const [idToken, setIDToken] = useState(null as (string | null));
  // const [jwt, setJWT] = useState(null as (string | null));
  const [asyncStoreError, setAsyncStoreError] = useState(null as (string | null));
  const [loginErrors, setLoginErrors] = useState(null as (string | null));
  // const [userName, setUsername] = useState('');

  const dispatch = useDispatch();


  const [promptAsyncReady, setPromptAsyncReady] = useState(false);

  const [request, response, promptAsync] = Google.useAuthRequest({
    // expoClientId: 'GOOGLE_GUID.apps.googleusercontent.com',
    // iosClientId: 'GOOGLE_GUID.apps.googleusercontent.com',
    androidClientId: '460477494607-vslsidjdslivkafohmt992tls0dh6cf5.apps.googleusercontent.com',
    // webClientId: 'GOOGLE_GUID.apps.googleusercontent.com',
  });

  const logout = () => {
    dispatch(setJWT(null));
    deleteJWTFromAsyncStore(setAsyncStoreError);
  };
  useEffect(() => {
    queryAsyncStoreForStoredJWT(setAsyncStoreError).then((maybeJWT) => {
      if (maybeJWT) {
        dispatch(setJWT(maybeJWT));
        console.log("Set JWT from storage!");
      }
      else {
        console.log("No JWT from storage?");
        debugger;
      }
    });
  }, []);

  useEffect(() => {
    // "Be sure to disable the prompt until request is defined."
    const requestSet = (request !== null);
    console.log(`request ready for promptAsync: ${requestSet}`);
    setPromptAsyncReady(requestSet);
  }, [request]);

  useEffect(() => {
    console.table(request);
    setIDTokenIfGoodResponseFromGoogle(setIDToken, response);
  }, [response]);

  useEffect(() => {
    if (idToken === null) {
      console.log("id token is null, nothing to forward to server.");
      return;
    }
    if (idToken.length === 0) {
      console.warn("id token is zero-length? What?");
      debugger;
      return;
    }
    loginWithIDToken(idToken, setAsyncStoreError, dispatch, setLoginErrors);
  }, [idToken]);

  return {promptAsync, promptAsyncReady, asyncStoreError, logout, loginErrors};
};

function disablePromptAsyncButton(jwt: string | null, promptAsyncReady: boolean): boolean {
  if (jwt !== null) {
    return true;
  }
  if (jwt === '') {
    console.warn("Hmm, empty JWT?");
  }
  if (!promptAsyncReady) {
    return true;
  }
  return false;
}

const AuthContainer: React.FC<{}> = () => {
  const jwt = useSelector(selectJWT);
  const userName = useSelector(selectUserName);
  const {promptAsync, promptAsyncReady, asyncStoreError, logout, loginErrors} = useGoogleAuthForCO2Tracker();


  return (
    <>
      <Button disabled={disablePromptAsyncButton(jwt, promptAsyncReady)} title="Login" onPress={() => {promptAsync();}}/>
      <Button disabled={!disablePromptAsyncButton(jwt, promptAsyncReady)} title="Logout" onPress={() => logout()}/>
      <MaybeIfValue text="username: " value={(userName !== '') ? userName : null}/>
      <MaybeIfValue text="Errors with automatic login! Details: " value={asyncStoreError}/>
      <MaybeIfValue text="Login errors: " value={loginErrors}/>
    </>
);
} 

function Main() {
  const {device} = useBluetoothConnectAranet();
  const jwt = useSelector(selectJWT);
  const userName = useSelector(selectUserName);
  
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
      const response = userDevicesInfoResponseToStrongType(responseUnchecked)
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
      debugger;
      throw error;
    })
  }, [userName, jwt])



  return (
    <SafeAreaProvider style={styles.container}>          
      <BluetoothData device={device}/>
      <AuthContainer/>
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}

export default function App() {

  return (
    <Provider store={store}>
      <Main/>
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
