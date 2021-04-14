import React from 'react';

// import {useSelector, useDispatch} from 'react-redux';
import {Route, Redirect} from 'react-router-dom';
// import {Button} from 'react-bootstrap';

// import {RootState} from './app/rootReducer';
// import {selectUsername, setUsername} from './features/login/loginSlice';
import {NavBar} from './features/nav/Nav';
import {HomePage} from './features/home/HomePage';
import {Profile} from './features/profile/Profile';
// import {LoginComponent, SignupComponent} from './features/login/Login';
import {Devices, Device} from './features/devices/Devices';
// import {get_email} from './utils/Authentication';
import {DeviceModels} from './features/deviceModels/DeviceModels';
import {Place} from './features/places/Place';

import {placesPath, homePath, devicesPath, profilePath, deviceModelsPath} from './paths/paths';

import './App.css';
import { BottomNav } from './features/nav/BottomNav';

const renderRedirect = () =>
  <Redirect to={homePath}/>


  // const notFound = () => {
  //   return (
  //     <>
  //       <h1>404 not found</h1>
  //       <Button as={Link} to={'/'}>Back to home</Button>
  //     </>
  //   );
  // }


  //TODO: make this a switch router for 404 handling.
const routes = () =>
  <>
    <Route exact path={homePath} component={HomePage}/>
    <Route exact path={profilePath} component={Profile}/>
    {/* <Route exact path={loginPath} component={LoginComponent} /> */}
    {/* <Route exact path={signupPath} component={SignupComponent}/> */}
    <Route path={`${placesPath}/:placeId`} component={Place}/>
    <Route path={`${deviceModelsPath}/:deviceModelId`} component={DeviceModels}/>
    <Route path={`${devicesPath}/:deviceId`} component={Device}/>
    <Route path={devicesPath} component={Devices}/>
    <Route exact path={placesPath} component={Place}/>
    <Route exact path={deviceModelsPath} component={DeviceModels}/>
    <Route exact path='/' render={renderRedirect}/>
    {/* <Route component={notFound}/> */}
  </>





// TODO: how to display network errors? some component to render above it?
export function App(): JSX.Element {

  return (
    <>
      <div className="App">
        {/* <LoginContainer/> */}
        <NavBar/>
        {/* <header className="App-header">
        </header> */}
        {routes()}
        <BottomNav/>
      </div>
    </>
  );
}

// export default App;
