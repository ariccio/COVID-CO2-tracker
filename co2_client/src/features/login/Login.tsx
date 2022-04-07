import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { GoogleLogin, GoogleLogout, GoogleLoginResponse, GoogleLoginResponseOffline } from 'react-google-login';

import * as Sentry from "@sentry/browser";

import { setUsername, selectGoogleProfile, selectLoginAaaPeeEyeKey, setLoginAaaPeeEyeKey, setAaaPeeEyeKeyErrorState, selectAaaPeeeEyeKeyErrorState } from './loginSlice';

import { logout } from '../../utils/Authentication';
import { fetchJSONWithChecks } from '../../utils/FetchHelpers';
import { postRequestOptions } from '../../utils/DefaultRequestOptions';
import { getGoogleLoginClientAaaPeeeEyeKey } from '../../utils/GoogleAPIKeys';

// import { profilePath } from '../../paths/paths';
import { LOGIN_URL } from '../../utils/UrlPath';

import { setGoogleAuthResponse, setGoogleProfile } from './loginSlice';
import { AppDispatch } from '../../app/store';
import { formatErrors } from '../../utils/ErrorObject';




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


const loginWithIDToken = (id_token: string) => {
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
        }
        return;

    }).catch((error) => {
        console.error(error);
        Sentry.captureException(error);
        debugger;
        return;
    })
}

const sendToServer = (response: GoogleLoginResponse) => {
    const id_token = response.getAuthResponse().id_token;
    return loginWithIDToken(id_token);
}

const googleLoginSuccessCallback = (originalResponse: GoogleLoginResponse | GoogleLoginResponseOffline, dispatch: AppDispatch) => {
    //https://developers.google.com/identity/sign-in/web/backend-auth
    // console.log(originalResponse);
    console.log("google login success!");
    if (originalResponse.code) {
        console.warn("refresh token?");
        console.warn("https://github.com/anthonyjgrove/react-google-login/blob/master/README.md: If responseType is 'code', callback will return the authorization code that can be used to retrieve a refresh token from the server.");

        debugger;
        return;
    }
    // If I dont pass a responseType, code is undefined, and thus the type is a GoogleLoginResponse.
    //https://developers.google.com/identity/sign-in/web/reference#gapiauth2authresponse
    const castedResponse = originalResponse as GoogleLoginResponse;
    
    // debugger;
    sendToServer(castedResponse).then(() => {
        console.log("successfully logged in to server, dispatching results to rest of app...");
        dispatch(setGoogleProfile(castedResponse.profileObj));
        dispatch(setGoogleAuthResponse(castedResponse.getAuthResponse()));
        dispatch(setUsername(castedResponse.profileObj.name));
        Sentry.setContext("google", {
            user_name: castedResponse.profileObj.name,
            user_email: castedResponse.profileObj.email
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
        return;
    }
    if (String(error.error).includes("popup_closed_by_user")) {
        alert(`Looks like you closed the signin window. Reload to try again.`);
        return;
    }
    if (String(error.error).includes("idpiframe_initialization_failed")) {
        alert(`Cookies are disabled in this environment. Google Login does not work in incognito mode, or with cookie blockers.`);
        return;
    }

    if (error.isTrusted !== undefined) {
        alert(`Login failed for unexpected reason! I've been seeing this error a lot, and it's probably Google's fault. I can't fix it. Try clearing cookies if it happens again.`);
        Sentry.captureMessage(`unhandled google login error! Error object: ${String(error.error) + ', ' + String(error.details)}. Full JSON of error object: ${googleLoginErrorStringified}`);
        return;
    }
    alert(`Login failed for unexpected reason! Error object: ${JSON.stringify(error)}. This is probably Google's fault. Try clearing cookies if it happens again.`);
    Sentry.captureMessage(`unhandled google login error! Error object: ${String(error.error) + ', ' + String(error.details)}. Full JSON of error object: ${googleLoginErrorStringified}`);
}

const googleLogoutSuccessCallback = (dispatch: AppDispatch) => {
    console.warn("logged out via google.");
    logout();
    console.log("TODO: some kind of memory leak here, on setUsername. It must dispatch an update here.");
    debugger;
    dispatch(setUsername(''));
    dispatch(setGoogleProfile(null));
    dispatch(setGoogleAuthResponse(null));
    alert("Logged out. Page will reload.");
    window.location.reload();
    // debugger;
}

// export interface LoginContainerProps {
// }

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
                Loading google auth api key...
            </div>
        );
    }
    if (aapeeEyeKeyErrorState !== '') {
        return (
            <div>
                Error loading google auth api key: {aapeeEyeKeyErrorState}
            </div>
        );
    }
    if (googleLoginErrorState !== '') {
        return (
            <div>
                Error logging in with google: {googleLoginErrorState}
            </div>
        )
    }
    if (googleProfile !== null) {
        //   debugger;
        // console.log("rendering logout.");
        return (
            <div>
                <GoogleLogout clientId={loginAaaPeeEyeKey} onLogoutSuccess={() => googleLogoutSuccessCallback(dispatch)} />
            </div>
        )
    }
    // https://github.com/anthonyjgrove/react-google-login/blob/master/README.md
    // debugger;
    return (
        <div>
            <GoogleLogin onRequest={() => console.log("login request starting....")} clientId={loginAaaPeeEyeKey} onSuccess={(response) => googleLoginSuccessCallback(response, dispatch)} onFailure={(error) => googleLoginFailedCallback(error, setGoogleLoginErrorState)} isSignedIn={true} />

        </div>
    )
}
