import React from 'react';
import { Counter } from './features/counter/Counter';
import {Login} from './features/login/Login';
import {Signup} from './features/signup/Signup';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <Counter />
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        <span>
          <span>Learn </span>
          <span>, </span>
          <a
            className="App-link"
            href="https://redux-toolkit.js.org/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Redux Toolkit
          </a>
        </span>
        Login:
        <Login/>

        Signup:
        <Signup/>
      </header>
    </div>
  );
}

export default App;
