import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
// import { GoogleLogin, GoogleLogout, GoogleLoginResponse, GoogleLoginResponseOffline } from 'react-google-login';

import { CredentialResponse, GoogleLogin, googleLogout, MomentListener, PromptMomentNotification } from '@react-oauth/google';

import * as Sentry from "@sentry/browser";

import { setUsername, selectGoogleProfile, selectLoginAaaPeeEyeKey, setLoginAaaPeeEyeKey, setAaaPeeEyeKeyErrorState, selectAaaPeeeEyeKeyErrorState, GoogleProfile, selectGSIScriptLoadState, GSIScriptLoadStates, PromptMomentNotificationResults, setPromptMomentNotificationState, setGoogleOneTapErrorState, selectGoogleOneTapErrorState } from './loginSlice';

import { logout } from '../../utils/Authentication';
import { fetchJSONWithChecks } from '../../utils/FetchHelpers';
import { postRequestOptions } from '../../utils/DefaultRequestOptions';
import { getGoogleLoginClientAaaPeeeEyeKey } from '../../utils/GoogleAPIKeys';

// import { profilePath } from '../../paths/paths';
import { LOGIN_URL } from '../../utils/UrlPath';

import { setGoogleProfile } from './loginSlice';
import { AppDispatch } from '../../app/store';
import { formatErrors } from '../../utils/ErrorObject';
import { Button } from 'react-bootstrap';
import { jwtDecode } from "jwt-decode";
import { isAhrefsbot, isMacosChrome, isMobileFacebookBrowser, isTwitterAppBrowser } from '../../utils/Browsers';




export enum LoginFormType {
    Login,
    Signup
}


// type eventChangeType = (event: React.ChangeEvent<HTMLInputElement>) => void;
// type formSubmitType = (event: React.FormEvent<HTMLFormElement>) => void;


// const onSubmitLoginForm = async (email: string, password: string,
//     setInvalid: React.Dispatch<React.SetStateAction<boolean>>, dispatch: any) => {
//         try {
//             const response: LoginResponse = await login(email, password);
//             if (response.errors !== undefined) {
//                 console.log("hmm.")
//                 // debugger;
//                 setInvalid(true);
//                 return;
//             }
//             //this.props.loginUser(response.email, response.email, response.jwt)
//             dispatch(setUsername(response.email));
//             // debugger;
//             return;
//             // <Redirect to='/'/>
//             // alert("TODO: redirect here. For now please refresh.")
//         }
//         catch(error) {
//             setInvalid(true);
//             alert(error.message);
//         }
//     }

// const onSubmitSignupForm = async (email: string, password: string,
//     setInvalid: React.Dispatch<React.SetStateAction<boolean>>, dispatch: any) => {
//         try {
//             const response: SignupResponse = await signup(email, password);
//             if (response.errors !== undefined) {
//                 console.log("hmm.")
//                 // debugger;
//                 setInvalid(true);
//                 return;
//             }
//             //this.props.loginUser(response.email, response.email, response.jwt)
//             dispatch(setUsername(response.email));
//             // debugger;
//             return;
//             // <Redirect to='/'/>
//             // alert("TODO: redirect here. For now please refresh.")
//         }
//         catch(error) {
//             setInvalid(true);
//             alert(error.message);
//         }

//     }

// const onSubmit = async (email: string, password: string,
//     setInvalid: React.Dispatch<React.SetStateAction<boolean>>, dispatch: any, typeOfInstance: LoginFormType) => {    
//     if (typeOfInstance === LoginFormType.Login) {
//         return onSubmitLoginForm(email, password, setInvalid, dispatch);
//     }
//     console.assert(typeOfInstance === LoginFormType.Signup);
//     return onSubmitSignupForm(email, password, setInvalid, dispatch);
// } 

// const inputField = (email: string, emailChange: eventChangeType) =>
//     <input
//         name="email"
//         type="text"
//         placeholder="email"
//         value={email}
//         onChange={emailChange}
//     />

