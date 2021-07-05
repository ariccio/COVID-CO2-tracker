import React, { useState, useEffect } from 'react';
import {useDispatch} from 'react-redux';
import {useSelector} from 'react-redux';

import * as Sentry from "@sentry/browser"; // for manual error reporting.


import { GoogleMap, useJsApiLoader, Autocomplete, Marker, MarkerClusterer } from '@react-google-maps/api';
import { Button, Form } from 'react-bootstrap';


import { useTranslation } from 'react-i18next';


import {selectSelectedPlace, selectPlacesServiceStatus, autocompleteSelectedPlaceToAction, placeResultWithTranslatedType} from '../google/googleSlice';

import {setSelectedPlace, INTERESTING_FIELDS} from './googleSlice';

import {updatePlacesInfoFromBackend, queryPlacesInBoundsFromBackend} from '../../utils/QueryPlacesInfo';
import { defaultPlaceMarkers, EachPlaceFromDatabaseForMarker, placesFromDatabaseForMarker, selectPlaceMarkersFromDatabase, selectPlacesInfoErrors, selectPlacesMarkersErrors } from '../places/placesSlice';
import { setSublocationSelectedLocationID } from '../sublocationsDropdown/sublocationSlice';
import { updateOnNewPlace } from './googlePlacesServiceUtils';
import { fetchJSONWithChecks } from '../../utils/FetchHelpers';
import { userRequestOptions } from '../../utils/DefaultRequestOptions';
import { API_URL } from '../../utils/UrlPath';
import { selectUsername } from '../login/loginSlice';
import { formatErrors, withErrors } from '../../utils/ErrorObject';



//decls:
type Libraries = ("drawing" | "geometry" | "localContext" | "places" | "visualization")[];
export const GOOGLE_LIBRARIES: Libraries = ["places"];


interface APIKeyProps {
    api_key: string
}

const defaultCenter: google.maps.LatLngLiteral = {
    lat: 40.76797,
    lng: -73.9592
};

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
};

function isMobileSafari(): boolean {
    // It SEEMS like recent versions of iOS often deny permissions at the system level, and no kind of useful info tells us that.

    //Thank you stack overflow for detecting if mobile safari, which is ugly:
    //https://stackoverflow.com/a/29696509/625687
    const ua = window.navigator.userAgent;
    const iPad = ua.match(/iPad/i);
    const iPhone = ua.match(/iPhone/i);
    const iOS = ((iPad !== null) || (iPhone !== null));
    const webKit = ua.match(/Webkit/i);
    const chromeOnIOS = ua.match(/CriOS/i);
    if (iOS && (webKit !== null) && (chromeOnIOS === null)) { 
        return true;
    }
    return false;
}

