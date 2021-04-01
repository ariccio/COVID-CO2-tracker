import React, { useState, useEffect } from 'react';
import {useDispatch} from 'react-redux';
import {useSelector} from 'react-redux';
import {selectSelectedPlace, selectPlacesServiceStatus, setPlacesServiceStatus, autocompleteSelectedPlaceToAction} from '../google/googleSlice';

import { GoogleMap, useJsApiLoader, Autocomplete, Marker, MarkerClusterer } from '@react-google-maps/api';
import { Button, Form } from 'react-bootstrap';

import {setSelectedPlace, interestingFields} from './googleSlice';

import {updatePlacesInfoFromBackend, queryPlacesInBoundsFromBackend} from '../../utils/QueryPlacesInfo';
import { defaultPlaceMarkers, EachPlaceFromDatabaseForMarker, placesFromDatabaseForMarker, selectPlaceExistsInDatabase, selectPlaceMarkersFromDatabase, selectPlacesInfoErrors, selectPlacesMarkersErrors } from '../places/placesSlice';
import { setSublocationSelectedLocationID } from '../sublocationsDropdown/sublocationSlice';

// import { getGooglePlacesScriptAPIKey } from '../../utils/GoogleAPIKeys';
// import {GeolocationPosition} from 'typescript/lib/lib.dom'


// const loadGoogleMaps = async (callback: any) => {
//     const existingScript = document.getElementById('googleMaps');

//     if (!existingScript) {
//       const script: HTMLScriptElement = document.createElement('script');
//       const apiKey: string = await getGoogleMapsJavascriptAPIKey();
//       script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
//       script.id = 'googleMaps';
//       document.body.appendChild(script);

//       script.onload = () => {
//         if (callback) callback();
//       };
//     }

//     if (existingScript && callback) {
//       callback();
//     }
//   }


//decls:
type Libraries = ("drawing" | "geometry" | "localContext" | "places" | "visualization")[];
const GOOGLE_LIBRARIES: Libraries = ["places"];
//I hate this.
// const loadGooglePlaces = async () => {
//     const existingScript = document.getElementById('googleMaps');

//     if (!existingScript) {
//         const script: HTMLScriptElement = document.createElement('script');
//         const apiKey: string = await getGooglePlacesScriptAPIKey();
//         script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
//         script.id = 'googleMaps';
//         document.body.appendChild(script);

//         script.onload = () => {
//             // if (callback) callback();
//             return;
//         };
//     }

//     // if (existingScript && callback) {
//     //   callback();
//     // return
//     // }
// }

interface APIKeyProps {
    api_key: string
}

// type containterStyleType = {
//     width: string,
//     height: string
// }

// type centerType = {
//     lat: number,
//     lng: number
// }

// const renderMap = (containerStyle: containterStyleType, center: centerType, zoom: number, onLoad: (map: any) => void, onUnmount: (map: any) => void) =>


// interface google.maps.LatLngLiteral {
//     lat: number,
//     lng: number
// }
const defaultCenter: google.maps.LatLngLiteral = {
    lat: 40.769,
    lng: -73.966
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
        console.error("perusing the chromium sources suggests failed network location provider requests are one example.")
        alert("Some kind of internal error getting the position. No further information available. Move map manually. Sorry!");
        return;
    }
    else if (error.code === /*GeolocationPositionError.TIMEOUT*/ 3) {
        console.error("The length of time specified by the timeout property has elapsed before the implementation could successfully acquire a new GeolocationPosition object.");
        alert("Geolocation timed out. Something might be wrong with your device, or you're trying to get location in a place that you can't. Move map manually. Sorry!")
        return;
    }
    console.error(error);
    alert(`Position failed with an unhandled condition! Code: ${error.code}, message: ${error.message}`);
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
        throw new Error("window.google is undefined!")
    }
    if ((window as any).google === null) {
        throw new Error("window.google is null!")
    }
    //   debugger;
    // const bounds = new (window as any).google.maps.LatLngBounds();
    // map.fitBounds(bounds);
    setMap(map);
    // console.log(`map zoom ${map.getZoom()}`)
    map.setZoom(18);
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
        <Autocomplete onLoad={(event) => props.autoCompleteLoad(event)} onPlaceChanged={props.placeChange} bounds={bounds} fields={interestingFields}>
            <>

                <Form onSubmit={(event: React.FormEvent<HTMLFormElement>) => formSubmitHandler(event)}>
                    <Form.Group>
                        <Form.Control type="text" onSubmit={(event: React.FormEvent<HTMLInputElement>) => formFieldSubmitHandler(event)}/>
                    </Form.Group>
                </Form>

                {/* <div>

            </div>
            <input type="text" placeholder="location">
            </input> */}
            </>
        </Autocomplete>
    );
}

