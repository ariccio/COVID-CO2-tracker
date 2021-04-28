/// <reference types="@types/googlemaps" />
import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import {App} from './App';
import { store } from './app/store';
import { Provider } from 'react-redux';
import {BrowserRouter} from 'react-router-dom';
import * as serviceWorker from './serviceWorker';
import * as Sentry from "@sentry/react";
import { Integrations } from "@sentry/tracing";

import reportWebVitals from './reportWebVitals';

import 'bootstrap/dist/css/bootstrap.min.css';


Sentry.init({
  dsn: "https://5c72ea76ca204179b35fa8a3eb847ab0@o584271.ingest.sentry.io/5737166",
  integrations: [new Integrations.BrowserTracing()],

  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: 0.1,
});


ReactDOM.render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();


reportWebVitals(console.log);