const errorPositionCallback = (error: GeolocationPositionError_, geolocationInProgress: boolean, setGeolocationInProgress: React.Dispatch<React.SetStateAction<boolean>>) => {
    console.assert(geolocationInProgress);
    setGeolocationInProgress(false);

    console.log("GeolocationPositionError interface: https://w3c.github.io/geolocation-api/#position_error_interface");
    console.error(`GeolocationPositionError.code: ${error.code}, message: ${error.message}`);
    //These really are the only three, surprisingly:
    //https://source.chromium.org/chromium/chromium/src/+/master:third_party/blink/renderer/modules/geolocation/geolocation.cc;l=75;drc=1d00cb24b27d946f3061e0a81e09efed8001ad45?q=GeolocationPositionError
    //https://source.chromium.org/chromium/chromium/src/+/master:third_party/blink/renderer/modules/geolocation/geolocation_position_error.h;l=39?q=GeolocationPositionError
    //https://source.chromium.org/chromium/chromium/src/+/master:services/device/public/mojom/geoposition.mojom;l=24;drc=1d00cb24b27d946f3061e0a81e09efed8001ad45

    //... though, theoretically, a network location provider could be at fault:
    //https://source.chromium.org/chromium/chromium/src/+/master:services/device/geolocation/network_location_request.cc;l=290;drc=1d00cb24b27d946f3061e0a81e09efed8001ad45
    if (error.code === /*GeolocationPositionError.PERMISSION_DENIED*/ 1) {
        console.warn("The location acquisition process failed because the document does not have permission to use the Geolocation API.");
        if (!window.isSecureContext) {
            alert("Location permission denied by user or browser settings, and not running app from a secure (https) context. Move map manually or try reloading with an encrypted context.");
            return;
        }
        if (isMobileSafari()) {
            alert(`Location permission denied by user or browser settings. Move map manually. Some users on iOS devices seem to have disabled location services in the *system* privacy options, and Safari will not show a dialog to prompt you. Check if you have set it to "Never" in Settings -> Privacy -> Location Services -> Safari Websites. Sorry about this, but it's Apple's design decision, not mine..`);
            return;
        }
        //do nothing
        alert(`Location permission denied by user or browser settings. Move map manually. Secure context: ${window.isSecureContext}`);
        return;
    }
    else if (error.code === /*GeolocationPositionError.POSITION_UNAVAILABLE*/ 2) {
        console.error("The position of the device could not be determined. For instance, one or more of the location providers used in the location acquisition process reported an internal error that caused the process to fail entirely.");
        console.error("perusing the chromium sources suggests failed network location provider requests are one example.");
        alert("Some kind of internal error getting the position. No further information available. Move map manually. Sorry!");
        Sentry.captureMessage("GeolocationPositionError.POSITION_UNAVAILABLE");
        return;
    }
    else if (error.code === /*GeolocationPositionError.TIMEOUT*/ 3) {
        console.error("The length of time specified by the timeout property has elapsed before the implementation could successfully acquire a new GeolocationPosition object.");
        alert("Geolocation timed out. Something might be wrong with your device, or you're trying to get location in a place that you can't. Move map manually. Sorry!")
        return;
    }
    console.error(error);
    const errorMessage = `Position failed with an unhandled condition! Code: ${error.code}, message: ${error.message}`;
    alert(errorMessage);
    Sentry.captureMessage(errorMessage);
    throw new Error("never reached!");
}