const placeChangeHandler = (autocomplete: google.maps.places.Autocomplete | null, dispatch: ReturnType<typeof useDispatch>, map: google.maps.Map<Element> | null, setCenter: React.Dispatch<React.SetStateAction<google.maps.LatLngLiteral>>) => {
    if (autocomplete === null) {
        return;
    }
    // debugger;
    // https://developers.google.com/maps/documentation/javascript/reference/places-widget
    // Returns the details of the Place selected by user if the details were successfully retrieved.
    // Otherwise returns a stub Place object, with the name property set to the current value of the input field.
    console.log(autocomplete.getPlace());
    // autocomplete.
    console.log(`id: ${autocomplete.getPlace().id}`);
    console.log(`place_id: ${autocomplete.getPlace().place_id}`);
    console.log(`geometry.location.toString: ${autocomplete.getPlace().geometry?.location.toString()}`);
    console.log(`geometry.viewport.toString: ${autocomplete.getPlace().geometry?.viewport.toString()}`)
    // autocomplete.getPlace()
    // debugger;
    // const geometry = autocomplete.getPlace()
    dispatch(setSelectedPlace(autocompleteSelectedPlaceToAction(autocomplete.getPlace())));
    dispatch(setSublocationSelectedLocationID(-1));
    if (map) {
        // debugger;
        const placeLocation = autocomplete.getPlace().geometry;
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
    const placeId = autocomplete.getPlace().place_id;
    if (placeId === undefined) {
        console.log('no place to query');
        return;
    }
    updatePlacesInfoFromBackend(placeId, dispatch);
}

const onClickMaps = (e: google.maps.MapMouseEvent, setSelectedPlaceIdString: React.Dispatch<React.SetStateAction<string>>, setCenter: React.Dispatch<React.SetStateAction<google.maps.LatLngLiteral>>) => {
    console.log(`dynamic type of event: ${typeof e}?`)
    if ((e as any).placeId === undefined) {
        console.warn("placeId missing?");
    }
    else {
        console.log(`User clicked in google maps container on place ${(e as any).placeId}`);
        console.log(e);
        setSelectedPlaceIdString((e as any).placeId);
        const latlng: google.maps.LatLngLiteral = {
            lat: e.latLng.lat(),
            lng: e.latLng.lng()
        }
        setCenter(latlng);
        // debugger;
    }
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
    console.log("autocomplete loaded!");
}

const getDetailsCallback = (result: google.maps.places.PlaceResult, status: google.maps.places.PlacesServiceStatus, dispatch: ReturnType<typeof useDispatch>) => {
    dispatch(setPlacesServiceStatus(status));
    if (status !== google.maps.places.PlacesServiceStatus.OK) {
        console.error(`Google places query returned ${status}`);
        
        if (status === google.maps.places.PlacesServiceStatus.OVER_QUERY_LIMIT) {
            alert('Used entire budgeted google places/maps API quota! File an issue on github or contact me.');
        }
        return;
    }
    // debugger;
    // setPlacesServiceStatus(status);
    dispatch(setSelectedPlace(autocompleteSelectedPlaceToAction(result)));
    dispatch(setSublocationSelectedLocationID(-1));
    if (result.place_id === undefined) {
        console.error("missing place_id?");
        return;
    }
    // result.
    updatePlacesInfoFromBackend(result.place_id, dispatch);
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

const renderEachMarker = (place: EachPlaceFromDatabaseForMarker, index: number, clusterer: /*clusterType*/ any, setSelectedPlaceIdString: React.Dispatch<React.SetStateAction<string>>) => {
    const pos: google.maps.LatLngLiteral = {
        lat: parseFloat(place.place_lat),
        lng: parseFloat(place.place_lng)
    }
    // debugger;
    return (
        <Marker position={pos} key={markerKey(pos.lat, pos.lng, index)} clusterer={clusterer} onClick={(e: google.maps.MapMouseEvent) => {
            setSelectedPlaceIdString(place.google_place_id);
        }}/>
    )
}


const renderMarkers = (placeMarkersFromDatabase: placesFromDatabaseForMarker, placeMarkerErrors: string, setSelectedPlaceIdString: React.Dispatch<React.SetStateAction<string>>) => {
    if (placeMarkerErrors !== '') {
        console.error("cant render markers, got errors:");
        console.error(placeMarkerErrors);
        return null;
        // return (
        //     <>
        //         {placeMarkerErrors}
        //     </>
        // );
    }
    if (placeMarkersFromDatabase === defaultPlaceMarkers) {
        console.log("Not rendering place markers, still loading from database...");
        return null;
        // return (
        //     <>
        //         Loading place markers from placeMarkersFromDatabase.places..
        //     </>
        // );
    }
    if (placeMarkersFromDatabase === null) {
        console.log("default state?");
        debugger;
        return null;
    }

    if (placeMarkersFromDatabase.places === null) {
        console.log("No markers.");
        return null;
        // return (
        //     <>
        //         No markers.
        //     </>
        // );
    }
    // console.log(`Rendering ${placeMarkersFromDatabase.places.length} markers...`);
    return (
        <>
            <MarkerClusterer averageCenter={true} minimumClusterSize={2} maxZoom={14}>
                {(clusterer) => {
                    console.assert(placeMarkersFromDatabase.places !== null);
                    if (placeMarkersFromDatabase.places === null) {
                        return null;
                    }
                    // interface clusterType = typeof clusterer;
                    return placeMarkersFromDatabase.places.map((place, index) => {return renderEachMarker(place, index, clusterer, setSelectedPlaceIdString)})
                }}
            </MarkerClusterer>
            {}
        </>
    )
}

const mapOptions = options(defaultCenter);

function warnFieldMessage(): void {
    console.warn(`Warning: If you do not specify at least one field with a request, or if you omit the fields parameter from a request, ALL possible fields will be returned, and you will be billed accordingly. This applies only to Place Details requests (including Place Details requests made from the Place Autocomplete widget).`);
}

function checkInterestingFields(interestingFields: Array<string>): void {
    if (interestingFields === undefined) {
        warnFieldMessage();
    }
    if (interestingFields === null) {
        warnFieldMessage();
        return;
    }
    if (interestingFields.length === 0) {
        warnFieldMessage();
        return;
    }
    if (interestingFields[0] === null) {
        warnFieldMessage();
        return;
    }
    if (interestingFields[0].length === 0) {
        warnFieldMessage();
    }

}

function placeIdFromSelectionOrFromMarker(selectedPlaceIdString: string, selectedPlace?: string): string | null {
    if (selectedPlaceIdString !== '') {
        console.log(`Selecting place id string ${selectedPlaceIdString} from marker`);
        return selectedPlaceIdString;
    }
    if (selectedPlace !== undefined) {
        console.log(`Selecting place id string ${selectedPlace} from autocomplete`);
        return selectedPlace;
    }
    return null;
}

export const GoogleMapsContainer: React.FunctionComponent<APIKeyProps> = (props) => {

    //TODO: streetview service?
    // https://developers.google.com/maps/documentation/javascript/streetview


    const dispatch = useDispatch();
    const [center, setCenter] = useState(defaultCenter);
    const [autocomplete, setAutocomplete] = useState(null as google.maps.places.Autocomplete | null);
    const [map, setMap] = React.useState(null as google.maps.Map | null);
    const [_zoomLevel, setZoomlevel] = useState(0);
    
    const [service, setService] = useState(null as google.maps.places.PlacesService | null);
    // const [placesServiceStatus, setPlacesServiceStatus] = useState(null as google.maps.places.PlacesServiceStatus | null);
    const placesServiceStatus = useSelector(selectPlacesServiceStatus);
    const selectedPlace = useSelector(selectSelectedPlace);
    const [mapLoaded, setMapLoaded] = useState(false);
    const placeMarkersFromDatabase = useSelector(selectPlaceMarkersFromDatabase);
    const placeMarkerErrors = useSelector(selectPlacesMarkersErrors);

    // const selectedPlaceInfoFromDatabase = useSelector(selectPlacesInfoFromDatabase);
    const selectedPlaceInfoFromDatabaseErrors = useSelector(selectPlacesInfoErrors);
    const selectedPlaceExistsInDatabase = useSelector(selectPlaceExistsInDatabase);


    //Needed (for now) to update on clicking markers
    const [selectedPlaceIdString, setSelectedPlaceIdString] = useState('');

    const [geolocationInProgress, setGeolocationInProgress] = useState(false);

    const { isLoaded, loadError } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: props.api_key,
        libraries: GOOGLE_LIBRARIES
    })

    const onLoad = React.useCallback((map: google.maps.Map) => {
        loadCallback(map, setMap, setService);
        // debugger;
    }, []);

    // useEffect(() => {
    //     setMapLoaded(true);
    // }, [map])

    useEffect(() => {
        if (!map) {
            console.log("map falsy, not setting center");
            return;
        }
        if (!mapLoaded) {
            console.log("map not loaded, not setting center");
            return;
        }
        console.log(`center changed ${center}`);
        map.setCenter(center);
        updateMarkers();
    }, [center])

    const onUnmount = React.useCallback(function callback(map: google.maps.Map) {
        setMap(null);
        setMapLoaded(false);
    }, [])

    const onZoomChange = () => {
        if (map) {
            setZoomlevel(map.getZoom());
        }
    }

    useEffect(() => {
        map?.setZoom(_zoomLevel);
        // debugger;
        // console.log(_zoomLevel);
    }, [_zoomLevel])

    const onMapIdle = () => {
        //map onLoad isn't really ready. There are no bounds yet. Thus, autocomplete will fail to load. Wait until idle.
        if (!mapLoaded) {
            console.log("map idle callback...")
            setMapLoaded(true);
            updateMarkers()
        }
    }

    useEffect(() => {
        if (service === null) {
            // debugger;
            console.log("places service not ready yet");
            return;
        }
        if (selectedPlace.place_id === undefined) {
            console.log("no placeId from autocomplete yet.");
            // return;
        }
        if (selectedPlace.place_id === null) {
            // debugger;
            console.warn("place_id is null from autocomplete?");
            return;
        }

        if (selectedPlaceIdString !== '') {
            // debugger;
        }
        checkInterestingFields(interestingFields);
        // debugger;
        //

        const placeIDForRequest = placeIdFromSelectionOrFromMarker(selectedPlaceIdString, selectedPlace.place_id);
        if (placeIDForRequest === null) {
            console.log("no place id from either source.");
            return;
        }
        const request: google.maps.places.PlaceDetailsRequest = {
            placeId: placeIDForRequest,
            fields: interestingFields
        } 
        const detailsCallbackThunk = (result: google.maps.places.PlaceResult, status: google.maps.places.PlacesServiceStatus) => {
            getDetailsCallback(result, status, dispatch);
        }
        service.getDetails(request, detailsCallbackThunk);
        

    }, [service, selectedPlaceIdString, dispatch, selectedPlaceInfoFromDatabaseErrors, selectedPlaceExistsInDatabase, selectedPlace.place_id])

    useEffect(legalNoticeNote, []);
    const updateMarkers = () => {
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
    
    const googleMapInContainer = () => {
        // console.log("rerender map")
        return (
            <div className="map">
                <div className="map-container">
                    <GoogleMap mapContainerStyle={containerStyle} onLoad={onLoad} onUnmount={onUnmount} options={mapOptions} onZoomChanged={onZoomChange} onClick={(e: google.maps.MapMouseEvent) => {onClickMaps(e, setSelectedPlaceIdString, setCenter); updateMarkers()}} onIdle={onMapIdle} onTilesLoaded={() => updateMarkers()}>
                        { /* Child components, such as markers, info windows, etc. */}
                        {renderMarkers(placeMarkersFromDatabase, placeMarkerErrors, setSelectedPlaceIdString)}
                    </GoogleMap>
                </div>
            </div>
        );
    }

    const autocompleteElement = () => {
        // debugger;
        return (
            <RenderAutoComplete autoCompleteLoad={(event) => autoCompleteLoadThunk(event, setAutocomplete)} placeChange={() => placeChangeHandler(autocomplete, dispatch, map, setCenter)} map={map} mapLoaded={mapLoaded} />
        );
    }

    

    if (isLoaded) {
        return (
            <>
                {googleMapInContainer()}
                <br/>
                {autocompleteElement()}
                <Button onClick={() => {
                    if (geolocationInProgress) {
                        return;
                    }
                    invokeBrowserGeolocation(setCenter, geolocationInProgress, setGeolocationInProgress);
                    }
                }>
                    {geolocationInProgress ? "geolocation running..." : "Find me!"}
                </Button>
                <br/>
                {placesServiceStatus !== null ? `Last google places query status: ${placesServiceStatus}` : null}
            </>
        );
    }
    if (loadError) {
        return (
            <>
                Google maps load failed!
                {loadError}
            </>
        );
    }
    return (
        <>
            Google maps loading...
        </>
    )
}
