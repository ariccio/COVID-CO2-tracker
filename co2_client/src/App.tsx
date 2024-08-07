import {Route, Routes, Link, Navigate, useParams} from 'react-router-dom';
// import {ErrorBoundary, FallbackProps} from 'react-error-boundary';
import * as Sentry from "@sentry/react";
import { GoogleOAuthProvider } from '@react-oauth/google';
import { useEffect } from 'react';

// import {RootState} from './app/rootReducer';
// import {selectUsername, setUsername} from './features/login/loginSlice';
import {NavBar} from './features/nav/Nav';
import {HomePageContainer, useLoadMapsApiKey} from './features/home/HomePage';
import {Profile} from './features/profile/Profile';
// import {LoginComponent, SignupComponent} from './features/login/Login';
import {Devices, Device} from './features/devices/Devices';
// import {get_email} from './utils/Authentication';
import {DeviceModels} from './features/deviceModels/DeviceModels';
// import {Place} from './features/places/Place';
import {MoreInfo} from './features/moreInfoPage/MoreInfo';

import {placesPath, homePath, devicesPath, profilePath, deviceModelsPath, moreInfoPath, bluetoothPath, devicesPathWithParam, deviceModelsPathWithParam, placesPathWithParam, devicesPathWithCreate} from './paths/paths';

import './App.css';
import { BottomNav } from './features/nav/BottomNav';
import { BluetoothTesting } from './features/bluetooth/bluetoothDev';
import { useDispatch, useSelector } from 'react-redux';
import { GSIScriptLoadStates, selectLoginAaaPeeEyeKey, setGSIScriptLoadState } from './features/login/loginSlice';
import { ReactNode } from 'react';
import { useLoginApiKey } from './features/login/Login';
// import { defaultMapBounds, useBareFetchOfPlacesFromBackendForEarlyLoad } from './features/google/GoogleMaps';
// import { queryPlacesInBoundsFromBackendLiteral } from './utils/QueryPlacesInfo';
import { AppDispatch } from './app/store';
import { fetchJSONWithChecks } from './utils/FetchHelpers';
import { API_URL, API_V2_URL } from './utils/UrlPath';
import { Libraries, useJsApiLoader } from '@react-google-maps/api';
import { setApiLoadError, setApiLoaded } from './features/google/googleSlice';

export const GOOGLE_LIBRARIES: Libraries = ["places"];



const NotFound = () => {
  const params = useParams();
  return (
    <div>
      <h1>404 route/URL <i>&apos;/{params['*']}&apos;</i> not found.</h1>
      <Link to={'/'} className="btn btn-primary">Back to home</Link>
    </div>
  );
}


  //TODO: make this a switch router for 404 handling.
  //TODO: fix nested routes? https://reactrouter.com/docs/en/v6/getting-started/overview#nested-routes
const RoutesContainer = () =>
  <Routes>
    <Route path={homePath} element={<HomePageContainer/>}/>
    <Route path={profilePath} element={<Profile/>}/>
    <Route path={placesPathWithParam} element={<HomePageContainer/>}/>
    <Route path={deviceModelsPathWithParam} element={<DeviceModels/>}/>
    <Route path={devicesPathWithParam} element={<Device/>}/>
    <Route path={devicesPathWithCreate} element={<Devices/>}/>
    <Route path={devicesPath} element={<Devices/>}/>
    <Route path={placesPath} element={<Navigate to={homePath}/>}/>
    <Route path={deviceModelsPath} element={<DeviceModels/>}/>
    <Route path={moreInfoPath} element={<MoreInfo/>}/>
    <Route path={bluetoothPath} element={<BluetoothTesting/>}/>
    <Route path='/' element={<Navigate replace to={homePath}/>}/>
    <Route path='*' element={<NotFound/>}/>
  </Routes>

function TopLevelErrorFallback(errorData: {
  error: Error;
  componentStack: string | null;
  eventId: string | null;
  resetError(): void;
}) {

  return (
    <div>
      <h1>
        Covid CO2 tracker crashed!
      </h1>
      <p>
        Sorry, this is a bug of some kind. I missed something! If you&apos;re seeing this, the issue has probably already been automatically reported!
        <br/>
        More details:
      </p>
      <span>Error name:</span><pre>{errorData.error.name}</pre>
      <span>Error message:</span><pre>{errorData.error.message}</pre>
      <span>Error stack: (probably useless)</span> 
      <pre>
        {errorData.error.stack}
      </pre>
      <span>Sentry genereted componentStack:</span>
      <pre>
        {errorData.componentStack}
      </pre>
      <p>
        Try reloading the page in the mean time.
        If you&apos;ve encountered this error multiple times, please consider providing details.
        If you were logged in when the app crashed, I may email you when I fix it to let you know :) 
      </p>
    </div>
  );
}

