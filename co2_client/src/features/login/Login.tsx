import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { GoogleLogin, GoogleLogout, GoogleLoginResponse, GoogleLoginResponseOffline } from 'react-google-login';

import * as Sentry from "@sentry/browser";

import { setUsername, selectGoogleProfile, selectLoginAPIKey, setLoginAPIKey, setAPIKeyErrorState, selectAPIKeyErrorState } from './loginSlice';

import { logout } from '../../utils/Authentication';
import { fetchJSONWithChecks } from '../../utils/FetchHelpers';
import { postRequestOptions } from '../../utils/DefaultRequestOptions';
import { getGoogleLoginClientAPIKey } from '../../utils/GoogleAPIKeys';

// import { profilePath } from '../../paths/paths';
import { API_URL } from '../../utils/UrlPath';

import { setGoogleAuthResponse, setGoogleProfile } from './loginSlice';

const LOGIN_URL = API_URL + '/auth';


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

    // const url = (API_URL + '/google_login_token');
    const result = fetchJSONWithChecks(LOGIN_URL, options, 200, true, fetchFailedCallback, fetchSuccessCallback) as Promise<any>;
    return result.then((response) => {
        // console.log(response);
        // console.log("TODO: What the heck do I do with the response here? As long as it's correct, do I even care?");
        // debugger;
        return;

    }).catch((error) => {
        console.error(error);
        return;
    })
}

const sendToServer = (response: GoogleLoginResponse) => {
    const id_token = response.getAuthResponse().id_token;
    return loginWithIDToken(id_token);
}

const googleLoginSuccessCallback = (originalResponse: GoogleLoginResponse | GoogleLoginResponseOffline, dispatch: ReturnType<typeof useDispatch>) => {
    //https://developers.google.com/identity/sign-in/web/backend-auth
    // console.log(originalResponse);
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
        dispatch(setGoogleProfile(castedResponse.profileObj));
        dispatch(setGoogleAuthResponse(castedResponse.getAuthResponse()));
        dispatch(setUsername(castedResponse.profileObj.name));

    })

    //   debugger;
}

const googleLoginFailedCallback = (error: any, setGoogleLoginErrorState: React.Dispatch<React.SetStateAction<string>>) => {
    console.error(error);
    // debugger;
    setGoogleLoginErrorState(`${error.error}, ${error.details}`);
    alert(`Login failed! ${error.details} Google login does not work in incognito mode.`);
}

const googleLogoutSuccessCallback = (dispatch: ReturnType<typeof useDispatch>) => {
    console.log("logged out via google.");
    logout();
    console.log("TODO: some kind of memory leak here, on setUsername. It must dispatch an update here.");
    debugger;
    dispatch(setUsername(''));
    dispatch(setGoogleProfile(null));
    dispatch(setGoogleAuthResponse(null));
    // debugger;
}

export interface LoginContainerProps {
}

export const GoogleLoginLogoutContainer: React.FC<LoginContainerProps> = () => {
    // const [loginAPIKey, setLoginAPIKey] = useState('');

    // const [apiKeyErrorState, setApiKeyErrorState] = useState("");
    const [googleLoginErrorState, setGoogleLoginErrorState] = useState("");
    const apiKeyErrorState = useSelector(selectAPIKeyErrorState);
    const loginAPIKey = useSelector(selectLoginAPIKey);
    const googleProfile = useSelector(selectGoogleProfile);

    const dispatch = useDispatch();
    // debugger;
    useEffect(() => {
        if (loginAPIKey !== '') {
            return;
        }
        getGoogleLoginClientAPIKey().then((key: string) => {
            dispatch(setLoginAPIKey(key));
        }).catch((error) => {
            debugger;
            dispatch(setAPIKeyErrorState(error.message));
        });
    //Only run once on purpose
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dispatch])

    // https://developers.google.com/identity/sign-in/web/sign-in
    if (loginAPIKey === '') {
        return (
            <>
                Loading google auth api key...
            </>
        );
    }
    if (apiKeyErrorState !== '') {
        return (
            <>
                Error loading google auth api key: {apiKeyErrorState}
            </>
        );
    }
    if (googleLoginErrorState !== '') {
        return (
            <>
                Error logging in with google: {googleLoginErrorState}
            </>
        )
    }
    if (googleProfile !== null) {
        //   debugger;
        return (
            <>
                <GoogleLogout clientId={loginAPIKey} onLogoutSuccess={() => googleLogoutSuccessCallback(dispatch)} />
            </>
        )
    }
    // https://github.com/anthonyjgrove/react-google-login/blob/master/README.md
    return (
        <>
            <GoogleLogin clientId={loginAPIKey} onSuccess={(response) => googleLoginSuccessCallback(response, dispatch)} onFailure={(error) => googleLoginFailedCallback(error, setGoogleLoginErrorState)} isSignedIn={true} />

        </>
    )
}
