import { useState, useEffect, SetStateAction, Dispatch } from 'react';
import {useDispatch} from 'react-redux';
import {useSelector} from 'react-redux';

import * as Sentry from "@sentry/browser"; // for manual error reporting.


import { GoogleMap, useJsApiLoader, Autocomplete, Marker, MarkerClusterer, Libraries } from '@react-google-maps/api';
import { Button, Form } from 'react-bootstrap';


import { useTranslation } from 'react-i18next';


import {selectSelectedPlace, selectPlacesServiceStatus, autocompleteSelectedPlaceToAction, placeResultWithTranslatedType, defaultCenter} from '../google/googleSlice';

import {setSelectedPlace, INTERESTING_FIELDS, setMapCenter} from './googleSlice';

import {updatePlacesInfoFromBackend, queryPlacesInBoundsFromBackend, queryPlacesInBoundsFromBackendLiteral} from '../../utils/QueryPlacesInfo';
import { defaultPlaceMarkers, EachPlaceFromDatabaseForMarker, placesFromDatabaseForMarker, selectPlaceMarkersFromDatabase, selectPlacesMarkersErrors, selectPlaceMarkersFetchInProgress, setPlaceMarkersFetchInProgress, selectPlaceMarkersFetchStartMS, selectPlaceMarkersFetchFinishMS } from '../places/placesSlice';
import { setSublocationSelectedLocationID } from '../sublocationsDropdown/sublocationSlice';
import { updatePlacesServiceDetailsOnNewPlace } from './googlePlacesServiceUtils';
import { fetchJSONWithChecks } from '../../utils/FetchHelpers';
import { userRequestOptions } from '../../utils/DefaultRequestOptions';
import { API_URL } from '../../utils/UrlPath';
import { selectUsername } from '../login/loginSlice';


import { formatErrors, withErrors } from '../../utils/ErrorObject';
import {isMobileSafari, isMobileFacebookBrowser} from '../../utils/Browsers';
import { AppDispatch } from '../../app/store';
import { NavigateFunction, useNavigate } from 'react-router-dom';
import { 
    // homePath,
    placesPath } from '../../paths/paths';
// import { setSelectedDevice } from '../deviceModels/deviceModelsSlice';


//decls:
// type Libraries = ("drawing" | "geometry" | "localContext" | "places" | "visualization")[];

export const GOOGLE_LIBRARIES: Libraries = ["places"];


interface MapsProps {
    definitely_not_an_apeeeye_key: string;
    service: google.maps.places.PlacesService | null;
    setService: Dispatch<SetStateAction<google.maps.places.PlacesService | null>>;
}


//Some dumb problem with typescript:
//   interface GeolocationPositionError {
//     readonly code: number;
//     readonly message: string;
//     readonly PERMISSION_DENIED: number;
//     readonly POSITION_UNAVAILABLE: number;
//     readonly TIMEOUT: number;
// }

interface GeolocationPositionShadowType {
    readonly coords: {
        readonly accuracy: number;
        readonly altitude: number | null;
        readonly altitudeAccuracy: number | null;
        readonly heading: number | null;
        readonly latitude: number;
        readonly longitude: number;
        readonly speed: number | null;
    }
}

interface GeolocationPositionError_ {
    readonly code: number;
    readonly message: string;
    readonly PERMISSION_DENIED: number;
    readonly POSITION_UNAVAILABLE: number;
    readonly TIMEOUT: number;
}

const USER_DENIED_GEOLOCATION_STRING = "User denied Geolocation";

function handleGeolocationPermissionDenied(error: GeolocationPositionError_) {
    if (!window.isSecureContext) {
        console.log("!window.isSecureContext");
        alert("Location permission denied by user or browser settings, and not running app from a secure (https) context. Move map manually or try reloading with an encrypted (https) context.");
        Sentry.captureMessage("GeolocationPositionError.PERMISSION_DENIED, not in a secure context?");
        return;
    }
    if (isMobileFacebookBrowser()) {
        console.log("isMobileFacebookBrowser()");
        alert(`Location permission denied by user or browser settings. Move map manually. You seem to be browsing from facebook, and my telemetry suggests facebook might block location access. If you didn't get a prompt about locaiton permissions, you can try opening in a full browser! (click the three dots at top right, then click 'Open in browser')`);

        // Note: I've seen "Location Services not available." as the error.message in facebook safari webviews.

        Sentry.captureMessage("Facebook GeolocationPositionError.PERMISSION_DENIED.");
        return;
    }
    if (isMobileSafari()) {
        console.log("isMobileSafari()");
        alert(`Location permission denied by user or browser settings. Move map manually. Some users on iOS devices seem to have disabled location services in the *system* privacy options, and Safari will not show a dialog to prompt you. Check if you have set it to "Never" in Settings -> Privacy -> Location Services -> Safari Websites. Sorry about this, but it's Apple's design decision, not mine..`);
        Sentry.captureMessage("Safari GeolocationPositionError.PERMISSION_DENIED.");
        return;
    }
    if (error.message === USER_DENIED_GEOLOCATION_STRING) {
        console.log(`error.message === '${USER_DENIED_GEOLOCATION_STRING}', user probably denied the permissions request. Nothing to do!`);
        alert(error.message);
        return;
    }
    //do nothing
    alert(`Location permission denied by user or browser settings. Move map manually. Secure context: ${window.isSecureContext} Message: ${error?.message}`);
    Sentry.captureMessage(`GeolocationPositionError.PERMISSION_DENIED, unknown reason? Message: ${error?.message} Full error: ${JSON.stringify(error)}`);

}