const invokeBrowserGeolocation = (setCenter: React.Dispatch<React.SetStateAction<google.maps.LatLngLiteral>>, geolocationInProgress: boolean, setGeolocationInProgress: React.Dispatch<React.SetStateAction<boolean>>) => {
    if ('geolocation' in navigator) {
        const validPositionCallback = (position: /*GeolocationPosition*/ GeolocationPositionShadowType) => {
            console.assert(geolocationInProgress);
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
        alert("geolocation not available (no reason available)")
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
    console.log("TODO: weird error with maps container means zoom button might be outside of container?");

}

type autocompleteLoadType = (autocompleteEvent: google.maps.places.Autocomplete) => void;
type placeChangeType = () => void;

interface AutoCompleteRenderProps {
    autoCompleteLoad: autocompleteLoadType,
    placeChange: placeChangeType,
    map: google.maps.Map | null,
    mapLoaded: boolean
}

const formFieldSubmitHandler = (event: React.FormEvent<HTMLInputElement>) => {
    event.preventDefault();
    event.stopPropagation();
}

const formSubmitHandler = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    event.stopPropagation();
}


const RenderAutoComplete: React.FunctionComponent<AutoCompleteRenderProps> = (props) => {
    // In theory I can add another level of indirection so that this works even if maps fails.
    if (props.map === null) {
        return (<>Maps STILL loading</>);
    }
    const bounds = props.map.getBounds();
    if (bounds === undefined) {
        // throw new Error("invariant");
        console.log("no bounds yet (undefined), maps not ready yet.");
        if (props.mapLoaded) {
            console.error("hmm, we should have bounds by now.");
        }
        return (null);
    }
    if (bounds === null) {
        // throw new Error("invariant");
        console.log("no bounds yet (null), maps not ready yet.");
        if (props.mapLoaded) {
            console.error("hmm, we should have bounds by now.");
        }
        return (null);
    }

    //Warning: If you do not specify at least one field with a request, or if you omit the fields parameter from a request, ALL possible fields will be returned, and you will be billed accordingly. This applies only to Place Details requests (including Place Details requests made from the Place Autocomplete widget).
    //https://developers.google.com/maps/documentation/javascript/places-autocomplete

    return (
        <Autocomplete onLoad={props.autoCompleteLoad} onPlaceChanged={props.placeChange} bounds={bounds} fields={INTERESTING_FIELDS}>
                <Form onSubmit={formSubmitHandler}>
                    <Form.Group>
                        <Form.Control type="text" onSubmit={formFieldSubmitHandler}/>
                    </Form.Group>
                </Form>
        </Autocomplete>
    );
}

const placeChangeHandler = (autocomplete: google.maps.places.Autocomplete | null, dispatch: ReturnType<typeof useDispatch>, map: google.maps.Map<Element> | null, setCenter: React.Dispatch<React.SetStateAction<google.maps.LatLngLiteral>>, setErrorState: React.Dispatch<React.SetStateAction<string>>) => {
    if (autocomplete === null) {
        return;
    }
    // debugger;
    // https://developers.google.com/maps/documentation/javascript/reference/places-widget
    // Returns the details of the Place selected by user if the details were successfully retrieved.
    // Otherwise returns a stub Place object, with the name property set to the current value of the input field.
    const place = autocomplete.getPlace();
    console.table(place);
    if (place.place_id === undefined) {
        console.log("autocomplete likely returned a stub object, place probably not found!");
        setErrorState(`'${place.name}' not found. Try picking from dropdown list.`);
        return;
    }
    // autocomplete.
    console.log(`id: ${place.id}`);
    console.log(`place_id: ${place.place_id}`);
    console.log(`geometry.location.toString: ${place.geometry?.location.toString()}`);
    console.log(`geometry.viewport.toString: ${place.geometry?.viewport.toString()}`)
    // autocomplete.getPlace()
    // debugger;
    // const geometry = autocomplete.getPlace()
    const placeForAction = autocompleteSelectedPlaceToAction(place);
    dispatch(setSelectedPlace(placeForAction));
    if (placeForAction.place_id === undefined) {
        debugger;
        throw new Error('autocomplete place_id is undefined! Hmm.');
    }
    // dispatch(setSelectedPlaceIdString(placeForAction.place_id));
    dispatch(setSublocationSelectedLocationID(-1));
    if (map) {
        // debugger;
        const placeLocation = place.geometry;
        if (placeLocation) {
            // debugger;
            // map.setCenter(placeLocation.location)
            const loc: google.maps.LatLngLiteral = {
                lat: placeLocation.location.lat(),
                lng: placeLocation.location.lng()
            }
            setCenter(loc);
        }
    }
    const placeId = place.place_id;
    if (placeId === undefined) {
        console.log('no place to query');
        return;
    }
    setErrorState('');
    updatePlacesInfoFromBackend(placeId, dispatch);
}

// This event is fired when the user clicks on the map.
// An ApiMouseEvent with properties for the clicked location is returned unless a place icon was clicked, in which case an IconMouseEvent with a placeId is returned.
// IconMouseEvent and ApiMouseEvent are identical, except that IconMouseEvent has the placeId field.
// The event can always be treated as an ApiMouseEvent when the placeId is not important.
// The click event is not fired if a Marker or InfoWindow was clicked.
const onClickMaps = (e: google.maps.MapMouseEvent, setCenter: React.Dispatch<React.SetStateAction<google.maps.LatLngLiteral>>, dispatch: ReturnType<typeof useDispatch>, service: google.maps.places.PlacesService | null) => {
    // console.log(`dynamic type of event: ${typeof e}?`)
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
    // console.log(e);
    // dispatch(setSelectedPlaceIdString((e as any).placeId));
    const latlng: google.maps.LatLngLiteral = {
        lat: e.latLng.lat(),
        lng: e.latLng.lng()
    }
    setCenter(latlng);
    // debugger;
    updateOnNewPlace(service, dispatch, (e as any).placeId);
}

const containerStyle = {
    width: '400px',
    height: '400px'
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


function legalNoticeNote() {
    console.log("legal notice to self:");
    console.log("(a)  No Scraping. Customer will not export, extract, or otherwise scrape Google Maps Content for use outside the Services. For example, Customer will not: (i) pre-fetch, index, store, reshare, or rehost Google Maps Content outside the services; (ii) bulk download Google Maps tiles, Street View images, geocodes, directions, distance matrix results, roads information, places information, elevation values, and time zone details; (iii) copy and save business names, addresses, or user reviews; or (iv) use Google Maps Content with text-to-speech services.");
    console.log("I need to be very careful about how I store data.");
    console.log("apparently, I can keep lat/lon if I update every 30 days?");
}

function markerKey(lat: number, lng: number, index: number): string {
    return `marker-${lat}-${lng}-${index}-key`;
}

const renderEachMarker = (place: EachPlaceFromDatabaseForMarker, index: number, clusterer: /*clusterType*/ any, dispatch: ReturnType<typeof useDispatch>, service: google.maps.places.PlacesService | null) => {
    const pos: google.maps.LatLngLiteral = {
        lat: parseFloat(place.attributes.place_lat),
        lng: parseFloat(place.attributes.place_lng)
    }
    const clickHandler = (e: google.maps.MapMouseEvent) => {
        // debugger;
        // dispatch(setSelectedPlaceIdString(place.attributes.google_place_id));
        updateOnNewPlace(service, dispatch, place.attributes.google_place_id);
    }
    // debugger;
    return (
        <Marker position={pos} key={markerKey(pos.lat, pos.lng, index)} clusterer={clusterer} onClick={clickHandler}/>
    )
}

const clustererCallback = (placeMarkersFromDatabase: placesFromDatabaseForMarker, dispatch: ReturnType<typeof useDispatch>, clusterer: /*Clusterer*/ any, service: google.maps.places.PlacesService | null) => {
    console.assert(placeMarkersFromDatabase.places !== null);
    if (placeMarkersFromDatabase.places === null) {
        return null;
    }
    // debugger;
    // interface clusterType = typeof clusterer;
    return placeMarkersFromDatabase.places.map((place, index) => {return renderEachMarker(place, index, clusterer, dispatch, service)})

}

const renderMarkers = (placeMarkersFromDatabase: placesFromDatabaseForMarker, placeMarkerErrors: string, dispatch: ReturnType<typeof useDispatch>, service: google.maps.places.PlacesService | null) => {
    if (placeMarkerErrors !== '') {
        console.error("cant render markers, got errors:");
        console.error(placeMarkerErrors);
        return null;
    }
    if (placeMarkersFromDatabase === defaultPlaceMarkers) {
        // console.log("Not rendering place markers, still loading from database...");
        return null;
    }
    if (placeMarkersFromDatabase === null) {
        console.log("default state?");
        debugger;
        return null;
    }

    if (placeMarkersFromDatabase.places === null) {
        console.log("No markers.");
        return null;
    }
    // console.log(`Rendering ${placeMarkersFromDatabase.places.length} markers...`);
    return (
        <MarkerClusterer averageCenter={true} minimumClusterSize={2} maxZoom={14}>
            {(clusterer) => {
                return clustererCallback(placeMarkersFromDatabase, dispatch, clusterer, service);
            }}
        </MarkerClusterer>
    )
}

const mapOptions = options(defaultCenter);

const updateMarkers = (map: google.maps.Map<Element> | null, dispatch: ReturnType<typeof useDispatch>) => {
    if (!map) {
        console.log("no map for center yet");
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
    // console.log(`getting bounds for ne lat: ${bounds.getNorthEast().lat} ne lng: ${bounds.getNorthEast().lng()}, sw lat: ${bounds.getSouthWest().lat}, sw lng: ${bounds.getSouthWest().lng}`)
    // debugger;
    queryPlacesInBoundsFromBackend(bounds.getNorthEast(), bounds.getSouthWest(), dispatch);
}

const onMapIdle = (map: google.maps.Map<Element> | null, mapLoaded: boolean, setMapLoaded: React.Dispatch<React.SetStateAction<boolean>>, dispatch: ReturnType<typeof useDispatch>) => {
    //map onLoad isn't really ready. There are no bounds yet. Thus, autocomplete will fail to load. Wait until idle.
    if (!mapLoaded) {
        console.log("map idle callback...");
        setMapLoaded(true);
        updateMarkers(map, dispatch);
        return;
    }
    console.log("map idle callback... updating markers...")
    updateMarkers(map, dispatch);
}

const onZoomChange = (map: google.maps.Map<Element> | null, setZoomlevel: React.Dispatch<React.SetStateAction<number>>) => {
    // debugger;
    if (map) {
        setZoomlevel(map.getZoom());
    }
}

// 


const googleMapInContainer = (
    onLoad: (map: google.maps.Map) => void,
    onUnmount: (map: google.maps.Map) => void,
    map: google.maps.Map<Element> | null,
    setZoomlevel: React.Dispatch<React.SetStateAction<number>>,
    setCenter: React.Dispatch<React.SetStateAction<google.maps.LatLngLiteral>>,
    dispatch: ReturnType<typeof useDispatch>,
    mapLoaded: boolean,
    setMapLoaded: React.Dispatch<React.SetStateAction<boolean>>,
    placeMarkersFromDatabase: placesFromDatabaseForMarker,
    placeMarkerErrors: string,
    service: google.maps.places.PlacesService | null
    ) => {
    // console.log("rerender map")
    return (
        <div className="map">
            <div className="map-container">
                <GoogleMap 
                    mapContainerStyle={containerStyle}
                    onLoad={onLoad}
                    onUnmount={onUnmount}
                    options={mapOptions}
                    onZoomChanged={() => onZoomChange(map, setZoomlevel)}
                    onClick={(e: google.maps.MapMouseEvent) => {onClickMaps(e, setCenter, dispatch, service); updateMarkers(map, dispatch)}}
                    onIdle={() => onMapIdle(map, mapLoaded, setMapLoaded, dispatch)}
                    onTilesLoaded={() => updateMarkers(map, dispatch)}>
                        { /* Child components, such as markers, info windows, etc. */}
                        {renderMarkers(placeMarkersFromDatabase, placeMarkerErrors, dispatch, service)}
                </GoogleMap>
            </div>
        </div>
    );
}

const centerChange = (map: google.maps.Map<Element> | null, mapLoaded: boolean, center: google.maps.LatLngLiteral, dispatch: ReturnType<typeof useDispatch>) => {
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
    map: google.maps.Map<Element> | null,
    setCenter: React.Dispatch<React.SetStateAction<google.maps.LatLngLiteral>>,
    mapLoaded: boolean
}

const renderErrorsAutocomplete = (errorState: string) => {
    if (errorState === '') {
        return null;
    }

    return (
        <div>
            Autocomplete message: {errorState}
        </div>
    )
}

const AutocompleteElement: React.FC<AutocompleteElementProps> = (props) => {
    // debugger;
    const [autocomplete, setAutocomplete] = useState(null as google.maps.places.Autocomplete | null);
    const [errorState, setErrorState] = useState('');
    const dispatch = useDispatch();
    return (
        <div>
            {renderErrorsAutocomplete(errorState)}
            <RenderAutoComplete autoCompleteLoad={(event) => autoCompleteLoadThunk(event, setAutocomplete)} placeChange={() => placeChangeHandler(autocomplete, dispatch, props.map, props.setCenter, setErrorState)} map={props.map} mapLoaded={props.mapLoaded} />
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

const loadAndPanToLastMeasurement = (map: google.maps.Map<Element> | null) => {
    
    // debugger;
    const result = loadLastMeasurement();

    result.then((response) => {
        if (response.errors !== undefined) {
            console.warn(formatErrors(response.errors));
            return;
        }
        const loc = responseToLatLngLiteral(response);
        // debugger;
        if (loc) {
            map?.panTo(loc)
        }
        else {
            console.warn("undefined loc, can't pan map");
        }
    }).catch((reason) => {
        console.error("Failed to get last location for some reason. Failure in promise itself.")
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

export const GoogleMapsContainer: React.FunctionComponent<APIKeyProps> = (props) => {

    //TODO: streetview service?
    // https://developers.google.com/maps/documentation/javascript/streetview


    const dispatch = useDispatch();

    const [translate] = useTranslation();

    const [center, setCenter] = useState(defaultCenter);
    
    const [map, setMap] = React.useState(null as google.maps.Map | null);
    const [_zoomLevel, setZoomlevel] = useState(0);
    
    const [service, setService] = useState(null as google.maps.places.PlacesService | null);
    // const [placesServiceStatus, setPlacesServiceStatus] = useState(null as google.maps.places.PlacesServiceStatus | null);
    const placesServiceStatus = useSelector(selectPlacesServiceStatus);
    const selectedPlace = useSelector(selectSelectedPlace);
    // const selectedPlaceIdString = useSelector(selectSelectedPlaceIdString);
    const [mapLoaded, setMapLoaded] = useState(false);
    const placeMarkersFromDatabase = useSelector(selectPlaceMarkersFromDatabase);
    const placeMarkerErrors = useSelector(selectPlacesMarkersErrors);

    // const selectedPlaceInfoFromDatabase = useSelector(selectPlacesInfoFromDatabase);
    const selectedPlaceInfoFromDatabaseErrors = useSelector(selectPlacesInfoErrors);
    // const selectedPlaceExistsInDatabase = useSelector(selectPlaceExistsInDatabase);
    const username = useSelector(selectUsername);

    //Needed (for now) to update on clicking markers
    // const [selectedPlaceIdString, setSelectedPlaceIdString] = useState('');

    const [geolocationInProgress, setGeolocationInProgress] = useState(false);

    const { isLoaded, loadError } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: props.api_key,
        libraries: GOOGLE_LIBRARIES
    })

    const onLoad = React.useCallback((map: google.maps.Map) => {
        // console.log("map load")
        loadCallback(map, setMap, setService);
        // debugger;
    }, []);

    //I think in order to end the warnings here, I need to use a useCallback instead of a useEffect, to deliberatley ignore changes?

    useEffect(() => {
        if (username === '') {
            // debugger;
            return;
        }
        const selected = placeSelectedWithCoords(selectedPlace);
        if (selected) {
            map?.panTo(selected);
        }
        else {
            loadAndPanToLastMeasurement(map);
        }

    }, [username, map])

    useEffect(() => {
        centerChange(map, mapLoaded, center, dispatch)
    }, [center])

    const onUnmount = React.useCallback(function callback(map: google.maps.Map) {
        console.log("map unmount")
        setMap(null);
        setMapLoaded(false);
    }, [])


    useEffect(() => {
        console.log("set zoom")
        map?.setZoom(_zoomLevel);
        // debugger;
        // console.log(_zoomLevel);
    }, [_zoomLevel])



    useEffect(() => {
        // console.log(`service: "${service}"`);
        // console.log(`selectedPlaceIdString: "${selectedPlaceIdString}"`);
        // console.log(`selectedPlaceInfoFromDatabaseErrors: "${selectedPlaceInfoFromDatabaseErrors}"`);
        // console.log(`selectedPlaceExistsInDatabase: "${selectedPlaceExistsInDatabase}"`);
        console.log(`selectedPlace.place_id: "${selectedPlace.place_id}"`);
        // debugger;
        updateOnNewPlace(service, dispatch, selectedPlace.place_id);
    }, [service, dispatch, selectedPlaceInfoFromDatabaseErrors, selectedPlace.place_id])

    useEffect(legalNoticeNote, []);
    
    if (isLoaded) {
        return (
            <div>
                {googleMapInContainer(onLoad, onUnmount, map, setZoomlevel, setCenter, dispatch, mapLoaded, setMapLoaded, placeMarkersFromDatabase, placeMarkerErrors, service)}
                <br/>
                <AutocompleteElement map={map} setCenter={setCenter} mapLoaded={mapLoaded}/>
                <Button onClick={() => {
                    if (geolocationInProgress) {
                        return;
                    }
                    invokeBrowserGeolocation(setCenter, geolocationInProgress, setGeolocationInProgress);
                    }
                }>
                    {geolocationInProgress ? "geolocation running..." : translate('find-me')}
                </Button>
                <br/>
                {placesServiceStatus !== null ? (translate('last-query-status') + placesServiceStatus) : null}
            </div>
        );
    }
    if (loadError) {
        Sentry.captureException(loadError);
        return (
            <div>
                Google maps load failed!
                {loadError.message}
                This failure has been reported automatically.
            </div>
        );
    }
    return (
        <div>
            Google maps loading...
        </div>
    )
}
