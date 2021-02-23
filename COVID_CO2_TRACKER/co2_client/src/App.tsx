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
import {CreateManufacturerOrModel} from './features/create/createManufacturerModel';
import {DeviceModels} from './features/deviceModels/DeviceModels';

import './App.css';


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
