/// <reference types="@types/google.maps" />
import React from 'react';
import * as ReactDOMClient from 'react-dom/client';
import './index.css';
import {App} from './App';
import { store } from './app/store';
import { Provider } from 'react-redux';
import {BrowserRouter} from 'react-router-dom';
import * as serviceWorker from './serviceWorker';
import * as Sentry from "@sentry/react";
import { Integrations } from "@sentry/tracing";

import 'bootstrap/dist/css/bootstrap.min.css';


// import i18n (needs to be bundled ;)) 
import './i18n';


function shouldEnableSentry(): boolean {
  if (process.env.NODE_ENV === 'production') {
    return true;
  }
  console.warn(`Disabling sentry reporting for process.env.NODE_ENV === '${process.env.NODE_ENV}'!`);
  return false;
}

Sentry.init({
  dsn: "https://5c72ea76ca204179b35fa8a3eb847ab0@o584271.ingest.sentry.io/5737166",
  integrations: [new Integrations.BrowserTracing()],
  environment: process.env.NODE_ENV,
  
  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: 0.1,
  enabled: shouldEnableSentry()
});

const rootElement = document.getElementById('root');

if (rootElement === null) {
  Sentry.captureMessage("Null root? The fuck?");
  throw new Error("missing root!");
}

const root = ReactDOMClient.createRoot(rootElement);


root.render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>,
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();


