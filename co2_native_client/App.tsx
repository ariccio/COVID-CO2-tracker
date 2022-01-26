import {useEffect, useState} from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, PermissionsAndroid, Button } from 'react-native';


import { Provider, useDispatch, useSelector } from 'react-redux';


import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';

import Constants from 'expo-constants';


import { store } from './src/app/store';

import { BluetoothData, useBluetoothConnectAranet } from './src/features/bluetooth/Bluetooth';

import {fetchJSONWithChecks} from './src/utils/NativeFetchHelpers';
import { postRequestOptions, userRequestOptions } from '../co2_client/src/utils/DefaultRequestOptions';
import {formatErrors, withErrors} from '../co2_client/src/utils/ErrorObject';
import { MaybeIfValue } from './src/utils/RenderValues';
import {API_URL} from '../co2_client/src/utils/UrlPath';

// import {AppStatsResponse, queryAppStats} from '../co2_client/src/utils/QueryAppStats';

const {manifest} = Constants;


WebBrowser.maybeCompleteAuthSession();

//ALSO: https://stackoverflow.com/a/49198103/625687
const BASE_EXPO_URL = `http://${manifest?.debuggerHost?.split(':').shift()}:3000`;

// 
// 

const STATS_URL = BASE_EXPO_URL + '/api/v1/stats/show';
const LOGIN_URL = BASE_EXPO_URL + '/api/v1/auth';
const USER_DEVICES_URL = (BASE_EXPO_URL + '/api/v1/my_devices');

const requestOptions = {
  method: 'get',
  credentials: "include" as RequestCredentials, //for httpOnly cookie
  headers: {
      'Content-Type': 'application/json',
  },
};


interface AppStats {
  users: number,
  measurements: number,
  devices: number,
  manufacturers: number,
  models: number,
  places: number,
  sublocations: number
}

export type AppStatsResponse = AppStats & withErrors;


const fartipelago = async () => {
  console.log(`Fetching ${STATS_URL}...`);
  const fetchFailedCallback = async (awaitedResponse: Response): Promise<never> => {
    console.warn("querying app stats failed.");
    throw new Error(formatErrors((await awaitedResponse.clone().json()).errors));
}

const fetchSuccessCallback = async (awaitedResponse: Response): Promise<AppStatsResponse> => {
    return (await awaitedResponse.json() as AppStatsResponse);
}

const statsResponse = fetchJSONWithChecks(STATS_URL, userRequestOptions(), 200, false, fetchFailedCallback, fetchSuccessCallback) as Promise<never> | Promise<AppStatsResponse>;
return statsResponse;

  return statsResponse;
  // const rawFetchResponse_ = fetch(stats, requestOptions);
  // return rawFetchResponse_.then(async (body) => {
  //   const awaitedResponse = await rawFetchResponse_;
  //   const asJson = await awaitedResponse.json();
  //   console.table(asJson);
  //   return asJson;
  // });
};



const includeCreds: RequestCredentials = "include";

function loginRequestInit(id_token: string) {
    const def = postRequestOptions();
    const options = {
        ...def,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: includeCreds, //for httpOnly cookie
        body: JSON.stringify({
            user: {
                id_token
            }
        })
    };
    return options;
}

const fetchFailedCallback = async (awaitedResponse: Response): Promise<any> => {
    console.error("login to server with google failed");
    debugger;
    return awaitedResponse.json();
}

const fetchSuccessCallback = async (awaitedResponse: Response): Promise<any> => {
    return awaitedResponse.json();
}

const get_my_devices = () => {
  const result = fetchJSONWithChecks(USER_DEVICES_URL, userRequestOptions(), 200, true, fetchFailedCallback, fetchSuccessCallback) as Promise<UserDevicesInfo>;
  return result;

}


const loginWithIDToken = (id_token: string, setUsername: React.Dispatch<React.SetStateAction<string>>) => {
    const options = loginRequestInit(id_token);
    console.log("logging in to server!")
    // const url = (API_URL + '/google_login_token');
    debugger;
    const result = fetchJSONWithChecks(LOGIN_URL, options, 200, true, fetchFailedCallback, fetchSuccessCallback) as Promise<any>;
    return result.then((response) => {
        // console.log(response);
        // console.log("TODO: What the heck do I do with the response here? As long as it's correct, do I even care?");
        // debugger;
        console.log("sucessfully logged in to server!");
        setUsername(response.email);
        return;

    }).catch((error) => {
        console.error(error);
        debugger;
        return;
    })
}


function Main() {
  const {device} = useBluetoothConnectAranet();
  const [idToken, setIDToken] = useState(null as (string | null));
  const [userName, setUsername] = useState('');

  const [request, response, promptAsync] = Google.useAuthRequest({
    // expoClientId: 'GOOGLE_GUID.apps.googleusercontent.com',
    // iosClientId: 'GOOGLE_GUID.apps.googleusercontent.com',
    androidClientId: '460477494607-vslsidjdslivkafohmt992tls0dh6cf5.apps.googleusercontent.com',
    // webClientId: 'GOOGLE_GUID.apps.googleusercontent.com',
  });


  useEffect(() => {
    if (device === null) {
      return;
    }
    console.log("has device! Device object:");
  }, [device]);

  useEffect(() => {
    console.log("Note to self (TODO): there's really nothing sensitive about the client ID, but I'd like to obfuscate it anyways.");
  }, []);

  useEffect(() => {
    if (userName === '') {
      return;
    }
    fartipelago().then((result) => {
      debugger;
    });
  }, [userName]);

  useEffect(() => {
    if (userName === '') {
      return;
    }
    get_my_devices().then((response) => {
      debugger;
    })
  }, [userName])


  useEffect(() => {
    console.table(request);
    console.table(response);
    // console.log(promptAsync);
    if (response === undefined) {
      console.log("response is undefined?");
      debugger;
      return;
    }
    if (response === null) {
      console.log("response is null. Must not have tried logging in yet.");
      // debugger;
      return;
    }
    if (response.type === 'error') {
      if (response.error) {
        console.warn(`Authentication error: ${response.error}`);
      }
      if (response.errorCode) {
        console.assert(response.errorCode.length > 0);
        console.warn(`Authentication error code: ${response.errorCode}`);
      }
      debugger;
      return;
    }
    if (response.type === 'success') {
      if (response.authentication === undefined) {
        console.warn('authentication is undefined?');
        debugger;
        return;
      }
      if (response.authentication === null) {
        console.warn('authentication is null?');
        debugger;
        return;
      }
      //see also, fields:
      //  expiresIn
      //  refreshToken
      console.log(`expiresIn: ${response.authentication.expiresIn}`);
      console.log(`refreshToken: ${response.authentication.refreshToken}`);
      console.log(`idToken: ${response.authentication.idToken}`);
      if (response.authentication.idToken === null) {
        console.error("id token null??!?");
        debugger;
        return;
      }
      if (response.authentication.idToken === undefined) {
        console.error("id token undefined??!?");
        debugger;
        return;
      }
      setIDToken(response.authentication.idToken);
      }
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
    loginWithIDToken(idToken, setUsername);
  }, [idToken])

  return (
    
      <View style={styles.container}>
        
        <BluetoothData device={device}/>
        <Button disabled={!request} title="Login" onPress={() => {promptAsync();}}/>
        <MaybeIfValue text={"username: "} value={(userName !== '') ? userName : null}/>
        <StatusBar style="auto" />
      </View>
  );
}

export default function App() {

  return (
    <Provider store={store}>
      <Main/>
    </Provider>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
