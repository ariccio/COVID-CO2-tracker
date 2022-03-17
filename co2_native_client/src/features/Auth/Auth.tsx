/* eslint-disable react/prop-types */
// See updated (more restrictive) licensing restrictions for this subproject! Updated 02/03/2022.

import { AuthRequestPromptOptions, AuthSessionResult, AuthSessionRedirectUriOptions } from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import {useEffect, useState} from 'react';
import { Button } from 'react-native';
import AlertAsync from "react-native-alert-async";
import { useDispatch, useSelector } from 'react-redux';
import * as Sentry from 'sentry-expo';

import { postRequestOptions, userRequestOptions } from '../../../../co2_client/src/utils/DefaultRequestOptions';
import {formatErrors, withErrors} from '../../../../co2_client/src/utils/ErrorObject';
// import {LOGIN_URL} from '../../../../co2_client/src/utils/UrlPath';
import { selectJWT, setJWT } from '../../app/globalSlice';
import { AppDispatch } from '../../app/store';
import { withAuthorizationHeader } from '../../utils/NativeDefaultRequestHelpers';
// import { withAuthorizationHeader } from '../../utils/NativeDefaultRequestHelpers';
import {fetchJSONWithChecks} from '../../utils/NativeFetchHelpers';
import { MaybeIfValue, ValueOrLoading } from '../../utils/RenderValues';
import {LOGIN_URL_NATIVE, EMAIL_URL_NATIVE} from '../../utils/UrlPaths';
import { selectUserName, setUserName } from '../userInfo/userInfoSlice';

interface NativeEmailResponse {
    email: string;
}

export type NativeEmailResponseType = NativeEmailResponse & withErrors;

interface NativeLoginResponse {
    email: string;
    jwt: string;
}
  
export type NativeLoginResponseType = NativeLoginResponse & withErrors;
  

function rawEmailResponseToStrongType(response: unknown): NativeEmailResponseType {
    if (response === undefined) {
        throw new Error("email response is UNDEFINED?");
    }
    if (response === null) {
        throw new Error("email response is NULL?");
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const responseExists = response as any;
    if (responseExists.errors) {
        console.warn("Found errors in email response, no typechecking!");
        return responseExists;
    }
    if (responseExists.email === null) {
        throw new Error("Email null!");
    }
    if (responseExists.email === undefined) {
        throw new Error("Email missing!");
    }
    if (responseExists.email.length === 0) {
        console.warn("Email empty?");
    }
    return responseExists;
}

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
    checkEmail(responseExists);
    checkJWT(responseExists);
    return responseExists;
  }
  


