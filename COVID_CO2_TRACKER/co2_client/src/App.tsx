import React, {useEffect, useState} from 'react';

// import {useSelector, useDispatch} from 'react-redux';
import {Route, Redirect} from 'react-router-dom';

import {GoogleLogin, GoogleLogout, GoogleLoginResponse, GoogleLoginResponseOffline} from 'react-google-login';

// import {RootState} from './app/rootReducer';
// import {selectUsername, setUsername} from './features/login/loginSlice';
import {NavBar} from './features/nav/Nav';
import {HomePage} from './features/home/HomePage';
import {Profile} from './features/profile/Profile';
import {LoginComponent, SignupComponent} from './features/login/Login';
import {Devices, Device} from './features/devices/Devices';
//import {Signup} from './features/signup/Signup';
// import {get_email} from './utils/Authentication';
import {CreateManufacturerOrModel} from './features/manufacturers/Manufacturers';
import {DeviceModels} from './features/deviceModels/DeviceModels';

import {manufacturersPath, homePath, devicesPath, profilePath, deviceModelsPath, loginPath, signupPath} from './paths/paths';

import './App.css';
import { getGoogleLoginClientAPIKey } from './utils/GoogleAPIKeys';
import { postRequestOptions } from './utils/DefaultRequestOptions';
import { fetchJSONWithChecks } from './utils/FetchHelpers';
import { API_URL } from './utils/UrlPath';


const renderRedirect = () =>
  <Redirect to={homePath}/>


  
const routes = () =>
  <>
    <Route exact path={homePath} component={HomePage}/>
    <Route exact path={profilePath} component={Profile}/>
    <Route exact path={loginPath} component={LoginComponent} />
    <Route exact path={signupPath} component={SignupComponent}/>
    
    {/* TODO: manufactureres nested route for each manufacturer */}
    <Route path={manufacturersPath} component={CreateManufacturerOrModel}/>
    <Route path={`${deviceModelsPath}/:deviceModelId`} component={DeviceModels}/>
    <Route path={`${devicesPath}/:deviceId`} component={Device}/>
    <Route path={devicesPath} component={Devices}/>
    <Route path={deviceModelsPath} component={DeviceModels}/>
    <Route exact path='/' render={renderRedirect}/>
  </>

const sendIDTokenToServer = (id_token: string) => {
  const def = postRequestOptions();
  const options = {
    ...def,
    body: JSON.stringify({id_token})
  };

  const fetchFailedCallback = async (awaitedResponse: Response): Promise<any> => {
    console.error("login to server with google failed");
    debugger;
    return awaitedResponse.json();
  }

  const fetchSuccessCallback = async (awaitedResponse: Response): Promise<any> => {
    return awaitedResponse.json();
  }

  const url = (API_URL + '/google_login_token');
  const result = fetchJSONWithChecks(url, options, 200, true, fetchFailedCallback, fetchSuccessCallback) as Promise<any>;
  result.then((response) => {
    console.log(response);
    debugger;
  }).catch((error) => {
    console.error(error);
    debugger;
  })
}

const sendToServer = (response: GoogleLoginResponse | GoogleLoginResponseOffline) => {
  const id_token = (response as GoogleLoginResponse).getAuthResponse().id_token;
  sendIDTokenToServer(id_token);
}

const googleLoginSuccessCallback = (response: GoogleLoginResponse | GoogleLoginResponseOffline) => {
  //https://developers.google.com/identity/sign-in/web/backend-auth
  console.log(response);
  if (response.code) {
    debugger;
    return;
  }
  // If I dont pass a responseType, it's undefined, and thus, I ge ta GoogleLoginResponse.
  console.log((response as GoogleLoginResponse).getAuthResponse().id_token);
  sendToServer(response);

  debugger;
}

const googleLoginFailedCallback = (response: GoogleLoginResponse | GoogleLoginResponseOffline) => {
  console.log(response);
  debugger;
}

const googleLogoutSuccessCallback = () => {
  console.log("logged out via google.");
  debugger;
}

const renderLogin = (loginAPIKey: string, errorState: string) => {
  // https://developers.google.com/identity/sign-in/web/sign-in
  if (loginAPIKey === '') {
    return (
      <>
        Loading google auth api key...
      </>
    );
  }
  if (errorState !== '') {
    return (
      <>
        Error loading google auth api key: {errorState}
      </>
    );
  }
  return (
    <>
      <GoogleLogin clientId={loginAPIKey} onSuccess={googleLoginSuccessCallback} onFailure={googleLoginFailedCallback}/>
      <GoogleLogout clientId={loginAPIKey} onLogoutSuccess={googleLogoutSuccessCallback} />
    </>
  )
}


// TODO: how to display network errors? some component to render above it?
function App(): JSX.Element {
  const [loginAPIKey, setLoginAPIKey] = useState('');
  const [errorState, setErrorState] = useState("");

  useEffect(() => {
    getGoogleLoginClientAPIKey().then((key: string) => {
      setLoginAPIKey(key);
    }).catch((error) => {
      setErrorState(error.message);
    });
    
  }, [])


  return (
    <>
      <div className="App">
        {renderLogin(loginAPIKey, errorState)}
        <NavBar/>
        {/* <header className="App-header">
        </header> */}
        {routes()}
      </div>
    </>
  );
}

export default App;