const dialogOptionsForSentry = {
  title: 'Covid CO2 tracker crashed!',
  subtitle: "Sorry, this is a bug of some kind. I missed something! This issue is being automatically reported. If you'd like to help, give additional details in this form. If you've seen this error multiple times, consider providing details. Some errors are hard to debug even with telemetry!"
}

export const knownLanguages = [
  "en",
  "en-AU",
  "en-au",
  "en-CA",
  "en-ca",
  "en-gb",
  "en-GB",
  "en-SG",
  "en-US",
  "en-us",
  "es",
  "es-ES",
  "es-es",
  "fr",
  "fr-CA"
]


function checkLanguages(): void {
  console.log(`navigator.language: ${navigator.language}`);
  console.log(`navigator.languages: ${navigator.languages}`);
  if (!knownLanguages.includes(navigator.language)) {
    Sentry.captureMessage(navigator.language);
  }

  // for(let i = 0; i < navigator.languages.length; ++i) {
  // }
}

interface GoogleOAuthProviderWrapperProps {
  children: ReactNode;
}

function gsiScriptLoadSuccessCallbackHandler(dispatch: AppDispatch) {
  dispatch(setGSIScriptLoadState(GSIScriptLoadStates.Success));
}

function gsiScriptLoadFailureCallbackHandler(dispatch: AppDispatch) {
  dispatch(setGSIScriptLoadState(GSIScriptLoadStates.Error));
}

function GoogleOAuthProviderWrapper({children}: GoogleOAuthProviderWrapperProps) {
  const loginAaaPeeEyeKey = useSelector(selectLoginAaaPeeEyeKey);
  const dispatch = useDispatch();

  const _ = useLoginApiKey();
  if (loginAaaPeeEyeKey === '') {
    console.warn("No login api key yet.")
    return (
      <>
      loading login api key...
      {children}
      </>
    )
  }
  console.log(`Got api key! ${loginAaaPeeEyeKey}`);
  return (
    <>
      <GoogleOAuthProvider clientId={loginAaaPeeEyeKey} onScriptLoadSuccess={() => gsiScriptLoadSuccessCallbackHandler(dispatch)} onScriptLoadError={() => gsiScriptLoadFailureCallbackHandler(dispatch)}>
        {children}
      </GoogleOAuthProvider>
    </>
  )
}

function APIKeyReady(props: {mapsAPIKey: string} ): JSX.Element {
  const dispatch = useDispatch();
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: props.mapsAPIKey,
    libraries: GOOGLE_LIBRARIES
  })
  useEffect(() => {
    console.log(`apiLoaded: ${isLoaded}`);
    // debugger;
    dispatch(setApiLoaded(isLoaded));
  }, [isLoaded]);

  useEffect(() => {
    dispatch(setApiLoadError(loadError))
  }, [loadError]);


  return (<></>);
}

function APIKeyNotReady(): JSX.Element {
  return (<></>);

}

function MapsAPILoaderWrapper(props: {mapsAPIKey: string | null} ): JSX.Element {
  if (props.mapsAPIKey) {
    return (<><APIKeyReady mapsAPIKey={props.mapsAPIKey}/></>);
  }
  return (<><APIKeyNotReady/></>)
}



// TODO: how to display network errors? some component to render above it?
export function App(): JSX.Element {
  checkLanguages();
  const dispatch = useDispatch();

  
  const {mapsAPIKey} = useLoadMapsApiKey();



  //TODO: https://docs.sentry.io/platforms/javascript/guides/react/enriching-events/user-feedback/
  //https://docs.sentry.io/platforms/javascript/guides/react/components/errorboundary/
  return (
    <div>
      <div className="App">
        <Sentry.ErrorBoundary fallback={TopLevelErrorFallback} showDialog dialogOptions={dialogOptionsForSentry}>
         <GoogleOAuthProviderWrapper>
            <MapsAPILoaderWrapper mapsAPIKey={mapsAPIKey}/>
            <NavBar/>
            <RoutesContainer/>
            <BottomNav/>
          </GoogleOAuthProviderWrapper> 
        </Sentry.ErrorBoundary>
      </div>
    </div>
  );
}

// export default App;
