import React, { useEffect } from 'react';
import {useSelector, useDispatch} from 'react-redux';

// import {RootState} from './app/rootReducer';
import {selectUsername, setUsername} from './features/login/loginSlice';
import { Counter } from './features/counter/Counter';
import {Login, LoginFormType} from './features/login/Login';
import {Logout} from './features/login/Logout';
//import {Signup} from './features/signup/Signup';
import {get_email} from './utils/Authentication';

import './App.css';


const renderLoginSignup = (): JSX.Element => 
  <>
    Not logged in!

    Login:
    <Login formType={LoginFormType.Login}/>

    Signup:
    <Login formType={LoginFormType.Signup}/>
  </>

function loginOrSignupMaybe(username: string): JSX.Element {
  if (username === '') {
    return renderLoginSignup();
  }
  else {
    return (
      <>
      You're logged in as {username}!
      <Logout/>
      </>
    )
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
    <div className="App">
      <header className="App-header">
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        <span>
          {loginOrSignupMaybe(username)}
        </span>
      </header>
    </div>
  );
}

export default App;