// const passwordField = (password: string, passwordChange: eventChangeType) => 
//     <input
//         name="password"
//         type="password"
//         value={password}
//         onChange={passwordChange}
//     />


// const formWithLink = (password: string, setPassword: eventChangeType, email: string, setEmail: eventChangeType, onSubmitEvent: formSubmitType) =>
//     <>
//     <form onSubmit={onSubmitEvent}>
//         {inputField(email, setEmail)}
//         {passwordField(password, setPassword)}
//         <button type="submit">Login</button>
//     </form>
//     {/* <Link to='/signup'>Sign up</Link> */}
//     </>

// export interface LoginProps {
//     formType: LoginFormType
// } 

// export const Login = ({formType}: LoginProps) => {
//     console.log("TODO: use bootstrap form. Even has a feedback option for the errors!")
//     const [password, setPassword] = useState('');
//     const [email, setEmail] = useState('');
//     const [invalid, setInvalid] = useState(false);
//     const dispatch = useDispatch();
//     const username = useSelector(selectUsername);
//     const setPasswordEvent = (event: React.ChangeEvent<HTMLInputElement>) => {
//         setPassword(event.target.value);
//     };
//     const setEmailEvent = (event: React.ChangeEvent<HTMLInputElement>) => {
//         setEmail(event.target.value);
//     };
//     const onSubmitEvent = (e: React.FormEvent<HTMLFormElement>) => {
//         e.preventDefault();
//         onSubmit(email, password, setInvalid, dispatch, formType);
//     }
//     // debugger;
//     if (username !== '') {
//         return <Redirect to={profilePath}/>
//     }
//     return (
//         <>
//             {invalid ? "try again!" : null}
//             {formWithLink(password, setPasswordEvent, email, setEmailEvent, onSubmitEvent)}
//         </>
//     );
// }

// export const LoginComponent = () =>
//   <>
//     Login: <Login formType={LoginFormType.Login}/>
//   </>

// export const SignupComponent = () =>
//     <>
//         Signup: <Login formType={LoginFormType.Signup}/>
//     </>

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


const loginWithIDToken = (id_token: string): Promise<void> => {
    const options = loginRequestInit(id_token);
    console.log("logging in to server!")
    // const url = (API_URL + '/google_login_token');
    const result = fetchJSONWithChecks(LOGIN_URL, options, 200, true, fetchFailedCallback, fetchSuccessCallback) as Promise<any>;
    return result.then((response) => {
        // console.log(response);
        // console.log("TODO: What the heck do I do with the response here? As long as it's correct, do I even care?");
        // debugger;
        if (response.errors !== undefined) {
            console.log(`Logging into server failed: ${formatErrors(response.errors)}`);
        }
        else {
            console.log("successfully logged in to server!");
            // debugger;
        }
        return response;

    }).catch((error) => {
        console.error(error);
        Sentry.captureException(error);
        debugger;
        return;
    })
}

const sendToServer = (response: CredentialResponse) => {
    if (response.credential === undefined) {
        alert("WTF?");
        debugger;
        return new Promise(() => {return;})
    }
    const id_token = response.credential;
    return loginWithIDToken(id_token);
}