function handlePositionUnavailable(error: GeolocationPositionError_) {
    if (error.message.includes("application does not have sufficient geolocation permissions")) {
        alert("It looks like the browser you're using doesn't have geolocation permissions. I've seen this in my telemetry coming from the facebook browser. If you're browsing from facebook, try opening in a full browser (click the three dots at top right, then click 'Open in browser') and try again!");
        Sentry.captureMessage("GeolocationPositionError.POSITION_UNAVAILABLE - facebook browser?");
        return;    
        }
    console.error("The position of the device could not be determined. For instance, one or more of the location providers used in the location acquisition process reported an internal error that caused the process to fail entirely.");
    console.error("perusing the chromium sources suggests failed network location provider requests are one example.");
    alert(`Some kind of internal error (in your browser) getting the position. Message given by your browser: ${error.message}. Move map manually. Nothing I can do. Sorry!`);
    Sentry.captureMessage("GeolocationPositionError.POSITION_UNAVAILABLE");
}



const errorPositionCallback = (error: GeolocationPositionError_, geolocationInProgress: boolean, setGeolocationInProgress: React.Dispatch<React.SetStateAction<boolean>>) => {
    console.assert(geolocationInProgress && "geolocationInProgress");
    setGeolocationInProgress(false);
    
    const errorStr = JSON.stringify(error);
    console.log("GeolocationPositionError interface: https://w3c.github.io/geolocation-api/#position_error_interface");
    console.error(`GeolocationPositionError.code: ${error.code}, message: ${error.message}.`);
    console.error(`Full error object text as stringified JSON: ${errorStr}`);
    if (error.message !== USER_DENIED_GEOLOCATION_STRING) {
        console.log(`error.message !== userDeniedString`);
        console.log(`i.e.: '${error.message}' !== '${USER_DENIED_GEOLOCATION_STRING}'`)
    }
    //These really are the only three, surprisingly:
    //https://source.chromium.org/chromium/chromium/src/+/master:third_party/blink/renderer/modules/geolocation/geolocation.cc;l=75;drc=1d00cb24b27d946f3061e0a81e09efed8001ad45?q=GeolocationPositionError
    //https://source.chromium.org/chromium/chromium/src/+/master:third_party/blink/renderer/modules/geolocation/geolocation_position_error.h;l=39?q=GeolocationPositionError
    //https://source.chromium.org/chromium/chromium/src/+/master:services/device/public/mojom/geoposition.mojom;l=24;drc=1d00cb24b27d946f3061e0a81e09efed8001ad45

    //... though, theoretically, a network location provider could be at fault:
    //https://source.chromium.org/chromium/chromium/src/+/master:services/device/geolocation/network_location_request.cc;l=290;drc=1d00cb24b27d946f3061e0a81e09efed8001ad45
    if (error.code === /*GeolocationPositionError.PERMISSION_DENIED*/ 1) {
        console.warn("The location acquisition process failed because the document does not have permission to use the Geolocation API.");
        handleGeolocationPermissionDenied(error);
        return;
    }
    else if (error.code === /*GeolocationPositionError.POSITION_UNAVAILABLE*/ 2) {
        handlePositionUnavailable(error);
        return;
    }
    else if (error.code === /*GeolocationPositionError.TIMEOUT*/ 3) {
        console.error("The length of time specified by the timeout property has elapsed before the implementation could successfully acquire a new GeolocationPosition object.");
        alert("Geolocation timed out. Something might be wrong with your device, or you're trying to get location in a place that you can't. Move map manually. Sorry!")
        Sentry.captureMessage("GeolocationPositionError.TIMEOUT");
        return;
    }
    console.error(error);
    const errorMessage = `Position failed with an unhandled condition! Code: ${error.code}, message: ${error.message}. Full JSON of object: ${JSON.stringify(error)}`;
    alert(errorMessage);
    Sentry.captureMessage(errorMessage);
    throw new Error("never reached!");
}

const invokeBrowserGeolocation = (setCenter: React.Dispatch<React.SetStateAction<google.maps.LatLngLiteral | google.maps.LatLng>>, geolocationInProgress: boolean, setGeolocationInProgress: React.Dispatch<React.SetStateAction<boolean>>) => {
    if ('geolocation' in navigator) {
        const validPositionCallback = (position: /*GeolocationPosition*/ GeolocationPositionShadowType) => {
            // console.assert(geolocationInProgress); //Delayed/stale.
            setGeolocationInProgress(false);
            console.log("got position!");
            console.log(position);
            setCenter({ lat: position.coords.latitude, lng: position.coords.longitude });
        }
        console.log(window.isSecureContext);
        console.assert(!geolocationInProgress);
        setGeolocationInProgress(true);
        // Fun fact: https://source.chromium.org/chromium/chromium/src/+/master:third_party/blink/renderer/modules/geolocation/geolocation.cc;bpv=1;bpt=1;l=191?q=geolocation
        const errorCallback = (positionError: GeolocationPositionError_) => {
            return errorPositionCallback(positionError, geolocationInProgress, setGeolocationInProgress)
        }
        navigator.geolocation.getCurrentPosition(validPositionCallback, errorCallback, {timeout: 70_000});
    }
    else {
        alert("geolocation not available (something is broken in navigator, doesn't have geolocation?)");
        Sentry.captureMessage(`'geolocation' NOT in navigator`);
    }
}

const loadCallback = (map: google.maps.Map, setMap: React.Dispatch<React.SetStateAction<google.maps.Map | null>>, setService: React.Dispatch<React.SetStateAction<google.maps.places.PlacesService | null>>) => {
    if ((window as any).google === undefined) {
        throw new Error("window.google is undefined!");
    }
    if ((window as any).google === null) {
        throw new Error("window.google is null!");
    }
    //   debugger;
    // const bounds = new (window as any).google.maps.LatLngBounds();
    // map.fitBounds(bounds);
    if (map === null) {
        console.log("map is null on loadCallback.")
    }
    setMap(map);
    // console.log(`map zoom ${map.getZoom()}`)
    map.setZoom(15);
    //   map.panTo(center);
    //   map.setZoom(100);
    //   console.log("map zoom " + map.getZoom());
    //   debugger;
    console.log("maps successfully loaded!");
    const service = new google.maps.places.PlacesService(map);
    setService(service);

}