// eslint-disable-next-line @typescript-eslint/no-explicit-any
function checkEmail(responseExists: any) {
  if (responseExists.email === null) {
    throw new Error("Null email field");
  }
  if (responseExists.email === undefined) {
    throw new Error("Email field not present!");
  }
  if (responseExists.email.length === 0) {
    console.warn("Email is empty?");
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function checkJWT(responseExists: any) {
  if (responseExists.jwt === null) {
    throw new Error("Null jwt.");
  }
  if (responseExists.jwt === undefined) {
    throw new Error("jwt not present!");
  }
  if (responseExists.jwt.length === 0) {
    throw new Error("jwt empty!");
  }
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

  function nativeEmailRequestInit(jwt: string) {
      const def = userRequestOptions();
      const options = {
          ...def,
          headers: {
            ...withAuthorizationHeader(jwt)
          }      
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

const nativeGetEmail = async (jwt: string) => {
    const options = nativeEmailRequestInit(jwt);
    const emailFetchFailedCallback = async (awaitedResponse: Response): Promise<NativeEmailResponseType> => {
        console.warn("Email fetch failed!");
        return rawEmailResponseToStrongType(await awaitedResponse.json());
    }
    const emailFetchSuccessCallback = async (awaitedResponse: Response): Promise<NativeEmailResponseType> => {
        // console.log("Email fetch success!");
        return rawEmailResponseToStrongType(await awaitedResponse.json());
    }
    // console.log(`Fetching email from: ${EMAIL_URL_NATIVE}`);
    // debugger;
    const result = fetchJSONWithChecks(EMAIL_URL_NATIVE, options, 200, false, emailFetchFailedCallback, emailFetchSuccessCallback) as Promise<NativeEmailResponseType>;
    return await result;
}


const loginWithIDToken = (id_token: string, setAsyncStoreError: React.Dispatch<React.SetStateAction<string | null>>, dispatch: AppDispatch, setLoginErrors: React.Dispatch<React.SetStateAction<string | null>>) => {
    const options = nativeLoginRequestInit(id_token);
    console.log("logging in to server!")
    // const url = (API_URL + '/google_login_token');
    // debugger;
    const result = fetchJSONWithChecks(LOGIN_URL_NATIVE, options, 200, true, fetchLoginFailedCallback, fetchLoginSuccessCallback) as Promise<NativeLoginResponseType>;
    return result.then((response) => {
      if (response.errors !== undefined) {
        const str = formatErrors(response.errors);
        console.error(`Login to server FAILED: ${str}`);
        setLoginErrors(str);
        Sentry.Native.captureMessage(str);
        // eslint-disable-next-line no-debugger
        debugger;
        return null;
      }
      console.log(`successfully logged in to server! Username ${response.email}`);
      dispatch(setUserName(response.email));
      dispatch(setJWT(response.jwt));
      console.assert(response.errors === undefined);
  
      return saveJWTToAsyncStore(response.jwt, setAsyncStoreError);
  
    }).catch((error) => {
      Sentry.Native.captureException(error);
      console.error(error);
      // eslint-disable-next-line no-debugger
      debugger;
    })
  };
  
/*
  Example exception: 
  {
    "nativeStackAndroid": [],
    "userInfo": null,
    "message": "Could not encrypt/decrypt the value for SecureStore",
    "code": "ERR_SECURESTORE_ENCRYPT_FAILURE", 
    "line": 4772, "column": 45, "sourceURL": "http://192.168.1.21:8081/index.bundle?...
}

*/

function unknownNativeErrorTryFormat(error: unknown): string {
  let errorString = 'Error as attempted formatting: ';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((error as any).message) {
    errorString += 'Has a message: "';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    errorString += String((error as any).message);
    errorString += '"';
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((error as any).code) {
    errorString += ' Has a code: "';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    errorString += String((error as any).code);
    errorString += '"';
  }

  errorString += '\r\n...All other fields as JSON: ';
  errorString += JSON.stringify(error);
  return errorString;
}

function hasBadStore(error: unknown): boolean {
  const badStoreMessage = "Could not encrypt/decrypt the value for SecureStore";
  const badStoreCode = "ERR_SECURESTORE_ENCRYPT_FAILURE";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!(error as any).message) {
    return false;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!(error as any).code) {
    return false;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((error as any).message === badStoreMessage) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((error as any).code === badStoreCode) {
      return true;
    }
  }
  return false;
}

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
      // console.log(`Got JWT from storage! ${maybeJWT}`);
      return maybeJWT;
    }
    catch (error) {
      if (hasBadStore(error)) {
        console.log("Corrupt store!");
        setAsyncStoreError(`Store is corrupt, will try and clear. - error: ${String(error)}`);
        await SecureStore.deleteItemAsync(CO2_TRACKER_JWT_KEY_NAME);
        console.log("Cleared.");
        setAsyncStoreError(`Corrupt store cleared... you may need to restart the app!`);
        return null;
      }
      console.error(unknownNativeErrorTryFormat(error));
      setAsyncStoreError(`Error loading login info from secure local storage: ${String(error)}. You will need to login manually.`);
      Sentry.Native.captureException(error);
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
      Sentry.Native.captureException(error);
      // eslint-disable-next-line no-debugger
      debugger;
    }
  }
  
  

function setIDTokenIfGoodResponseFromGoogle(setIDToken: React.Dispatch<React.SetStateAction<string | null>>, responseFromGoogle: AuthSessionResult | null, setLoginErrors: React.Dispatch<React.SetStateAction<string | null>>) {
  if (responseFromGoogle === undefined) {
    throw new Error("Response from google (auth) is undefined?");
  }
  if (responseFromGoogle === null) {
    // console.log("response is null. Must not have tried logging in yet.");
    return;
  }
  if (responseFromGoogle.type === 'error') {
    handleGoogleAuthErrorResponse(responseFromGoogle, setLoginErrors);
    return;
  }
  if (responseFromGoogle.type === 'success') {
    handleGoogleAuthSuccessResponse(responseFromGoogle, setLoginErrors, setIDToken);
    return;
  }
  if (responseFromGoogle.type === 'dismiss') {
    handleGoogleAuthDismissResponse(responseFromGoogle, setLoginErrors, setIDToken);
    return;
  }
  throw new Error(`Unexpected responseFromGoogle type: "${responseFromGoogle.type}". Full object: ${JSON.stringify(responseFromGoogle)} `);
}

function handleGoogleAuthDismissResponse(responseFromGoogle: AuthSessionResult, setLoginErrors: React.Dispatch<React.SetStateAction<string | null>>, setIDToken: React.Dispatch<React.SetStateAction<string | null>>) {
  if (responseFromGoogle.type !== "dismiss") {
    throw new Error("compile time bug. Wrong type passed to handleGoogleAuthDismissResponse, I'm not good enough at typescript to do correctly.");
  }
  setIDToken(null);
  setLoginErrors("You dismissed the login prompt. Try again.");
}

function handleGoogleAuthSuccessResponse(responseFromGoogle: AuthSessionResult, setLoginErrors: React.Dispatch<React.SetStateAction<string | null>>, setIDToken: React.Dispatch<React.SetStateAction<string | null>>) {
  if (responseFromGoogle.type !== "success") {
    throw new Error("compile time bug. Wrong type passed to handleGoogleAuthSuccessResponse, I'm not good enough at typescript to do correctly.");
  }
  if (responseFromGoogle.authentication === undefined) {
    throw new Error('responseFromGoogle.authentication is undefined?');
  }
  if (responseFromGoogle.authentication === null) {
    console.warn('authentication is null?');
    Sentry.Native.captureMessage("Authentication is null?");
    // eslint-disable-next-line no-debugger
    debugger;
    return;
  }
  //see also, fields:
  //  expiresIn
  //  refreshToken
  console.log(`expiresIn: ${responseFromGoogle.authentication.expiresIn}`);
  console.log(`refreshToken: ${responseFromGoogle.authentication.refreshToken}`);
  if (responseFromGoogle.authentication.idToken === null) {
    setLoginErrors('ID token missing from google response. May be a bug?');
    Sentry.Native.captureMessage("responseFromGoogle.authentication.idToken null??!?");
    throw new Error("responseFromGoogle.authentication.idToken null??!?");
  }
  if (responseFromGoogle.authentication.idToken === undefined) {
    throw new Error("responseFromGoogle.authentication.idToken undefined??!?");
  }
  setIDToken(responseFromGoogle.authentication.idToken);
  setLoginErrors(null);

}

function handleGoogleAuthErrorResponse(responseFromGoogle: AuthSessionResult, setLoginErrors: React.Dispatch<React.SetStateAction<string | null>>) {
  let googleAuthError = `Error logging in with google!`;
  if (responseFromGoogle.type !== "error") {
    throw new Error("compile time bug. Wrong type passed to handleGoogleAuthErrorResponse, I'm not good enough at typescript to do correctly.");
  }
  if (responseFromGoogle.error) {
    console.warn(`Authentication error: ${responseFromGoogle.error}`);
    googleAuthError += ` Google authentication error: ${responseFromGoogle.error}.`;
  }
  if (responseFromGoogle.errorCode) {
    console.assert(responseFromGoogle.errorCode.length > 0);
    console.warn(`Authentication error code: ${responseFromGoogle.errorCode}`);
    googleAuthError += ` Google authentication error code: ${responseFromGoogle.errorCode}.`;
  }
  googleAuthError += ` ...full object: ${JSON.stringify(responseFromGoogle)}`;
  setLoginErrors(googleAuthError);
  Sentry.Native.captureMessage(googleAuthError);
}

async function handleAsyncStoreResult(maybeJWT: string | null, dispatch: AppDispatch, setLoginErrors: React.Dispatch<React.SetStateAction<string | null>>) {
    if (maybeJWT) {
        dispatch(setJWT(maybeJWT));
        // console.log("Set JWT from storage! Will try and get email/username from server...");
        nativeGetEmail(maybeJWT).then((emailResponse) => {
            // console.log(`Server responds with email response: ${JSON.stringify(emailResponse)}`);
            // debugger;
            return dispatch(setUserName(emailResponse.email));
        }).catch((error) => {
          Sentry.Native.captureException(error);
          setLoginErrors(`Failed to load up-to-date username/email: ${String(error)}`)
        })
    }
    else {
        console.log("No JWT from storage.");
    }

}


/*
function apiUrlInDevOrProd(): string {
    if ((typeof manifest?.packagerOpts === `object`) && manifest.packagerOpts.dev) {
        const defaultPath = 'http://localhost:3000';
        if (manifest === undefined) {
            console.error(`Something is VERY broken - manifest is undefined - can't get local server url... Will try default (${defaultPath})...`);
            return defaultPath;
        }
    }
    const prod = `https://covid-co2-tracker.herokuapp.com`;
    console.log(`Using (prod) API base: ${prod}`);
    return prod;
}

*/

const {manifest} = Constants;

// const devAndroidClientID = '460477494607-vslsidjdslivkafohmt992tls0dh6cf5.apps.googleusercontent.com';

const devAndroidClientID = '460477494607-lm1oqcabp7aipnudobprb68tjncrj3k3.apps.googleusercontent.com';

const prodAndroidClientID = '460477494607-m8j9n9k6kbo9cdokdaq243dgn57khkkq.apps.googleusercontent.com';
function getAndroidClientID(): string {
  if ((typeof manifest?.packagerOpts === `object`) ) {
    if (manifest.packagerOpts.dev || __DEV__ ) {
      if (manifest === undefined) {
        console.error(`Something is VERY broken - manifest is undefined - Will try default (${devAndroidClientID})...`);
      }
      // console.log("using android dev oauth client id");
      return devAndroidClientID;
    }
  }
  // console.log("using android prod oauth client id");
  return prodAndroidClientID;
}

const useGoogleAuthForCO2Tracker = () => {
    const [idToken, setIDToken] = useState(null as (string | null));
    // const [jwt, setJWT] = useState(null as (string | null));
    const [asyncStoreError, setAsyncStoreError] = useState(null as (string | null));
    const [loginErrors, setLoginErrors] = useState(null as (string | null));
    // const [userName, setUsername] = useState('');
  
    const dispatch = useDispatch();
  
  
    const [promptAsyncReady, setPromptAsyncReady] = useState(false);
  
    const androidClientId = getAndroidClientID();



    /*
      Ok, so this:
      redirectUri: "riccio.co2.client:/oauthredirect",
      causes a "redirect_uri_mismatch:"
    */
    const config: Partial<Google.GoogleAuthRequestConfig> = {
      // expoClientId: 'GOOGLE_GUID.apps.googleusercontent.com',
      // iosClientId: 'GOOGLE_GUID.apps.googleusercontent.com',
      androidClientId,
      // webClientId: 'GOOGLE_GUID.apps.googleusercontent.com',
      // redirectUri: "com.ariccio.co2_native_client:/oauth2redirect",
      // redirectUri: "com.ariccio.co2_native_client/:oauth2redirect",
      // redirectUri: "com.ariccio.co2_native_client:",
      // redirectUri: "riccio.co2.client:/oauthredirect",
      // redirectUri: "riccio.co2.client",
      redirectUri: "fartipelago",
      
      // scopes: [
      //   'profile',
      //   'email',
      //   'openid'
      // ]
    }

    const redirectUriOptions: AuthSessionRedirectUriOptions = {
      // scheme: 'com.ariccio.co2_native_client:/fartipelago://'
    }
    const [request, response, promptAsync] = Google.useAuthRequest(config, redirectUriOptions);
  
    const logout = () => {
      console.log("Log out clicked...");
      dispatch(setJWT(null));
      deleteJWTFromAsyncStore(setAsyncStoreError);
      alert("Please restart the app.");
    };


    useEffect(() => {
        queryAsyncStoreForStoredJWT(setAsyncStoreError).then((maybeJWT) => {
            return handleAsyncStoreResult(maybeJWT, dispatch, setLoginErrors);
        }).catch((error) => {
          setAsyncStoreError(String(error));
          Sentry.Native.captureException(error);
        })
    }, []);
  
    useEffect(() => {
      // "Be sure to disable the prompt until request is defined."
      const requestSet = (request !== null);
      // console.log(`request ready for promptAsync: ${requestSet}`);
      setPromptAsyncReady(requestSet);
    }, [request]);
  
    useEffect(() => {
      // console.log(request);
      setIDTokenIfGoodResponseFromGoogle(setIDToken, response, setLoginErrors);
    }, [response]);
  
    useEffect(() => {
      if (idToken === null) {
        // console.log("id token is null, nothing to forward to server.");
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

function userNameValueOrLoading(jwt: string | null, userName?: string | null) {
  if (userName === undefined) {
    if (jwt === null) {
      return undefined;
    }
    return null;
  }
  if (userName === null) {
    console.error("No username?");
    return "No userName!?";
  }
  if (userName === '') {
    console.warn("Username empty?");
    return "Username empty?";
  }
  return userName;
}

const debugClientID = async (): Promise<string> => {
  const androidClientId = getAndroidClientID();
  const isDevClientID = devAndroidClientID === androidClientId;
  const buttons = [
    {text: "Ok!", onPress: () => 'yes'},
];
const options = {
  cancelable: true,
  onDismiss: () => 'no'
}

  return await AlertAsync("Debug Client ID:", `oAuth client ID: ${androidClientId} (dev: ${isDevClientID}), mainModuleName: ${manifest?.mainModuleName}`, buttons, options)
}

const LoginOrLogoutButton: React.FC<{jwt: string | null, promptAsyncReady: boolean, promptAsync: (options?: AuthRequestPromptOptions | undefined) => Promise<AuthSessionResult>, logout: () => void, userName?: string | null}> = ({jwt, promptAsyncReady, promptAsync, logout, userName}) => {
  const buttonDisable = disablePromptAsyncButton(jwt, promptAsyncReady);
  if (!buttonDisable) {
    return (
      <>
          <ValueOrLoading text="username: " value={userNameValueOrLoading(jwt, userName)} suffix=" (this shouldn't show up)"/>
          <Button disabled={buttonDisable} title="Login" onPress={() => {debugClientID().then((_) => promptAsync())}}/>
      </>
    );
  }
  if (userName === null) {
    return (
      <>
        <Button title="Log out" onPress={() => logout()}/>
      </>
    );
  }
  if (userName === undefined) {
    return (
      <>
        <Button title="Log out of (username loading...)" onPress={() => logout()}/>
      </>
    );      
  }
  return (
    <>
      <Button title={`Log out of ${userName}`} onPress={() => {logout()}}/>
    </>
  );
}


export function AuthContainerWithLogic(): JSX.Element {
    const jwt = useSelector(selectJWT);
    const userName = useSelector(selectUserName);
    const {promptAsync, promptAsyncReady, asyncStoreError, logout, loginErrors} = useGoogleAuthForCO2Tracker();
  
    
    return (
      <>
        <LoginOrLogoutButton jwt={jwt} promptAsyncReady={promptAsyncReady} promptAsync={promptAsync} logout={() => logout()} userName={userName}/>
        
        <MaybeIfValue text="Errors with automatic login! Details: " value={asyncStoreError}/>
        <MaybeIfValue text="Login errors: " value={loginErrors}/>
      </>
    );
  } 
  