const googleLoginSuccessCallback = (originalResponse: CredentialResponse, dispatch: AppDispatch) => {
    //https://developers.google.com/identity/sign-in/web/backend-auth
    console.log(originalResponse);
    // console.log("google login success!");
    // if (originalResponse.code) {
    //     console.warn("refresh token?");
    //     console.warn("https://github.com/anthonyjgrove/react-google-login/blob/master/README.md: If responseType is 'code', callback will return the authorization code that can be used to retrieve a refresh token from the server.");

    //     debugger;
    //     return;
    // }
    // If I dont pass a responseType, code is undefined, and thus the type is a GoogleLoginResponse.
    //https://developers.google.com/identity/sign-in/web/reference#gapiauth2authresponse

    const castedResponse = originalResponse;
    
    if (castedResponse.credential === undefined) {
        // console.log(jwtDecode(castedResponse.credential));
        console.error("Missing credential??");
        alert("Login error: missing credential?");
        Sentry.captureMessage(`Missing credential? ${JSON.stringify(castedResponse)}`);
        return;
    }
    
    // debugger;
    sendToServer(castedResponse).then((result) => {
        // Shut up typescript.
        if (castedResponse.credential === undefined) {
            console.error("Missing credential??");
            alert("Login error: missing credential?");
            Sentry.captureMessage(`Missing credential? ${JSON.stringify(castedResponse)}`);
            return;
        }
        console.log("successfully logged in to server, dispatching results to rest of app...");
        const parsedResponse = jwtDecode(castedResponse.credential) as GoogleProfile;
        //Driveby found bug - javascript is fucking absurd. I had "result" here instead of "castedResponse".
        if (parsedResponse.email === undefined) {
            debugger;
        }
        console.log(`Hello, ${parsedResponse.email}!`);
        // debugger;
        console.warn("TODO: strong type for google profile.");
        // debugger;
        dispatch(setGoogleProfile(parsedResponse));
        // dispatch(setGoogleAuthResponse(castedResponse.getAuthResponse()));
        dispatch(setUsername(parsedResponse.name));
        Sentry.setContext("google", {
            user_name: parsedResponse.name,
            user_email: parsedResponse.email
        });
    }).catch((error) => {
        Sentry.captureException(error);
        console.error(String(error));
        debugger;
    })

    //   debugger;
}

function stringifyGoogleLoginError(error: any): string {
    //https://stackoverflow.com/a/44862693/625687
    //https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify
    //"Example replacer, as an array"
    const errorAsString = `${JSON.stringify(error)}, possibly (?) non-enumerable-props: ${JSON.stringify(error, ["error", "details"])}`
    // debugger;
    console.log(`stringified google login error: ${errorAsString}`);
    return errorAsString;
}

// format of error from google is like:
//  details: "Cookies are not enabled in current environment."
//  error: "idpiframe_initialization_failed"
const googleLoginFailedCallback = (error: any, setGoogleLoginErrorState: React.Dispatch<React.SetStateAction<string>>) => {
    console.warn("google login failure!")
    console.error(error);
    setGoogleLoginErrorState(`${error.error}, ${error.details}`);
    const googleLoginErrorStringified = stringifyGoogleLoginError(error);
    if (String(error.error).includes("popup_blocked_by_browser")) {
        alert(`Pop up blocked by browser! Try allowing popups.`);
        Sentry.captureMessage("User browser blocked login popup.");
        return;
    }
    if (String(error.error).includes("popup_closed_by_user")) {
        alert(`Looks like you closed the signin window. Reload to try again.`);
        Sentry.captureMessage("User closed login window?");
        return;
    }
    if (String(error.error).includes("idpiframe_initialization_failed")) {
        alert(`Cookies are disabled in this environment. Google Login does not work in incognito mode, or with cookie blockers.`);
        Sentry.captureMessage("User environemnt has disabled cookies.");
        return;
    }

    if (error.isTrusted !== undefined) {
        alert(`Login failed for unexpected reason! I've been seeing this error a lot, and it's probably Google's fault. I can't fix it. Try clearing cookies if it happens again.`);
        Sentry.captureMessage(`unhandled google login error! Error object: '${String(error.error)}', '${String(error.details)}'. Full JSON of error object: ${googleLoginErrorStringified}`);
        return;
    }
    if ((error.error === undefined) && (error.details === undefined)) {
        alert(`Login failed for unexpected reason! Error object: ${JSON.stringify(error)}. This is may be Google's fault. Try clearing cookies if it happens again.`);
        Sentry.captureMessage(`unhandled google login error! Full JSON of error object: ${googleLoginErrorStringified}`);
        return;
    }
    alert(`Login failed for unexpected reason! Error object: ${JSON.stringify(error)}. This is probably Google's fault. Try clearing cookies if it happens again.`);
    Sentry.captureMessage(`unhandled google login error! Error object, error.error: '${String(error.error)}', error.details: '${String(error.details)}'. Full JSON of error object: ${googleLoginErrorStringified}`);
}