type autocompleteLoadType = (autocompleteEvent: google.maps.places.Autocomplete) => void;
type placeChangeType = () => void;

interface AutoCompleteRenderProps {
    autoCompleteLoad: autocompleteLoadType,
    placeChange: placeChangeType,
    map: google.maps.Map | null,
    mapLoaded: boolean,
    mapBounds: google.maps.LatLngBounds | null
}

const formFieldSubmitHandler = (event: React.FormEvent<HTMLInputElement>) => {
    event.preventDefault();
    event.stopPropagation();
}

const formSubmitHandler = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    event.stopPropagation();
    // debugger;
    try {
        console.log(`User submitted autocomplete form (hit enter with text '${(event as any).currentTarget[0].value}'?)`);
    }
    catch (e) {
        debugger;
        Sentry.captureException(e);
    }
}


const RenderAutoComplete: React.FunctionComponent<AutoCompleteRenderProps> = (props) => {
    // In theory I can add another level of indirection so that this works even if maps fails.
    if (props.map === null) {
        return (<div>Maps STILL loading</div>);
    }

    console.log(`parent-passed-bounds: ${props.mapBounds}`);

    // const bounds = props.map.getBounds();
    if (props.mapBounds === undefined) {
        // throw new Error("invariant");
        console.warn("no bounds yet (undefined), maps not ready yet.");
        if (props.mapLoaded) {
            console.error("hmm, we should have bounds by now.");
        }
        return (null);
    }
    if (props.mapBounds === null) {
        // throw new Error("invariant");
        console.log("no bounds yet (null), maps not ready yet.");
        if (props.mapLoaded) {
            console.error("hmm, we should have bounds by now.");
        }
        return (null);
    }

    // console.log(`bounds: ${props.mapBounds}`);
    
    //Warning: If you do not specify at least one field with a request, or if you omit the fields parameter from a request, ALL possible fields will be returned, and you will be billed accordingly. This applies only to Place Details requests (including Place Details requests made from the Place Autocomplete widget).
    //https://developers.google.com/maps/documentation/javascript/places-autocomplete

    return (
        <Autocomplete onLoad={props.autoCompleteLoad} onPlaceChanged={props.placeChange} bounds={props.mapBounds} fields={INTERESTING_FIELDS}>
                <Form onSubmit={formSubmitHandler}>
                    <Form.Group>
                        <Form.Control type="text" onSubmit={formFieldSubmitHandler} id={'co2trackers-places-autocomplete-form'}/>
                    </Form.Group>
                </Form>
        </Autocomplete>
    );
}

const placeChangeHandler = (autocomplete: google.maps.places.Autocomplete | null, dispatch: AppDispatch, map: google.maps.Map | null, setCenter: React.Dispatch<React.SetStateAction<google.maps.LatLngLiteral | google.maps.LatLng>>, setAutocompleteErrorState: React.Dispatch<React.SetStateAction<string>>, service: google.maps.places.PlacesService | null, navigate: NavigateFunction) => {
    if (autocomplete === null) {
        console.log("No autocomplete, but autocomplete place change handler?");
        return;
    }
    // debugger;
    // https://developers.google.com/maps/documentation/javascript/reference/places-widget
    // Returns the details of the Place selected by user if the details were successfully retrieved.
    // Otherwise returns a stub Place object, with the name property set to the current value of the input field.
    const place = autocomplete.getPlace();
    // console.table(place);
    if (place.place_id === undefined) {
        console.log("autocomplete likely returned a stub object, place probably not found!");
        setAutocompleteErrorState(`'${place.name}' not found. Try picking from dropdown list.`);
        return;
    }

    console.log(`place_id from autocomplete: ${place.place_id}`);
    logPlaceGeometry(place);

    setPlaceFromAutocompletePlace(place, dispatch);

    dispatch(setSublocationSelectedLocationID(-1));
    // console.log("Autocomplete updating map center...");
    updateMapCenter(map, place, setCenter, dispatch);
    // console.log("Autocomplete updated map center!");
    const placeId = place.place_id;
    if (placeId === undefined) {
        console.log('no place to query');
        return;
    }
    updatePlacesInfoFromBackend(placeId, dispatch);
    console.log(`Updating places service details on new place ${placeId} from autocomplete...`);
    updatePlacesServiceDetailsOnNewPlace(service, dispatch, placeId);
    setAutocompleteErrorState('');
    navigate(placesPath + `/${placeId}`)
}

// This event is fired when the user clicks on the map.
// An ApiMouseEvent with properties for the clicked location is returned unless a place icon was clicked, in which case an IconMouseEvent with a placeId is returned.
// IconMouseEvent and ApiMouseEvent are identical, except that IconMouseEvent has the placeId field.
// The event can always be treated as an ApiMouseEvent when the placeId is not important.
// The click event is not fired if a Marker or InfoWindow was clicked.
const onClickMaps = (e: google.maps.MapMouseEvent, setCenter: React.Dispatch<React.SetStateAction<google.maps.LatLngLiteral | google.maps.LatLng>>, dispatch: AppDispatch, service: google.maps.places.PlacesService | null, navigate: NavigateFunction) => {
    // console.log(`dynamic type of event: ${typeof e}?`)

    //ApiMouseEvent appears to just be an IconMouseEvent? Now we have the types for it, yay!
    // type MouseOrIconEvent = (google.maps.MapMouseEvent | google.maps.IconMouseEvent);

    if ((e as any) === undefined) {
        throw new Error("MapMouseEvent is undefined. Bug in onClickMaps.");
    }
    if ((e as any) === null) {
        throw new Error("MapMouseEvent is null. Bug in onClickMaps.");
    }
    if ((e as any).placeId === undefined) {
        console.warn("placeId missing?");
        return;
    }
    console.log(`User clicked in google maps container on place ${(e as any).placeId}`);

    if (e.latLng === null) {
        console.error("latLng is null?");
        Sentry.captureMessage("latLng found to be null somewhere it shouldn't be?");
        alert("Something is wrong with Google Maps, you clicked on a place, but Google Maps doesn't have a lat/lng for it? Try reloading.")
        return;
    }

    // console.log(e);
    // dispatch(setSelectedPlaceIdString((e as any).placeId));
    const latlng: google.maps.LatLngLiteral = {
        lat: e.latLng.lat(),
        lng: e.latLng.lng()
    }
    setCenter(latlng);
    dispatch(setMapCenter(latlng));
    // debugger;
    if (service === null) {
        console.error("Maps clicked, but service not ready yet.");
        return;
    }
    console.log("Maps clicked, updating for new place?");
    updatePlacesServiceDetailsOnNewPlace(service, dispatch, (e as any).placeId);
    
    // TODO: handle `/home/adwdawdwawfse` properly as a place?
    navigate(placesPath + `/${(e as any).placeId}`)
}

