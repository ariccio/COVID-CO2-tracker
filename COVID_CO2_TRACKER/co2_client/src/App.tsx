import React, { useEffect } from 'react';

import {BrowserRouter} from 'react-router-dom';
import {useSelector, useDispatch} from 'react-redux';


import {Nav, Navbar, NavDropdown} from 'react-bootstrap';

// import {RootState} from './app/rootReducer';
import {selectUsername, setUsername} from './features/login/loginSlice';
import {Login, LoginFormType} from './features/login/Login';
import {Logout} from './features/login/Logout';
//import {Signup} from './features/signup/Signup';
import {get_email} from './utils/Authentication';

import './App.css';


const renderLoginSignup = (): JSX.Element => 
  <>
  <NavDropdown title={"Login/signup"} id="basic-nav-dropdown">
    <Nav.Item>
      Login: <Login formType={LoginFormType.Login}/>
    </Nav.Item>
    <NavDropdown.Item>
      Signup: <Login formType={LoginFormType.Signup}/>
    </NavDropdown.Item>
    
  </NavDropdown>
    Not logged in! 
  </>

const loggedIn = (username: string) =>
  <>
  <NavDropdown title={`You're logged in as ${username}!`} id="basic-nav-dropdown">
    <NavDropdown.Item><Logout/></NavDropdown.Item>
  </NavDropdown>
  </>

function loginOrSignupMaybe(username: string): JSX.Element {
  if (username === '') {
    return renderLoginSignup();
  }
  else {
    return loggedIn(username);
  }
}


function App(): JSX.Element {
  const username = useSelector(selectUsername);
  const dispatch = useDispatch();
  useEffect(() => {
    const emailPromise = get_email();
    emailPromise.then(email => {
      if (email.errors === undefined){
        if (email.email === undefined) {
          alert("undefined response from server. Likely internal server error getting username!");
          debugger;
        }
        dispatch(setUsername(email.email));
      }
    })
  }, [dispatch]);

  return (
    <BrowserRouter>
      <Navbar>
        <Nav>
          <Navbar.Collapse className="justify-content-end" id="basic-navbar-nav">
              {loginOrSignupMaybe(username)}
          </Navbar.Collapse>
        </Nav>
      </Navbar>
      <div className="App">
        <header className="App-header">
          <p>
            Edit <code>src/App.tsx</code> and save to reload.
          </p>
          <span>
            
          </span>
        </header>
      </div>
    </BrowserRouter>
  );
}

export default App;
