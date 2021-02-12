import React from 'react';
import logo from './logo.svg';
import { Counter } from './features/counter/Counter';
import {Login} from './features/login/Login';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
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
      </header>
      <Login/>
    </div>
  );
}

export default App;