const containerStyle = {
    // width: '400px',
    // height: '400px'
    width: '100%',
    height: '75vh'
};

const options = (center: google.maps.LatLngLiteral): google.maps.MapOptions => {
    // console.log(`new options ${center}`)
    return {
        //default tweaked for manhattan
        zoom: 18,
        center: center,
        zoomControl: true
    }
};

const autoCompleteLoadThunk = (autocompleteEvent: google.maps.places.Autocomplete, setAutocomplete: React.Dispatch<React.SetStateAction<google.maps.places.Autocomplete | null>>) => {
    setAutocomplete(autocompleteEvent);
    // debugger;
    // console.log("autocomplete loaded!");
}


function setPlaceFromAutocompletePlace(place: google.maps.places.PlaceResult, dispatch: AppDispatch) {
    const placeForAction = autocompleteSelectedPlaceToAction(place);
    console.log(`Setting ${placeForAction.name} as place from autocomplete...`);
    dispatch(setSelectedPlace(placeForAction));
    if (placeForAction.place_id === undefined) {
        debugger;
        throw new Error('autocomplete place_id is undefined! Hmm.');
    }
}

function updateMapCenter(map: google.maps.Map | null, place: google.maps.places.PlaceResult, setCenter: React.Dispatch<React.SetStateAction<google.maps.LatLngLiteral | google.maps.LatLng>>, dispatch: AppDispatch) {
    if (!map) {
        debugger;
        return;
    }
    // debugger;
    const placeLocation = place.geometry;
    if (!placeLocation) {
        debugger;
        return;
    }
    // debugger;
    // map.setCenter(placeLocation.location)
    if (placeLocation.location === undefined) {
        console.warn("Can't set center because placeLocation is defined, but placeLocation.location is undefined. Huh?");
        return;
    }

    const loc: google.maps.LatLngLiteral = {
        lat: placeLocation.location.lat(),
        lng: placeLocation.location.lng()
    };
    console.log("Updating map center...");
    setCenter(loc);
    dispatch(setMapCenter(loc));
    // debugger;
}

function logPlaceGeometry(place: google.maps.places.PlaceResult) {
    if (place.geometry?.location !== undefined) {
        console.log(`geometry.location.toString: ${place.geometry?.location.toString()}`);
    }
    else {
        console.log('place.geometry.location is undefined!');
    }
    if (place.geometry?.viewport !== undefined) {
        console.log(`geometry.viewport.toString: ${place.geometry?.viewport.toString()}`);
    }
    else {
        console.log('place.geometry.viewport is undefined!');
    }
}

function legalNoticeNote() {
    console.log("legal notice to self:");
    console.log("(a)  No Scraping. Customer will not export, extract, or otherwise scrape Google Maps Content for use outside the Services. For example, Customer will not: (i) pre-fetch, index, store, reshare, or rehost Google Maps Content outside the services; (ii) bulk download Google Maps tiles, Street View images, geocodes, directions, distance matrix results, roads information, places information, elevation values, and time zone details; (iii) copy and save business names, addresses, or user reviews; or (iv) use Google Maps Content with text-to-speech services.");
    console.log("I need to be very careful about how I store data.");
    console.log("apparently, I can keep lat/lon if I update every 30 days?");
}

function markerKey(lat: number, lng: number, index: number): string {
    return `marker-${lat}-${lng}-${index}-key`;
}

const renderEachMarker = (place: EachPlaceFromDatabaseForMarker, index: number, clusterer: /*clusterType*/ any, dispatch: AppDispatch, service: google.maps.places.PlacesService | null, placesSize: number, navigate: NavigateFunction) => {
    // eslint-disable-next-line react-perf/jsx-no-new-object-as-prop
    const pos: google.maps.LatLngLiteral = {
        lat: parseFloat(place.attributes.place_lat),
        lng: parseFloat(place.attributes.place_lng)
    };
    
    const clickHandler = () => {
        // debugger;
        // dispatch(setSelectedPlaceIdString(place.attributes.google_place_id));
        if (service === null) {
            console.error("Marker clicked, but places service not ready yet.");
            return;
        }
        console.log("Marker click handler: updating on new place?");
        updatePlacesServiceDetailsOnNewPlace(service, dispatch, place.attributes.google_place_id);
        navigate(placesPath + `/${place.attributes.google_place_id}`);

    }
    // debugger;
    let noClustererRedraw = undefined;
    if (index === (placesSize - 1)) {
        // console.log("last!");
        noClustererRedraw = false;
    }
    else {
        noClustererRedraw = true;
    }

    return (
        <Marker position={pos} key={markerKey(pos.lat, pos.lng, index)} clusterer={clusterer} onClick={clickHandler} noClustererRedraw={noClustererRedraw} />
    )
}

