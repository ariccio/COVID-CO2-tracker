// See updated (more restrictive) licensing restrictions for this subproject! Updated 02/03/2022.

import { AuthSessionResult } from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import * as SecureStore from 'expo-secure-store';
import {useEffect, useState} from 'react';
import { Button } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';


import { postRequestOptions } from '../../../../co2_client/src/utils/DefaultRequestOptions';
import {formatErrors, withErrors} from '../../../../co2_client/src/utils/ErrorObject';
// import {LOGIN_URL} from '../../../../co2_client/src/utils/UrlPath';
import { selectJWT, setJWT } from '../../app/globalSlice';
import { AppDispatch } from '../../app/store';
// import { withAuthorizationHeader } from '../../utils/NativeDefaultRequestHelpers';
import {fetchJSONWithChecks} from '../../utils/NativeFetchHelpers';
import { MaybeIfValue } from '../../utils/RenderValues';
import {LOGIN_URL_NATIVE} from '../../utils/UrlPaths';
import { selectUserName, setUserName } from '../userInfo/userInfoSlice';



interface NativeLoginResponse {
    email: string;
    jwt: string;
  }
  
  export type NativeLoginResponseType = NativeLoginResponse & withErrors;
  
  function rawNativeLoginResponseToStrongType(response: unknown): NativeLoginResponseType {
    if (response === undefined) {
      throw new Error("login response is UNDEFINED?");
    }
    if (response === null) {
      throw new Error("login response is NULL?");
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const responseExists = response as any;
    if (responseExists.errors) {
      console.warn("Found errors in login response. No typechecking.");
      return responseExists;
    }
    if (responseExists.email === null) {
      throw new Error("Null email field");
    }
    if (responseExists.email === undefined) {
      throw new Error("Email field not present!");
    }
    if (responseExists.email.length === 0) {
      console.warn("Email is empty?");
    }
    if (responseExists.jwt === null) {
      throw new Error("Null jwt.");
    }
    if (responseExists.jwt === undefined) {
      throw new Error("jwt not present!");
    }
    if (responseExists.jwt.length === 0) {
      throw new Error("jwt empty!");
    }
    return responseExists;
  }
  


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
  
  const fetchLoginFailedCallback = async (awaitedResponse: Response): Promise<NativeLoginResponseType> => {
    console.error("login to server with google failed");
    // eslint-disable-next-line no-debugger
    debugger;
    const parsed = await awaitedResponse.json();
    return rawNativeLoginResponseToStrongType(parsed);
  };
  
const fetchLoginSuccessCallback = async (awaitedResponse: Response): Promise<NativeLoginResponseType> => {
    const parsed = await awaitedResponse.json();
    return rawNativeLoginResponseToStrongType(parsed);
  }
  
const CO2_TRACKER_JWT_KEY_NAME = 'riccio-co2-tracker-jwt';

async function saveJWTToAsyncStore(jwt: string, setAsyncStoreError: React.Dispatch<React.SetStateAction<string | null>>): Promise<void> {
  console.log(`Saving JWT (${jwt}) to secure storage...`);
  try {
    return await SecureStore.setItemAsync(CO2_TRACKER_JWT_KEY_NAME, jwt);  
  }
  catch (error) {
    console.error(error);
    setAsyncStoreError(`Error saving login info from secure local storage: '${String(error)}' ...you will need to login again manually!`);
    // eslint-disable-next-line no-debugger
    debugger;
  }
}


const loginWithIDToken = (id_token: string, setAsyncStoreError: React.Dispatch<React.SetStateAction<string | null>>, dispatch: AppDispatch, setLoginErrors: React.Dispatch<React.SetStateAction<string | null>>) => {
    const options = nativeLoginRequestInit(id_token);
    console.log("logging in to server!")
    // const url = (API_URL + '/google_login_token');
    // debugger;
    const result = fetchJSONWithChecks(LOGIN_URL_NATIVE, options, 200, true, fetchLoginFailedCallback, fetchLoginSuccessCallback) as Promise<NativeLoginResponseType>;
    return result.then((response) => {
      if (response.errors !== undefined) {
        console.error("Login to server FAILED");
        setLoginErrors(formatErrors(response.errors));
        // eslint-disable-next-line no-debugger
        debugger;
        return null;
      }
      console.log("sucessfully logged in to server!");
      dispatch(setUserName(response.email));
      dispatch(setJWT(response.jwt));
      console.assert(response.errors === undefined);
  
      return saveJWTToAsyncStore(response.jwt, setAsyncStoreError);
  
    }).catch((error) => {
        console.error(error);
        // eslint-disable-next-line no-debugger
        debugger;
    })
  };
  


async function queryAsyncStoreForStoredJWT(setAsyncStoreError: React.Dispatch<React.SetStateAction<string | null>>): Promise<string | null> {
    const available = await SecureStore.isAvailableAsync();
    if (!available) {
      // eslint-disable-next-line no-debugger
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
        // return 'fartipelago';
      }
      if (maybeJWT === '') {
        console.warn("JWT in storage is empty?");
        return null;
      } 
      console.log("Got JWT from storage!");
      return maybeJWT;
    }
    catch (error) {
      console.error(error);
      setAsyncStoreError(`Error loading login info from secure local storage: ${String(error)}. You will need to login manually.`);
      // eslint-disable-next-line no-debugger
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
      // eslint-disable-next-line no-debugger
      debugger;
    }
  }
  
  

function setIDTokenIfGoodResponseFromGoogle(setIDToken: React.Dispatch<React.SetStateAction<string | null>>, responseFromGoogle: AuthSessionResult | null) {
    // console.table(response);
    // console.log(promptAsync);
    if (responseFromGoogle === undefined) {
      console.log("response is undefined?");
      // eslint-disable-next-line no-debugger
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
      // eslint-disable-next-line no-debugger
      debugger;
      return;
    }
    if (responseFromGoogle.type === 'success') {
      if (responseFromGoogle.authentication === undefined) {
        console.warn('authentication is undefined?');
        // eslint-disable-next-line no-debugger
        debugger;
        return;
      }
      if (responseFromGoogle.authentication === null) {
        console.warn('authentication is null?');
        // eslint-disable-next-line no-debugger
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
        // eslint-disable-next-line no-debugger
        debugger;
        return;
      }
      if (responseFromGoogle.authentication.idToken === undefined) {
        console.error("id token undefined??!?");
        // eslint-disable-next-line no-debugger
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
          console.log("No JWT from storage.");
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
        console.error("id token is zero-length? What?");
        // eslint-disable-next-line no-debugger
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
  

export function AuthContainer(): JSX.Element {
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
  