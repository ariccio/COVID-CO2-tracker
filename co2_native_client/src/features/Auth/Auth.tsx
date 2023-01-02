/* eslint-disable react/prop-types */
// See updated (more restrictive) licensing restrictions for this subproject! Updated 02/03/2022.

import { AuthSessionResult } from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import {useEffect, useState, useMemo} from 'react';
import { Button } from 'react-native';
// import AlertAsync from "react-native-alert-async";
import { useDispatch, useSelector } from 'react-redux';
import * as Sentry from 'sentry-expo';

import { postRequestOptions, userRequestOptions } from '../../../../co2_client/src/utils/DefaultRequestOptions';
import {formatErrors, withErrors} from '../../../../co2_client/src/utils/ErrorObject';
// import {LOGIN_URL} from '../../../../co2_client/src/utils/UrlPath';
import { selectJWT, setJWT } from '../../app/globalSlice';
import { AppDispatch } from '../../app/store';
import { unknownNativeErrorTryFormat } from '../../utils/FormatUnknownNativeError';
import { withAuthorizationHeader } from '../../utils/NativeDefaultRequestHelpers';
// import { withAuthorizationHeader } from '../../utils/NativeDefaultRequestHelpers';
import {fetchJSONWithChecks} from '../../utils/NativeFetchHelpers';
import { MaybeIfValue, ValueOrLoading } from '../../utils/RenderValues';
import {LOGIN_URL_NATIVE, EMAIL_URL_NATIVE} from '../../utils/UrlPaths';
import { selectUserName, setUserName } from '../userInfo/userInfoSlice';
import {AuthLoginProgressState, CallPromptAsyncStateAction, selectAsyncStoreError, selectLoginErrors, selectLoginProgress, selectPromptAsyncError, selectPromptAsyncReady, selectRequestPromptAsync, setAsyncStoreError, setLoginErrors, setLoginProgress, setPromptAsyncError, setPromptAsyncReady, setRequestPromptAsync} from './authSlice';

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