const clustererCallback = (placeMarkersFromDatabase: placesFromDatabaseForMarker | null, dispatch: AppDispatch, clusterer: /*Clusterer*/ any, service: google.maps.places.PlacesService | null, navigate: NavigateFunction) => {
    if (placeMarkersFromDatabase === defaultPlaceMarkers) {
        console.log("Place markers unintialized.");
        console.assert(placeMarkersFromDatabase.places === null);
        return (
            <>
            </>
        );
    }

    if (placeMarkersFromDatabase === null) {
        console.warn(`apparently null place markers?`);
        return (
            <>
            </>
        );
    }

    console.assert(placeMarkersFromDatabase.places !== null);
    if (placeMarkersFromDatabase.places === null) {
        return (
            <>
            </>
        );
    }
    // debugger;
    // interface clusterType = typeof clusterer;
    const placesSize = placeMarkersFromDatabase.places.length;

    return (
        <>
            {placeMarkersFromDatabase.places.map((place, index) => {return renderEachMarker(place, index, clusterer, dispatch, service, placesSize, navigate)})}
        </>
    );
    

}

const Markers = (props: {placeMarkersFromDatabase: placesFromDatabaseForMarker | null, placeMarkerErrors: string, service: google.maps.places.PlacesService | null, navigate: NavigateFunction}) => {
    const dispatch = useDispatch();
    if (props.placeMarkersFromDatabase === null) {
        console.warn("null markers, nothing to render on map.")
        return;
    }
    if (props.placeMarkersFromDatabase === defaultPlaceMarkers) {
        console.log(`placeMarkers unitialized...`);
        console.assert(props.placeMarkersFromDatabase.places === null);
        return;
    }
    if (props.placeMarkersFromDatabase.places === undefined) {
        debugger;
        console.error(`props.placeMarkersFromDatabase.places === undefined`);
    }
    if (props.placeMarkersFromDatabase.places === null) {
        debugger;
        console.error(`props.placeMarkersFromDatabase.places === null`);
    }

    console.log(`Rendering ${props.placeMarkersFromDatabase.places?.length} markers`)
    if (props.placeMarkerErrors !== '') {
        console.error("cant render markers, got errors:");
        console.error(props.placeMarkerErrors);
        return null;
    }
    if (props.placeMarkersFromDatabase === defaultPlaceMarkers) {
        // console.log("Not rendering place markers, still loading from database...");
        return null;
    }
    if (props.placeMarkersFromDatabase === null) {
        console.log("default state?");
        debugger;
        return null;
    }

    if (props.placeMarkersFromDatabase.places === null) {
        console.log("No markers.");
        return null;
    }
    // console.log(`Rendering ${props.placeMarkersFromDatabase.places.length} markers...`);
    return (
        <MarkerClusterer averageCenter={true} minimumClusterSize={2} maxZoom={14}>
            {(clusterer) => {
                return clustererCallback(props.placeMarkersFromDatabase, dispatch, clusterer, props.service, props.navigate);
            }}
        </MarkerClusterer>
    )
}

const defaultMapOptions = options(defaultCenter);

const updateMarkers = (map: google.maps.Map | null, dispatch: AppDispatch) => {
    if (!map) {
        console.log("no map to get center from for markers yet? May occur now with concurrent React.");
        // debugger;
        return;
    }
    const center = map?.getCenter();
    if (!center) {
        console.log("no center for markers yet");
        return;
    }
    const bounds = map?.getBounds();
    if (!bounds) {
        console.warn("bounds falsy, can't query places");
        return;
    }
    // queryPlacesNearbyFromBackend(center.lat(), center.lng(), dispatch);
    // console.log(`getting bounds for ne lat: ${bounds.getNorthEast().lat()} ne lng: ${bounds.getNorthEast().lng()}, sw lat: ${bounds.getSouthWest().lat()}, sw lng: ${bounds.getSouthWest().lng()}`)
    // debugger;
    dispatch(setPlaceMarkersFetchInProgress(true));
    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();
    queryPlacesInBoundsFromBackend(ne, sw, dispatch);
}

type bounds = {
    ne: google.maps.LatLngLiteral,
    sw: google.maps.LatLngLiteral
}

export const defaultMapBounds: bounds = {
    ne: {
        lat: 40.75807564963092,
        lng: -73.97236007946778
    },
    
    sw: {
        lat: 40.775237242416054,
        lng: -73.94506592053223
    }
};


// Ugly temporary hack :)
export const useBareFetchOfPlacesFromBackendForEarlyLoad = () => {
    const dispatch = useDispatch();
    const placeMarkerErrors = useSelector(selectPlacesMarkersErrors);


    //TODO: Does this really need to be in redux?
    const placeMarkersFromDatabase = useSelector(selectPlaceMarkersFromDatabase);

    useEffect(() => {
        if (placeMarkersFromDatabase !== defaultPlaceMarkers) {
            console.log("already set.");
            return;
        }
        if (placeMarkerErrors !== '') {
            console.log("error already set.");
            return;
        }
        // dispatch(setPlaceMarkersFetchInProgress(true));
        queryPlacesInBoundsFromBackendLiteral(defaultMapBounds.ne, defaultMapBounds.sw, dispatch);
    }, [placeMarkersFromDatabase, placeMarkerErrors])

}

const onMapIdle = (map: google.maps.Map | null, mapLoaded: boolean, setMapLoaded: React.Dispatch<React.SetStateAction<boolean>>, dispatch: AppDispatch) => {
    if (map === null) {
        console.warn("null map is idle? May occur now with concurrent react.");
        // debugger;
    }
    //map onLoad isn't really ready. There are no bounds yet. Thus, autocomplete will fail to load. Wait until idle.
    if (!mapLoaded) {
        console.log("map idle callback...");
        setMapLoaded(true);
        updateMarkers(map, dispatch);
        return;
    }
    // debugger;
    // console.log("map idle callback... updating markers...")
    updateMarkers(map, dispatch);
}

