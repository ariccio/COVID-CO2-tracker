import React, { useState, useEffect } from 'react';
import {useDispatch} from 'react-redux';
import {useSelector} from 'react-redux';
import {selectSelectedPlace, selectPlacesServiceStatus, setPlacesServiceStatus} from '../google/googleSlice';

import { GoogleMap, useJsApiLoader, Autocomplete, Marker, MarkerClusterer } from '@react-google-maps/api';
import { Button, Form } from 'react-bootstrap';

import {setSelectedPlace, interestingFields} from './googleSlice';

import {updatePlacesInfoFromBackend, queryPlacesNearbyFromBackend, queryPlacesInBoundsFromBackend} from '../../utils/QueryPlacesInfo';
import { defaultPlaceMarkers, EachPlaceFromDatabaseForMarker, placesFromDatabaseForMarker, selectPlaceMarkersFromDatabase, selectPlacesMarkersErrors } from '../places/placesSlice';

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


const errorPositionCallback: PositionErrorCallback = (error: /*GeolocationPositionError*/ any) => {
    console.log("GeolocationPositionError interface: https://w3c.github.io/geolocation-api/#position_error_interface");
    //These really are the only three, surprisingly:
    //https://source.chromium.org/chromium/chromium/src/+/master:third_party/blink/renderer/modules/geolocation/geolocation.cc;l=75;drc=1d00cb24b27d946f3061e0a81e09efed8001ad45?q=GeolocationPositionError
    //https://source.chromium.org/chromium/chromium/src/+/master:third_party/blink/renderer/modules/geolocation/geolocation_position_error.h;l=39?q=GeolocationPositionError
    //https://source.chromium.org/chromium/chromium/src/+/master:services/device/public/mojom/geoposition.mojom;l=24;drc=1d00cb24b27d946f3061e0a81e09efed8001ad45

    //... though, theoretically, a network location provider could be at fault:
    //https://source.chromium.org/chromium/chromium/src/+/master:services/device/geolocation/network_location_request.cc;l=290;drc=1d00cb24b27d946f3061e0a81e09efed8001ad45
    if (error.code === /*GeolocationPositionError.PERMISSION_DENIED*/ 1) {
        //do nothing
        console.warn("The location acquisition process failed because the document does not have permission to use the Geolocation API.")
    }
    else if (error.code === /*GeolocationPositionError.POSITION_UNAVAILABLE*/ 2) {
        console.error("The position of the device could not be determined. For instance, one or more of the location providers used in the location acquisition process reported an internal error that caused the process to fail entirely.");
        console.error("perusing the chromium sources suggests failed network location provider requests are one example.")
        alert("Some kind of internal error getting the position. No further information available. Sorry!");
    }
    else if (error.code === /*GeolocationPositionError.TIMEOUT*/ 3) {
        console.error("The length of time specified by the timeout property has elapsed before the implementation could successfully acquire a new GeolocationPosition object.");
        alert("Geolocation timed out. Sorry!")
    }
    else {
        throw new Error("never reached!");
    }
    console.error(error);
    // alert(`Position failed! ${error.message}`);
}

const invokeBrowserGeolocation = (setCenter: React.Dispatch<React.SetStateAction<google.maps.LatLngLiteral>>) => {
    if ('geolocation' in navigator) {
        const validPositionCallback = (position: /*GeolocationPosition*/ GeolocationPositionShadowType) => {
            console.log("got position!");
            console.log(position);
            setCenter({ lat: position.coords.latitude, lng: position.coords.longitude });
        }
        // Fun fact: https://source.chromium.org/chromium/chromium/src/+/master:third_party/blink/renderer/modules/geolocation/geolocation.cc;bpv=1;bpt=1;l=191?q=geolocation
        navigator.geolocation.getCurrentPosition(validPositionCallback, errorPositionCallback);
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
    dispatch(setSelectedPlace(autocomplete.getPlace()));
    if (map) {
        debugger;
        const placeLocation = autocomplete.getPlace().geometry;
        if (placeLocation) {
            debugger;
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
    console.log(`new options ${center}`)
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
    dispatch(setSelectedPlace(result));
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

const renderLoadedMapsContainer = () => {
    
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
        console.log("Loading place markers from database...");
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

export const GoogleMapsContainer: React.FunctionComponent<APIKeyProps> = (props) => {

    //TODO: streetview service?
    // https://developers.google.com/maps/documentation/javascript/streetview


    const dispatch = useDispatch();
    const [center, setCenter] = useState(defaultCenter);
    const [autocomplete, setAutocomplete] = useState(null as google.maps.places.Autocomplete | null);
    const [map, setMap] = React.useState(null as google.maps.Map | null);
    const [_zoomLevel, setZoomlevel] = useState(0);
    const [selectedPlaceIdString, setSelectedPlaceIdString] = useState('');
    const [service, setService] = useState(null as google.maps.places.PlacesService | null);
    // const [placesServiceStatus, setPlacesServiceStatus] = useState(null as google.maps.places.PlacesServiceStatus | null);
    const placesServiceStatus = useSelector(selectPlacesServiceStatus);
    const selectedPlace = useSelector(selectSelectedPlace);
    const [mapLoaded, setMapLoaded] = useState(false);
    const placeMarkersFromDatabase = useSelector(selectPlaceMarkersFromDatabase);
    const placeMarkerErrors = useSelector(selectPlacesMarkersErrors);

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
            return;
        }
        if (selectedPlaceIdString === '') {
            return;
        }
        // debugger;
        //Warning: If you do not specify at least one field with a request, or if you omit the fields parameter from a request, ALL possible fields will be returned, and you will be billed accordingly. This applies only to Place Details requests (including Place Details requests made from the Place Autocomplete widget).
        const request: google.maps.places.PlaceDetailsRequest = {
            placeId: selectedPlaceIdString,
            fields: interestingFields
        } 
        const detailsCallbackThunk = (result: google.maps.places.PlaceResult, status: google.maps.places.PlacesServiceStatus) => {
            getDetailsCallback(result, status, dispatch);
        }
        service.getDetails(request, detailsCallbackThunk);
        

    }, [service, selectedPlaceIdString])

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

    const onDrag = () => {
        // updateMarkers();
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
                Selected place ID string from google maps: {selectedPlaceIdString}
                <br/>
                {autocompleteElement()}
                <Button onClick={() => invokeBrowserGeolocation(setCenter)}>
                    Find me!
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
