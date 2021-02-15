import React, { useEffect } from 'react';

// import {useSelector, useDispatch} from 'react-redux';
import {Route, Redirect} from 'react-router-dom';


// import {RootState} from './app/rootReducer';
// import {selectUsername, setUsername} from './features/login/loginSlice';
import {NavBar} from './features/nav/Nav';
import {HomePage} from './features/home/HomePage';

//import {Signup} from './features/signup/Signup';
// import {get_email} from './utils/Authentication';

import './App.css';


const renderRedirect = () =>
  <Redirect to='/home'/>

const routes = () =>
  <>
    <Route exact path='/home' component={HomePage}/>
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
