import React from 'react';

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
import {CreateManufacturerOrModel} from './features/manufacturers/Manufacturers';
import {DeviceModels} from './features/deviceModels/DeviceModels';

import {manufacturersPath, homePath, devicesPath, profilePath, deviceModelsPath, loginPath, signupPath} from './paths/paths';

import './App.css';



const renderRedirect = () =>
  <Redirect to={homePath}/>


  
const routes = () =>
  <>
    <Route exact path={homePath} component={HomePage}/>
    <Route exact path={profilePath} component={Profile}/>
    <Route exact path={loginPath} component={LoginComponent} />
    <Route exact path={signupPath} component={SignupComponent}/>
    <Route path={manufacturersPath} component={CreateManufacturerOrModel}/>
    <Route path={devicesPath} component={Devices}/>
    <Route path={deviceModelsPath} component={DeviceModels}/>
    <Route exact path='/' render={renderRedirect}/>
  </>



// TODO: how to display network errors? some component to render above it?
function App(): JSX.Element {
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