// const onZoomChange = (map: google.maps.Map | null, setZoomlevel: React.Dispatch<React.SetStateAction<number>>) => {
//     // debugger;
//     if (map) {
//         const zoom = map.getZoom();
//         if (zoom !== undefined) {
//             setZoomlevel(zoom);
//             return;
//         }
//         console.error("zoom changed, but Google Maps returned undefined for the zoom level?");
//         Sentry.captureMessage("zoom changed, but Google Maps returned undefined for the zoom level?");
//         return;
//     }
//     console.log("zoom changed on a null map?");
//     // debugger;
// }

const durationFromNumbersOrNull = (placeMarkersFetchStartMS: number | null, placeMarkersFetchFinishMS: number | null): number => {
    if ((!placeMarkersFetchStartMS) || (!placeMarkersFetchFinishMS)) {
        return 0;
    }
    const duration = placeMarkersFetchFinishMS - placeMarkersFetchStartMS;
    return Math.round(duration);
}

const PlaceMarkersDataDebugText = () => {
    const placeMarkersFetchInProgres = useSelector(selectPlaceMarkersFetchInProgress);
    const placeMarkersFetchStartMS = useSelector(selectPlaceMarkersFetchStartMS);
    const placeMarkersFetchFinishMS = useSelector(selectPlaceMarkersFetchFinishMS);
    const placeMarkersFromDatabase = useSelector(selectPlaceMarkersFromDatabase);
    if (placeMarkersFetchInProgres) {
        return (
            <div>Loading places for viewport...</div>
        );
    }

    if (placeMarkersFromDatabase === defaultPlaceMarkers) {
        //Map not loaded yet.
        return null;
    }
    if (placeMarkersFromDatabase === null) {
        console.warn(`Place markers is null?!`);
        debugger;
        return (
            <>Place markers null.</>
        )
    }

    if (placeMarkersFromDatabase.places === null) {
        console.log("No markers.");
        debugger;
        return null;
    }
    const duration = durationFromNumbersOrNull(placeMarkersFetchStartMS, placeMarkersFetchFinishMS);
    return (
        <div>{placeMarkersFromDatabase.places.length} places loaded & rendered in {duration}ms.</div>
    );
}


const defaultMapOptionsWithDefaultCenterOrWithSelectedPlace = (selectedPlace: placeResultWithTranslatedType): google.maps.MapOptions => {
    const selected = placeSelectedWithCoords(selectedPlace);
    if (selected === null) {
        return defaultMapOptions;
    }
    console.log(`Using already selected place as center: ${selectedPlace.name} - ${selected.lat}, ${selected.lng}`)
    return options(selected);
}


const GoogleMapInContainer = (props: {
    onLoad: (map: google.maps.Map) => void,
    onUnmount: (map: google.maps.Map | null) => void,
    map: google.maps.Map | null,
    setCenter: React.Dispatch<React.SetStateAction<google.maps.LatLngLiteral | google.maps.LatLng>>,
    mapLoaded: boolean,
    setMapLoaded: React.Dispatch<React.SetStateAction<boolean>>,
    service: google.maps.places.PlacesService | null,
    setMapBounds: React.Dispatch<React.SetStateAction<google.maps.LatLngBounds | null>>
    }) => {
    // console.log("rerender map")
    const {setCenter} = props;
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const placeMarkerErrors = useSelector(selectPlacesMarkersErrors);


    //TODO: Does this really need to be in redux?
    const placeMarkersFromDatabase = useSelector(selectPlaceMarkersFromDatabase);
    const selectedPlace = useSelector(selectSelectedPlace);

    const [options, setOptions] = useState(defaultMapOptions);

    useEffect(() => {
        const optionsResult = defaultMapOptionsWithDefaultCenterOrWithSelectedPlace(selectedPlace);
        setOptions(optionsResult);
        if (optionsResult.center !== defaultMapOptions.center) {
            if (optionsResult.center) {
                setCenter(optionsResult.center);
            }
        }
    }, [selectedPlace, setCenter]);
    

    if (props.map === null) {
        console.log("map is null as passed to the map container function. Not loaded yet.");
        // debugger;
    }
    if (placeMarkersFromDatabase !== null) {
        if (placeMarkersFromDatabase === defaultPlaceMarkers) {
            console.log(`place markers not yet initialized...`);
        }
        else {
            if (placeMarkersFromDatabase.places === undefined) {
                debugger;
                console.error(`props.placeMarkersFromDatabase.places === undefined`);
            }
            if (placeMarkersFromDatabase.places === null) {
                debugger;
                console.error(`props.placeMarkersFromDatabase.places === null`);
            }
        }
    }
    return (
        <div className="map">
            <div className="map-container">
                <GoogleMap 
                    mapContainerStyle={containerStyle} onLoad={props.onLoad} onUnmount={props.onUnmount} options={options}
                    
                    onClick={(e: google.maps.MapMouseEvent) => {onClickMaps(e, setCenter, dispatch, props.service, navigate); updateMarkers(props.map, dispatch)}}
                    onIdle={() => onMapIdle(props.map, props.mapLoaded, props.setMapLoaded, dispatch)}
                    /*onTilesLoaded={() => {console.log("tiles loaded"); updateMarkers(map, dispatch)}}*/
                    onBoundsChanged={() => {
                        const newBounds = props.map?.getBounds();
                        if (newBounds === undefined) {
                            return;
                        }
                        props.setMapBounds(newBounds)}}
                    >
                        <Markers placeMarkersFromDatabase={placeMarkersFromDatabase} placeMarkerErrors={placeMarkerErrors} service={props.service} navigate={navigate}/>
                </GoogleMap>
            </div>
        </div>
    );
}

const centerChange = (map: google.maps.Map | null, mapLoaded: boolean, center: google.maps.LatLngLiteral | google.maps.LatLng, dispatch: AppDispatch) => {
    if (!map) {
        console.log("map falsy, not setting center");
        return;
    }
    if (!mapLoaded) {
        console.log("map not loaded, not setting center");
        return;
    }

    console.log(`center changed ${center.lat}, ${center.lng}`);
    map.setCenter(center);
    updateMarkers(map, dispatch);
}