const googleLoginFailedInIdentityServicesCallback = (setGoogleLoginErrorState: React.Dispatch<React.SetStateAction<string>>) => {
    console.warn("google login failure!")
    setGoogleLoginErrorState(`Login failed. Google Identity Services does not give details, sadly.`);
    alert("Login failed!");
}


const googleLogoutSuccessCallback = (dispatch: AppDispatch) => {
    console.warn("logged out via google.");
    
    logout().then((response) => {
        if (response.errors !== undefined) {
            console.log(`Logging out failed: ${formatErrors(response.errors)}`);
            Sentry.captureMessage(`Logging out failed: ${formatErrors(response.errors)}. Rest of response: ${JSON.stringify(response)}`);
            // debugger;
            alert(`Logging out failed: ${formatErrors(response.errors)}. This issue has been reported.`)
            return;
        }
        else {
            console.log("successfully logged out of server!");
            // debugger;
            console.log("TODO: some kind of memory leak here, on setUsername. It must dispatch an update here.");
            debugger;
            dispatch(setUsername(''));
            dispatch(setGoogleProfile(null));
            // dispatch(setGoogleAuthResponse(null));
            googleLogout(); // google.accounts.id.disableAutoSelect();
            alert("Logged out. Page will reload.");
            window.location.reload();
            // debugger;
        }
    }).catch((error) => {
        console.log(`Network error logging out.`);
        Sentry.captureException(error);
        alert(`Encountered a network error while logging out. Reload the page and try again. Stringified error: ${JSON.stringify(error)}`);
    })
}

// export interface LoginContainerProps {
// }

export const useLoginApiKey = () => {
    const aapeeEyeKeyErrorState = useSelector(selectAaaPeeeEyeKeyErrorState);
    const loginAaaPeeEyeKey = useSelector(selectLoginAaaPeeEyeKey);
    const dispatch = useDispatch();

    useEffect(() => {
        if (loginAaaPeeEyeKey !== '') {
            return;
        }
        getGoogleLoginClientAaaPeeeEyeKey().then((key: string) => {
            console.log("got login api key");
            dispatch(setLoginAaaPeeEyeKey(key));
        }).catch((error) => {
            debugger;
            dispatch(setAaaPeeEyeKeyErrorState(error.message));
        });

    }, [dispatch, loginAaaPeeEyeKey, aapeeEyeKeyErrorState])

    return;
}

const GSIState = () => {
    const gsiSciptLoadState = useSelector(selectGSIScriptLoadState);
    if (gsiSciptLoadState === GSIScriptLoadStates.Error) {
        return (
            <>
                Failed to load Google Identity Services scripts/libraries.
            </>
        )
    }
    if (gsiSciptLoadState === GSIScriptLoadStates.NoneOrNotLoadedYet) {
        return (
            <>
                Loading Google Identity Services Libraries...
            </>
        )
    }
    return null;

}