async function saveJWTToAsyncStore(jwt: string, dispatch: AppDispatch): Promise<void> {
  console.log(`Saving JWT (${jwt}) to secure storage...`);
  try {
    await SecureStore.setItemAsync(CO2_TRACKER_JWT_KEY_NAME, jwt);
    dispatch(setLoginProgress(AuthLoginProgressState.None));
    return;
  }
  catch (error) {
    console.error(error);
    dispatch(setAsyncStoreError(`Error saving login info from secure local storage: '${String(error)}' ...you will need to login again manually!`));
    dispatch(setLoginProgress(AuthLoginProgressState.Failed));
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


const loginWithIDToken = (id_token: string, dispatch: AppDispatch) => {
    const options = nativeLoginRequestInit(id_token);
    console.log("logging in to server!");
    dispatch(setLoginProgress(AuthLoginProgressState.ConnectingToServer));
    // const url = (API_URL + '/google_login_token');
    // debugger;
    const result = fetchJSONWithChecks(LOGIN_URL_NATIVE, options, 200, true, fetchLoginFailedCallback, fetchLoginSuccessCallback) as Promise<NativeLoginResponseType>;
    return result.then((response) => {
      if (response.errors !== undefined) {
        const str = formatErrors(response.errors);
        console.error(`Login to server FAILED: ${str}`);
        dispatch(setLoginErrors(str));
        Sentry.Native.captureMessage(str);
        dispatch(setLoginProgress(AuthLoginProgressState.Failed));
        // eslint-disable-next-line no-debugger
        debugger;
        return null;
      }
      console.log(`successfully logged in to server! Username ${response.email}`);
      dispatch(setUserName(response.email));
      dispatch(setJWT(response.jwt));
      console.assert(response.errors === undefined);
      dispatch(setLoginProgress(AuthLoginProgressState.AlmostDoneSaving));
      Sentry.Native.setUser({email: response.email});
      return saveJWTToAsyncStore(response.jwt, dispatch);
  
    }).catch((error) => {
      console.error(unknownNativeErrorTryFormat(error));
      Sentry.Native.captureException(error);
      dispatch(setLoginProgress(AuthLoginProgressState.Failed));
      dispatch(setLoginErrors(`Unexpected error: ${String(error)}`));
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

async function queryAsyncStoreForStoredJWT(dispatch: AppDispatch): Promise<string | null> {
    const available = await SecureStore.isAvailableAsync();
    if (!available) {
      // eslint-disable-next-line no-debugger
      debugger;
      dispatch(setAsyncStoreError("SecureStore NOT available! Should be available on Android AND iOS. You will need to login manually on each start of the app."));
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
        dispatch(setAsyncStoreError(`Store is corrupt, will try and clear. - error: ${String(error)}`));
        await SecureStore.deleteItemAsync(CO2_TRACKER_JWT_KEY_NAME);
        console.log("Cleared.");
        dispatch(setAsyncStoreError(`Corrupt store cleared... you may need to restart the app!`));
        return null;
      }
      console.error(unknownNativeErrorTryFormat(error));
      dispatch(setAsyncStoreError(`Error loading login info from secure local storage: ${unknownNativeErrorTryFormat(error)}. You will need to login manually.`));
      Sentry.Native.captureException(error);
      // eslint-disable-next-line no-debugger
      debugger;
      return null;
    }
  }
  
  async function deleteJWTFromAsyncStore(dispatch: AppDispatch): Promise<void> {
    const valueInStore = await queryAsyncStoreForStoredJWT(dispatch);
    if (valueInStore === null) {
      return;
    }
    try {
      await SecureStore.deleteItemAsync(CO2_TRACKER_JWT_KEY_NAME);
    }
    catch (error) {
      console.error(unknownNativeErrorTryFormat(error));
      dispatch(setAsyncStoreError(`Error clearing login info from secure local storage: ${unknownNativeErrorTryFormat(error)}. This is weird. Try clearing app data?`));
      Sentry.Native.captureException(error);
      // eslint-disable-next-line no-debugger
      debugger;
    }
  }
  
  

function setIDTokenIfGoodResponseFromGoogle(setIDToken: React.Dispatch<React.SetStateAction<string | null>>, responseFromGoogle: AuthSessionResult | null, dispatch: AppDispatch) {
  if (responseFromGoogle === undefined) {
    throw new Error("Response from google (auth) is undefined?");
  }
  if (responseFromGoogle === null) {
    // console.log("response is null. Must not have tried logging in yet.");
    return;
  }
  if (responseFromGoogle.type === 'error') {
    handleGoogleAuthErrorResponse(responseFromGoogle, dispatch);
    return;
  }
  if (responseFromGoogle.type === 'success') {
    handleGoogleAuthSuccessResponse(responseFromGoogle, setIDToken, dispatch);
    return;
  }
  if (responseFromGoogle.type === 'dismiss') {
    handleGoogleAuthDismissResponse(responseFromGoogle, setIDToken, dispatch);
    return;
  }
  throw new Error(`Unexpected responseFromGoogle type: "${responseFromGoogle.type}". Full object: ${JSON.stringify(responseFromGoogle)} `);
}

function handleGoogleAuthDismissResponse(responseFromGoogle: AuthSessionResult, setIDToken: React.Dispatch<React.SetStateAction<string | null>>, dispatch: AppDispatch) {
  if (responseFromGoogle.type !== "dismiss") {
    throw new Error("compile time bug. Wrong type passed to handleGoogleAuthDismissResponse, I'm not good enough at typescript to do correctly.");
  }
  setIDToken(null);
  dispatch(setLoginErrors("You dismissed the login prompt. Try again."));
  dispatch(setLoginProgress(AuthLoginProgressState.None));
}

function handleGoogleAuthSuccessResponse(responseFromGoogle: AuthSessionResult, setIDToken: React.Dispatch<React.SetStateAction<string | null>>, dispatch: AppDispatch) {
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
    dispatch(setLoginProgress(AuthLoginProgressState.Failed));
    return;
  }
  //see also, fields:
  //  expiresIn
  //  refreshToken
  console.log(`expiresIn: ${responseFromGoogle.authentication.expiresIn}`);
  console.log(`refreshToken: ${responseFromGoogle.authentication.refreshToken}`);
  if (responseFromGoogle.authentication.idToken === null) {
    dispatch(setLoginErrors('ID token missing from google response. May be a bug?'));
    Sentry.Native.captureMessage("responseFromGoogle.authentication.idToken null??!?");
    throw new Error("responseFromGoogle.authentication.idToken null??!?");
  }
  if (responseFromGoogle.authentication.idToken === undefined) {
    throw new Error("responseFromGoogle.authentication.idToken undefined??!?");
  }
  setIDToken(responseFromGoogle.authentication.idToken);
  dispatch(setLoginErrors(null));
  dispatch(setLoginProgress(AuthLoginProgressState.GoogleResponseGood));

}

function handleGoogleAuthErrorResponse(responseFromGoogle: AuthSessionResult, dispatch: AppDispatch) {
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
  dispatch(setLoginErrors(googleAuthError));
  Sentry.Native.captureMessage(googleAuthError);
  dispatch(setLoginProgress(AuthLoginProgressState.None));
}

async function handleAsyncStoreResult(maybeJWT: string | null, dispatch: AppDispatch) {
  if (maybeJWT) {
    dispatch(setJWT(maybeJWT));
    // console.log("Set JWT from storage! Will try and get email/username from server...");
    try {
      const emailResponse = await nativeGetEmail(maybeJWT);
      if (emailResponse.errors !== undefined) {
        const errStr = `Failed to get email. May be okay to proceed? Errors: ${formatErrors(emailResponse.errors)}`;
        dispatch(setLoginErrors(errStr));
        console.warn(errStr);
        Sentry.Native.captureMessage(`Failure getting email: ${formatErrors(emailResponse.errors)}`);
        if (emailResponse.errors[0].message[0].includes('decoding error')) {
          console.warn(`Error decoding token! JWT: ${maybeJWT}`);
          console.log('Will clear JWT?');
          dispatch(setJWT(null));
          deleteJWTFromAsyncStore(dispatch);
        }
        return;
      }
      // console.log(`Server responds with email response: ${JSON.stringify(emailResponse)}`);
      // debugger;
      dispatch(setUserName(emailResponse.email));
      Sentry.Native.setUser({email: emailResponse.email});
      return 
    }
    catch (error) {
      dispatch(setLoginErrors(`Failed to load up-to-date username/email: ${String(error)}`));
      Sentry.Native.captureException(error);
    }
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

const devAndroidClientID = '460477494607-6ur80br687qibpif8qhnll3275rjn2bb.apps.googleusercontent.com';

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


const devIosClientID = '460477494607-jritv1947a7e0ku5bdi8uag6jot8b29f.apps.googleusercontent.com';
const prodIosClientID = '460477494607-0e20ijqlb44inf0p2tf5n09q7j6148gq.apps.googleusercontent.com';

function getIosClientID(): string {
  if ((typeof manifest?.packagerOpts === `object`) ) {
    if (manifest.packagerOpts.dev || __DEV__ ) {
      if (manifest === undefined) {
        console.error(`Something is VERY broken - manifest is undefined - Will try default (${devIosClientID})...`);
      }
      // console.log("using android dev oauth client id");
      return devIosClientID;
    }
  }
  // console.log("using android prod oauth client id");
  return prodIosClientID;
}


// export interface AuthState {
//   // promptAsync: (options?: AuthRequestPromptOptions | undefined) => Promise<AuthSessionResult>;
// }

export const logout = (dispatch: AppDispatch) => {
  console.log("Log out clicked...");
  dispatch(setJWT(null));
  deleteJWTFromAsyncStore(dispatch);
  alert("Please restart the app.");
};


export const useGoogleAuthForCO2Tracker = () => {
  const dispatch = useDispatch();
  const [idToken, setIDToken] = useState(null as (string | null));
  const requestPromptAsync = useSelector(selectRequestPromptAsync);

  const androidClientId = useMemo(getAndroidClientID, []);
  const iosClientId = useMemo(getIosClientID, []);
  /*
    Ok, so this:
    redirectUri: "riccio.co2.client:/oauthredirect",
    causes a "redirect_uri_mismatch:"
  */
  const config: Partial<Google.GoogleAuthRequestConfig> = {
    // expoClientId: 'GOOGLE_GUID.apps.googleusercontent.com',
    iosClientId: iosClientId,
    androidClientId
    }

  const [request, response, promptAsync] = Google.useAuthRequest(config);

  
  useEffect(() => {
    if (requestPromptAsync === CallPromptAsyncStateAction.TriggerCallPromptAsync) {
      promptAsync().then((result) => {
        dispatch(setLoginProgress(AuthLoginProgressState.ParsingGoogleResponse));
        if (result.type === 'success') {
          return;
        }
        handleNonSuccessResults(result, dispatch);
        dispatch(setRequestPromptAsync(null));
        // eslint-disable-next-line no-useless-return
        return;
        
      }).catch((error) => {
        dispatch(setPromptAsyncError(`Unexpected promise rejection when prompting user for login: ${unknownNativeErrorTryFormat(error)}`))
        Sentry.Native.captureException(error);
        dispatch(setLoginProgress(AuthLoginProgressState.Failed));
      })
    }
  }, [requestPromptAsync, dispatch]);


  useEffect(() => {
      queryAsyncStoreForStoredJWT(dispatch).then((maybeJWT) => {
          return handleAsyncStoreResult(maybeJWT, dispatch);
      }).catch((error) => {
        dispatch(setAsyncStoreError(unknownNativeErrorTryFormat(error)));
        Sentry.Native.captureException(error);
      })
  }, []);

  useEffect(() => {
    // "Be sure to disable the prompt until request is defined."
    const requestSet = (request !== null);
    // console.log(`request ready for promptAsync: ${requestSet}`);
    dispatch(setPromptAsyncReady(requestSet));
  }, [request, dispatch]);

  useEffect(() => {
    // console.log(request);
    setIDTokenIfGoodResponseFromGoogle(setIDToken, response, dispatch);
  }, [response, dispatch]);

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
    loginWithIDToken(idToken, dispatch);
  }, [idToken, dispatch]);

  return {promptAsync};
  };
  
function handleNonSuccessResults(result: AuthSessionResult, dispatch: AppDispatch) {
  switch (result.type) {
    case ('error'): {
      dispatch(setPromptAsyncError(`Login failed with an 'error' result. Error name: ${result.error?.name}. Error description: '${result.error?.description}'. code: ${result.errorCode}, url: ${result.url}, params: ${result.params}, info url: ${result.error?.uri} any other info: ${JSON.stringify(result.error?.info)}`));
      dispatch(setLoginProgress(AuthLoginProgressState.Failed));
      return;
    }
    case ('cancel'): {
      dispatch(setPromptAsyncError(`You cancelled login.`));
      dispatch(setLoginProgress(AuthLoginProgressState.Failed));
      return;
    }
    case ('dismiss'): {
      dispatch(setPromptAsyncError(`You dismissed login.`));
      dispatch(setLoginProgress(AuthLoginProgressState.Failed));
      return;
    }
    case ('locked'): {
      dispatch(setPromptAsyncError(`Login was 'locked'. Huh?`));
      Sentry.Native.captureMessage("Login was 'locked'?");
      // eslint-disable-next-line no-useless-return
      return;
    }
    default: {
      // eslint-disable-next-line no-useless-return
      return;
    }
  }
}

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

// const debugClientID = async (): Promise<string> => {
//   const androidClientId = getAndroidClientID();
//   const isDevClientID = devAndroidClientID === androidClientId;
//   const buttons = [
//     {text: "Ok!", onPress: () => 'yes'},
//   ];
//   const options = {
//     cancelable: true,
//     onDismiss: () => 'no'
//   }

//   return await AlertAsync("Debug Client ID:", `oAuth client ID: ${androidClientId} (dev: ${isDevClientID}), mainModuleName: ${manifest?.mainModuleName}`, buttons, options)
// }

function LogoutButton(): JSX.Element {
  const dispatch = useDispatch();
  const userName = useSelector(selectUserName);
  if (userName === null) {
    return (
      <>
        <Button title="Log out (null username?)" onPress={() => logout(dispatch)}/>
      </>
    );
  }
  if (userName === undefined) {
    return (
      <>
        <Button title="Log out of (username loading...)" onPress={() => logout(dispatch)}/>
      </>
    );      
  }
  return (
    <>
      <Button title={`Log out of ${userName}`} onPress={() => {logout(dispatch)}}/>
    </>
  );
}


/*
  loginProgress: AuthLoginProgressState;
  setLoginProgress: React.Dispatch<React.SetStateAction<AuthLoginProgressState>>;

*/

function loginButtonTitleText(loginProgress: AuthLoginProgressState): string {
  switch (loginProgress) {
    case (AuthLoginProgressState.None): {
      return "Login"
    }
    case (AuthLoginProgressState.WaitingForGoogle): {
      return "Waiting for google";
    }
    case (AuthLoginProgressState.ParsingGoogleResponse): {
      return "Recieved response, parsing...";
    }
    case (AuthLoginProgressState.GoogleResponseGood): {
      return "Google response good! Ready to connect...";
    }
    case (AuthLoginProgressState.ConnectingToServer): {
      return "Connecting to server...";
    }
    case (AuthLoginProgressState.AlmostDoneSaving): {
      return "Almost ready, saving...";
    }
    case (AuthLoginProgressState.Failed): {
      return "Login (try again)";
    }
  }
}

const pressLogin = async (dispatch: AppDispatch) => {
  // await debugClientID();
  dispatch(setLoginProgress(AuthLoginProgressState.WaitingForGoogle));
  dispatch(setRequestPromptAsync(CallPromptAsyncStateAction.TriggerCallPromptAsync));
  // await promptAsync();
  
}


function LoginOrLogoutButton() {
  const dispatch = useDispatch();
  const promptAsyncReady = useSelector(selectPromptAsyncReady);
  const jwt = useSelector(selectJWT);
  const userName = useSelector(selectUserName);
  const loginProgress = useSelector(selectLoginProgress);

  const [buttonDisable, setButtonDisable] = useState(disablePromptAsyncButton(jwt, promptAsyncReady));

  useEffect(() => {
    setButtonDisable(disablePromptAsyncButton(jwt, promptAsyncReady));
  }, [jwt, promptAsyncReady])
  
  if (!buttonDisable) {
    return (
      <>
          <ValueOrLoading text="username: " value={userNameValueOrLoading(jwt, userName)} suffix=" (this shouldn't show up)"/>
          <Button disabled={buttonDisable} title={loginButtonTitleText(loginProgress)} onPress={() => pressLogin(dispatch)}/>
      </>
    );
  }
  return (
    <>
      <LogoutButton/>
    </>
  )
}


export function AuthContainer(): JSX.Element {
  const loginErrors = useSelector(selectLoginErrors);
  const asyncStoreError = useSelector(selectAsyncStoreError);
  const promptAsyncErrors = useSelector(selectPromptAsyncError);

  return (
    <>
      <LoginOrLogoutButton/>
      
      <MaybeIfValue text="Errors with automatic login! Details: " value={asyncStoreError}/>
      <MaybeIfValue text="Login errors: " value={loginErrors}/>
      <MaybeIfValue text="Login PROMPT errors: " value={promptAsyncErrors}/>
    </>
  );
}
  