interface AutocompleteElementProps {
    map: google.maps.Map | null,
    setCenter: React.Dispatch<React.SetStateAction<google.maps.LatLngLiteral | google.maps.LatLng>>,
    mapLoaded: boolean,
    service: google.maps.places.PlacesService | null,
    mapBounds: google.maps.LatLngBounds | null
}

const renderErrorsAutocomplete = (autocompleteErrorState: string) => {
    if (autocompleteErrorState === '') {
        return null;
    }

    return (
        <div>
            Autocomplete message: {autocompleteErrorState}
        </div>
    )
}

const AutocompleteElement: React.FC<AutocompleteElementProps> = (props) => {
    // debugger;
    const [autocomplete, setAutocomplete] = useState(null as google.maps.places.Autocomplete | null);
    const [autocompleteErrorState, setAutocompleteErrorState] = useState('');
    const dispatch = useDispatch();
    const navigate = useNavigate();
    return (
        <div>
            {renderErrorsAutocomplete(autocompleteErrorState)}
            <RenderAutoComplete autoCompleteLoad={(event) => autoCompleteLoadThunk(event, setAutocomplete)} placeChange={() => placeChangeHandler(autocomplete, dispatch, props.map, props.setCenter, setAutocompleteErrorState, props.service, navigate)} map={props.map} mapLoaded={props.mapLoaded} mapBounds={props.mapBounds} />
        </div>
    );
}

interface LastMeasurementLocation {
    place_lat: string,
    place_lng: string
}

function responseToLatLngLiteral(response: LastMeasurementLocation): google.maps.LatLngLiteral | null {
    if (response.place_lat === undefined) {
        return null;
    }
    if (response.place_lng === undefined) {
        return null;
    }
    const latlng = {
        lat: parseFloat(response.place_lat),
        lng: parseFloat(response.place_lng)
    };
    if (latlng.lat === undefined) {
        return null;
    }
    if (latlng.lng === undefined) {
        return null;
    }
    return latlng;
}

type lastMeasurementLocationResponseType = (LastMeasurementLocation & withErrors);

const fetchLastMeasurementCallback = async (awaitedResponse: Response): Promise<lastMeasurementLocationResponseType> => {
    console.log("TODO: strong type");
    // debugger;
    return awaitedResponse.json();
}
const fetchLastMeasurementCallbackFailed = async (awaitedResponse: Response): Promise<lastMeasurementLocationResponseType> => {
    return awaitedResponse.json();
}

const loadLastMeasurement = () => {
    const LAST_MEASUREMENT_URL = (API_URL + '/user_last_measurement');
    return fetchJSONWithChecks(LAST_MEASUREMENT_URL, userRequestOptions(), 200, true, fetchLastMeasurementCallbackFailed, fetchLastMeasurementCallback) as Promise<lastMeasurementLocationResponseType>;
}

const loadAndPanToLastMeasurement = (map: google.maps.Map) => {
    
    // debugger;
    const result = loadLastMeasurement();

    result.then((response) => {
        if (response.errors !== undefined) {
            console.warn(`Error loading last measurement for pan: ${formatErrors(response.errors)}`);
            return;
        }
        const loc = responseToLatLngLiteral(response);
        // debugger;
        if (loc) {
            map.panTo(loc)
        }
        else {
            console.warn("undefined loc, can't pan map");
        }
        // debugger;
        // if (response.last_device_id !== null) {
        //     dispatch(setSelectedDevice(response.last_device_id));
        // }
        // else {
        //     console.warn("Last used device missing.");
        // }
    }).catch((reason) => {
        console.error(`Failed to get last location for some reason. Failure in promise itself. More details: ${JSON.stringify(reason)}`)
    })

}

function placeSelectedWithCoords(selectedPlace: placeResultWithTranslatedType): google.maps.LatLngLiteral | null {
    // debugger;
    if (selectedPlace.geometry_translated === undefined) {
        console.log("selected place lacks geometry_translated");
        return null;
    }
    if (selectedPlace.geometry_translated.lat === undefined) {
        console.log("selected place lacks lat coords");
        return null;
    }
    if (selectedPlace.geometry_translated.lng === undefined) {
        console.log("selected place lacks lng coords");
        return null;
    }
    // debugger;
    const latlng: google.maps.LatLngLiteral = {
        lat: selectedPlace.geometry_translated?.lat,
        lng: selectedPlace.geometry_translated?.lng
    }

    return latlng;
}

const geolocationButtonClick = (geolocationInProgress: boolean, setCenter: React.Dispatch<React.SetStateAction<google.maps.LatLngLiteral | google.maps.LatLng>>, setGeolocationInProgress: React.Dispatch<React.SetStateAction<boolean>>) => {
    if (geolocationInProgress) {
        return;
    }
    invokeBrowserGeolocation(setCenter, geolocationInProgress, setGeolocationInProgress);
}

const GeolocationButton = (props: {setCenter: React.Dispatch<React.SetStateAction<google.maps.LatLngLiteral | google.maps.LatLng>>}) => {
    const [translate] = useTranslation();
    const [geolocationInProgress, setGeolocationInProgress] = useState(false);
    return (
        <Button onClick={() => {geolocationButtonClick(geolocationInProgress, props.setCenter, setGeolocationInProgress)}}>
            {geolocationInProgress ? "geolocation running..." : translate('find-me')}
        </Button>
    )
}

const handleMapUnmount = (map: google.maps.Map | null, setMap: React.Dispatch<React.SetStateAction<google.maps.Map | null>>, setMapLoaded: React.Dispatch<React.SetStateAction<boolean>>) => {
    console.log("map unmount")
    if (map === null) {
        console.error("map already null?");
    }
    setMap(null);
    setMapLoaded(false);
};