function dumpPromptMomentNotificationState(promptMomentNotification: PromptMomentNotification): void {
    console.log(`one tap state: ----`)
    console.log(`\tone tap isDismissedMoment: ${promptMomentNotification.isDismissedMoment()}`);
    console.log(`\tone tap isDisplayed: ${promptMomentNotification.isDisplayMoment()}`);
    console.log(`\tone tap isNotDisplayed: ${promptMomentNotification.isNotDisplayed()}`);
    console.log(`\tone tap isSkippedMoment: ${promptMomentNotification.isSkippedMoment()}`);
    console.log(`\tone tap isDismissedMoment: ${promptMomentNotification.isDismissedMoment()}`);
    console.log(`\tone tap getMomentType: ${promptMomentNotification.getMomentType()}`);
    console.log(`\tone tap getDismissedReason: ${promptMomentNotification.getDismissedReason()}`);
    console.log(`\tone tap getSkippedReason: ${promptMomentNotification.getSkippedReason()}`);
    console.log(`\tone tap getNotDisplayedReason: ${promptMomentNotification.getNotDisplayedReason()}`);
}

function checkErrors(promptMomentNotification: PromptMomentNotificationResults, dispatch: AppDispatch) {
    switch (promptMomentNotification.notDisplayedReason) {
        case 'browser_not_supported':
            if (isTwitterAppBrowser()) {
                dispatch(setGoogleOneTapErrorState(`Twitter/"X" browser may not support google one tap login. Open in your browser if you have issues.`));
                break;
            }
            if (isMobileFacebookBrowser()) {
                dispatch(setGoogleOneTapErrorState(`Facebook browser may not support google one tap login. Open in your browser.`));
                break;
            }
            if (isAhrefsbot()) {
                console.log("You cause so many issues, fuck off lmao");
                break;
            }
            Sentry.captureMessage(`one tap notDisplayedReason: browser_not_supported!`);
            dispatch(setGoogleOneTapErrorState(`Your browser does not support google one tap login.`));
            break;
        case 'invalid_client':
            Sentry.captureMessage(`one tap notDisplayedReason: invalid_client!`);
            dispatch(setGoogleOneTapErrorState(`invalid google one tap client, this issue has been reported.`));
            break;
        case 'missing_client_id':
            Sentry.captureMessage(`one tap notDisplayedReason: missing_client_id!`);
            dispatch(setGoogleOneTapErrorState(`invalid google one tap client ID, this issue has been reported.`));
            break;
        case 'opt_out_or_no_session':
            // Sentry.captureMessage(`one tap notDisplayedReason: opt_out_or_no_session!`);
            break;
        case 'secure_http_required':
            Sentry.captureMessage(`one tap notDisplayedReason: secure_http_required!`);
            dispatch(setGoogleOneTapErrorState(`Google one tap login does not work from an unencrypted connection. https required.`));
            break;
        case 'suppressed_by_user':
            dispatch(setGoogleOneTapErrorState(''));
            break;
        case 'unregistered_origin':
            Sentry.captureMessage(`one tap notDisplayedReason: unregistered_origin!`);
            dispatch(setGoogleOneTapErrorState(`unregistered google one tap client origin, this issue has been reported.`));
            break;
        case 'unknown_reason':
            if (isMacosChrome()) {
                dispatch(setGoogleOneTapErrorState(`Some unknown issue with google one tap login, this occurs a lot on macos Chrome for some unknown reason.`));
                break;
            }
            Sentry.captureMessage(`one tap notDisplayedReason: unknown_reason!`);
            dispatch(setGoogleOneTapErrorState(`Some unknown issue with google one tap login, this issue has been reported.`));
            break;
        case undefined:
            dispatch(setGoogleOneTapErrorState(''));
            break;
        default:
            dispatch(setGoogleOneTapErrorState(''));
            Sentry.captureMessage(`one tap notDisplayedReason: ${promptMomentNotification.notDisplayedReason}, serialized just in case: ${JSON.stringify(promptMomentNotification.notDisplayedReason)}`);
            break;            
    }
    if (promptMomentNotification.skippedReason === 'issuing_failed') {
        Sentry.captureMessage(`one tap skippedReason: issuing_failed!`);
        dispatch(setGoogleOneTapErrorState(`google one tap login client reports issuing failed. This issue has been reported.`));
    }
}

