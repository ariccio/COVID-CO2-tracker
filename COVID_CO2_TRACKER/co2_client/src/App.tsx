import React, {useEffect} from 'react';

// import {useSelector, useDispatch} from 'react-redux';
import {Route, Redirect} from 'react-router-dom';


// import {RootState} from './app/rootReducer';
// import {selectUsername, setUsername} from './features/login/loginSlice';
import {NavBar} from './features/nav/Nav';
import {HomePage} from './features/home/HomePage';
import {Profile} from './features/profile/Profile';
import {LoginComponent, SignupComponent} from './features/login/Login';
import {Devices} from './features/devices/Devices';
//import {Signup} from './features/signup/Signup';
// import {get_email} from './utils/Authentication';
import {CreateManufacturerOrModel} from './features/create/createManufacturerModel';
import {DeviceModels} from './features/deviceModels/DeviceModels';

import {API_URL} from './utils/UrlPath';

import './App.css';


const GET_API_KEY_URL = API_URL + '/keys';

const renderRedirect = () =>
  <Redirect to='/home'/>


  
const routes = () =>
  <>
    <Route exact path='/home' component={HomePage}/>
    <Route exact path='/profile' component={Profile}/>
    <Route exact path='/login' component={LoginComponent} />
    <Route exact path='/singup' component={SignupComponent}/>
    <Route exact path='/create' component={CreateManufacturerOrModel}/>
    <Route path='/devices' component={Devices}/>
    <Route path='/devicemodels' component={DeviceModels}/>
    <Route exact path='/' render={renderRedirect}/>
  </>

const includeCreds: RequestCredentials = "include";

export function apiKeyRequestOptions(): RequestInit {
  const requestOptions = {
      method: 'get',
      credentials: includeCreds, //for httpOnly cookie
      headers: {
          'Content-Type': 'application/json'
      },
  }
  return requestOptions;
}


async function farts() {
  const requestOptions = apiKeyRequestOptions();
  const THIS_API_URL = GET_API_KEY_URL + `/${"PLACES_SCRIPT_URL_API_KEY"}`
  // const THIS_API_URL = GET_API_KEY_URL + `/1`
  console.log(THIS_API_URL);
  const rawFetchResponse: Promise<Response> = fetch(THIS_API_URL, requestOptions);
  const jsonResponse: Promise<any> = (await rawFetchResponse).json();
  const response = await jsonResponse;
  console.log(response);
  debugger;
}


function App(): JSX.Element {
  
  useEffect(() => {
    farts();
  }, []);
  return (
    <>
      <div className="App">
        <NavBar/>
        {/* <header className="App-header">
        </header> */}
        {routes()}
      </div>
    </>
  );
}

export default App;