const handleMapLoaded = (map_: google.maps.Map, setMap: React.Dispatch<React.SetStateAction<google.maps.Map | null>>, setService: React.Dispatch<React.SetStateAction<google.maps.places.PlacesService | null>>) => {
    console.log("map load")
    loadCallback(map_, setMap, setService);
    // debugger;
}

const PlacesServiceStatus = () => {
    const placesServiceStatus = useSelector(selectPlacesServiceStatus);
    const [translate] = useTranslation();

    if (placesServiceStatus !== null) {
        return (
            <div>
                {(translate('last-query-status') + placesServiceStatus)}
            </div>    
        );
    }
    return (

        <div>
            Places service status null.
        </div>
    )
}


const MapsLoadError = (props: {loadError: Error}) => {
    console.warn("Google maps Load error, if you're using a headless browser or a crawler, I shake my fist at you.")
    console.warn("stringified error:")
    console.error(JSON.stringify(props.loadError))
    Sentry.captureException(props.loadError);

    //TODO: maybe I can check with a fetch or something?
    return (
        <div>
            Google maps load failed!<br/>
            Message, if any: {props.loadError.message}<br/>
            This failure has been reported automatically. There&apos;s usually not much I can do about this - something went wrong loading google libraries - but I keep track of it anyways.<br/>

            Full error object: {JSON.stringify(props.loadError)}
        </div>
    );

}

export const GoogleMapsContainer: React.FunctionComponent<MapsProps> = (props) => {

    //TODO: streetview service?
    // https://developers.google.com/maps/documentation/javascript/streetview


    const dispatch = useDispatch();

    const [center, setCenter] = useState(defaultCenter as google.maps.LatLngLiteral | google.maps.LatLng );
    const [map, setMap] = useState(null as google.maps.Map | null);
    const [mapLoaded, setMapLoaded] = useState(false);
    const [mapBounds, setMapBounds] = useState(null as (null | google.maps.LatLngBounds));

    
    const username = useSelector(selectUsername);
    //Should be useRef
    const selectedPlace = useSelector(selectSelectedPlace);
    
    // Displayed on HomePage.
    // const selectedPlaceInfoFromDatabaseErrors = useSelector(selectPlacesInfoErrors);

    // const [placesServiceStatus, setPlacesServiceStatus] = useState(null as google.maps.places.PlacesServiceStatus | null);
    // const selectedPlaceIdString = useSelector(selectSelectedPlaceIdString);
    // const selectedPlaceInfoFromDatabase = useSelector(selectPlacesInfoFromDatabase);
    // const selectedPlaceExistsInDatabase = useSelector(selectPlaceExistsInDatabase);

    //Needed (for now) to update on clicking markers
    // const [selectedPlaceIdString, setSelectedPlaceIdString] = useState('');

    const { isLoaded, loadError } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: props.definitely_not_an_apeeeye_key,
        libraries: GOOGLE_LIBRARIES
    })


    //Pan to selected place only on first load after login, should utilize a useRef for selected place.
    useEffect(() => {
        if (username === '') {
            // debugger;
            return;
        }
        //Should be useRef
        const selected = placeSelectedWithCoords(selectedPlace);
        if (selected) {
            if (map === null) {
                console.log("No map to pan yet.")
                return;
            }
            console.log("Panning to selected place")
            map.panTo(selected);
            return;
        }
        if (map) {
            console.log("loading and panning to last measurement.")
            loadAndPanToLastMeasurement(map);
            return;
        }
        console.log("No map to pan.")
    }, [username, map])


    //Pan to selected place when place was selected before loading map (like clicking back).
    // useEffect(() => {
    //     if (!mapLoaded) {
    //         return;
    //     }
    //     const selected = placeSelectedWithCoords(selectedPlace);
    //     if (selected === null) {
    //         return;
    //     }
    //     console.log(`Using already selected place as center: ${selectedPlace.name} - ${selected.lat}, ${selected.lng}`)
    //     // setCenter(selected);
    // }, [selectedPlace, mapLoaded]);

    useEffect(() => {
        centerChange(map, mapLoaded, center, dispatch)
    }, [center, map, mapLoaded, dispatch])



    // useEffect(() => {
    //     if (service?.getDetails === undefined) {
    //         console.log("service null, nothing to update...");
    //         return;
    //     }
    //     // console.log(`useEffect, updating on new place: selectedPlace.place_id: "${selectedPlace.place_id}"`);
    //     // debugger;
    //     // updateOnNewPlace(service, dispatch, selectedPlace.place_id);
    // }, [service])

    useEffect(legalNoticeNote, []);
    
    if (isLoaded) {
        
        // Dump places for debugging, ugly a.f.
        // if (placeMarkersFromDatabase.places !== null) {
        //     const copyOfPlaces = Object.assign( new Array(), placeMarkersFromDatabase.places);
        //     copyOfPlaces?.sort((a, b) => {
        //         const aid = a.id as unknown as string;
        //         const bid = b.id as unknown as string;
        //         // debugger;
        //         return ( parseInt(aid) - parseInt(bid));
        //     });
        //     console.log(copyOfPlaces);
        // }

        return (
            <div>
                <GoogleMapInContainer onLoad={(mapLoaded) => handleMapLoaded(mapLoaded, setMap, props.setService)} onUnmount={() => handleMapUnmount(map, setMap, setMapLoaded)} map={map} setCenter={setCenter} mapLoaded={mapLoaded} setMapLoaded={setMapLoaded} service={props.service} setMapBounds={setMapBounds}/>
                <PlaceMarkersDataDebugText/>
                <br/>
                <AutocompleteElement map={map} setCenter={setCenter} mapLoaded={mapLoaded} service={props.service} mapBounds={mapBounds}/>
                <GeolocationButton setCenter={setCenter} /><br/>
                <PlacesServiceStatus/>
            </div>
        );
    }
    if (loadError) {
        return (
            <MapsLoadError loadError={loadError}/>
        );
    }
    return (
        <div>
            Google maps loading...
        </div>
    );
}