const promptMomentNotificationListener = (promptMomentNotification: PromptMomentNotification, dispatch: AppDispatch) => {
    dumpPromptMomentNotificationState(promptMomentNotification);
    const promptMomentNotificationResults: PromptMomentNotificationResults = {
        isDisplayMoment: promptMomentNotification.isDisplayMoment(),
        isDisplayed: promptMomentNotification.isDisplayed(),
        isNotDisplayed: promptMomentNotification.isNotDisplayed(),
        notDisplayedReason: promptMomentNotification.getNotDisplayedReason(),
        isSkippedMoment: promptMomentNotification.isSkippedMoment(),
        skippedReason: promptMomentNotification.getSkippedReason(),
        isDismissedMoment: promptMomentNotification.isDismissedMoment(),
        dismissedReason: promptMomentNotification.getDismissedReason(),
        momentType: promptMomentNotification.getMomentType()
    }
    checkErrors(promptMomentNotificationResults, dispatch);

    dispatch(setPromptMomentNotificationState(promptMomentNotificationResults));
}

const OneTapState = () => {
    const googleOneTapErrorState = useSelector(selectGoogleOneTapErrorState);

    if (googleOneTapErrorState !== '') {
        debugger;
        return (
            <>
                {googleOneTapErrorState}
            </>
        );
    }
    return null;

}

export const GoogleLoginLogoutContainer = () => {
    const [googleLoginErrorState, setGoogleLoginErrorState] = useState("");
    const aapeeEyeKeyErrorState = useSelector(selectAaaPeeeEyeKeyErrorState);
    const loginAaaPeeEyeKey = useSelector(selectLoginAaaPeeEyeKey);
    const googleProfile = useSelector(selectGoogleProfile);
    
    

    const dispatch = useDispatch();
    // debugger;
    useEffect(() => {
        if (loginAaaPeeEyeKey !== '') {
            return;
        }
        getGoogleLoginClientAaaPeeeEyeKey().then((key: string) => {
            console.log("got login api key");
            dispatch(setLoginAaaPeeEyeKey(key));
        }).catch((error) => {
            debugger;
            dispatch(setAaaPeeEyeKeyErrorState(error.message));
        });

    }, [dispatch, loginAaaPeeEyeKey])

    // https://developers.google.com/identity/sign-in/web/sign-in
    if (loginAaaPeeEyeKey === '') {
        return (
            <div>
                <GSIState/>
                Loading google auth api key...
            </div>
        );
    }
    if (aapeeEyeKeyErrorState !== '') {
        return (
            <div>
                <GSIState/>
                Error loading google auth api key: {aapeeEyeKeyErrorState}
            </div>
        );
    }
    if (googleLoginErrorState !== '') {
        return (
            <div>
                <GSIState/>
                Error logging in with google: {googleLoginErrorState}
            </div>
        )
    }

    if (googleProfile !== null) {
        //   debugger;
        // console.log("rendering logout.");
        return (
            <div>
                <GSIState/>
                {/* <GoogleLogout clientId={loginAaaPeeEyeKey} onLogoutSuccess={() => googleLogoutSuccessCallback(dispatch)} /> */}
                <OneTapState/>
                <Button onClick={(event) => {googleLogoutSuccessCallback(dispatch)}}>
                    Logout of {googleProfile.email}!
                </Button>
            </div>
        )
    }
    // https://github.com/anthonyjgrove/react-google-login/blob/master/README.md
    // debugger;
    return (
        <div>
            <GSIState/>
            <OneTapState/>
            <GoogleLogin onSuccess={(response) => googleLoginSuccessCallback(response, dispatch)}
            /* onError={(error) => googleLoginFailedCallback(error, setGoogleLoginErrorState)} */
            onError={() => googleLoginFailedInIdentityServicesCallback(setGoogleLoginErrorState)}
            useOneTap auto_select promptMomentNotification={(notification) => promptMomentNotificationListener(notification, dispatch)}/>

        </div>
    )
}
