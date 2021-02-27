import React, { useState } from 'react';
import {useDispatch} from 'react-redux';
import {useSelector} from 'react-redux';
import {selectSelectedPlace} from '../google/googleSlice';

import { GoogleMap, useJsApiLoader, Autocomplete } from '@react-google-maps/api';
import { Button, Form } from 'react-bootstrap';

import {setSelectedPlace} from './googleSlice';

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


interface CenterType {
    lat: number,
    lng: number
}
const defaultCenter: CenterType = {
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

const invokeBrowserGeolocation = (setCenter: React.Dispatch<React.SetStateAction<CenterType>>) => {
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

const loadCallback = (map: google.maps.Map, setMap: React.Dispatch<React.SetStateAction<google.maps.Map | null>>) => {
    if ((window as any).google === undefined) {
        throw new Error("window.google is undefined!")
    }
    if ((window as any).google === null) {
        throw new Error("window.google is null!")
    }
    //   debugger;
    const bounds = new (window as any).google.maps.LatLngBounds();
    map.fitBounds(bounds);
    setMap(map);
    //   map.panTo(center);
    //   map.setZoom(100);
    //   console.log("map zoom " + map.getZoom());
    //   debugger;
    console.log("maps successfully loaded!");
}

type autocompleteLoadType = (autocompleteEvent: google.maps.places.Autocomplete) => void;
type placeChangeType = () => void;

interface AutoCompleteRenderProps {
    autoCompleteLoad: autocompleteLoadType,
    placeChange: placeChangeType,
    map: google.maps.Map | null
}

const RenderAutoComplete: React.FunctionComponent<AutoCompleteRenderProps> = (props) => {
    // In theory I can add another level of indirection so that this works even if maps fails.
    if (props.map === null) {
        return (<>Maps STILL loading</>);
    }
    const bounds = props.map.getBounds();
    if (bounds === undefined) {
        // throw new Error("invariant");
        console.log("no bounds yet");
        return (null);
    }
    if (bounds === null) {
        // throw new Error("invariant");
        console.log("no bounds yet");
        return (null);
    }
    return (
        <Autocomplete onLoad={props.autoCompleteLoad} onPlaceChanged={props.placeChange} bounds={bounds}>
            <>

                <Form>
                    <Form.Group>
                        <Form.Control type="text" />
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

export const GoogleMapsContainer: React.FunctionComponent<APIKeyProps> = (props) => {
    const dispatch = useDispatch();
    const containerStyle = {
        width: '400px',
        height: '400px'
    };

    const [center, setCenter] = useState(defaultCenter);
    const { isLoaded, loadError } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: props.api_key,
        libraries: GOOGLE_LIBRARIES
    })

    const [autocomplete, setAutocomplete] = useState(null as google.maps.places.Autocomplete | null);
    const [map, setMap] = React.useState(null as google.maps.Map | null);

    const onLoad = React.useCallback((map: google.maps.Map) => {
        loadCallback(map, setMap);
    }, [])

    const onUnmount = React.useCallback(function callback(map: google.maps.Map) {
        setMap(null);
    }, [])

    const autoCompleteLoad: autocompleteLoadType = (autocompleteEvent: google.maps.places.Autocomplete) => {
        //   debugger;
        setAutocomplete(autocompleteEvent);
        console.log("autocomplete loaded!");
    }

    const placeChange = () => {
        if (autocomplete === null) {
            return;
        }
        console.log(autocomplete.getPlace())
        console.log(`id: ${autocomplete.getPlace().id}`);
        console.log(`place_id: ${autocomplete.getPlace().place_id}`);
        console.log(`geometry.location.toString: ${autocomplete.getPlace().geometry?.location.toString()}`);
        console.log(`geometry.viewport.toString: ${autocomplete.getPlace().geometry?.viewport.toString()}`)
        // autocomplete.getPlace()
        // debugger;
        dispatch(setSelectedPlace(autocomplete.getPlace()));
        if (map) {
            const placeLocation = autocomplete.getPlace().geometry;
            if (placeLocation) {
                map.setCenter(placeLocation.location)
            }
        }
    }

    const [_zoomLevel, setZoomlevel] = useState(0);
    const onZoomChange = () => {
        if (map) {
            setZoomlevel(map?.getZoom());
            // console.log("map zoom: " + map.getZoom())
        }
    }
    const options: google.maps.MapOptions = {
        //default tweaked for manhattan
        zoom: 18,
        center: center
    };

    //   if (map) {
    //       debugger;
    //     map.setZoom(1000);
    //   }

    if (isLoaded) {
        return (
            <>

                <div className="map">
                    <div className="map-container">

                        <GoogleMap mapContainerStyle={containerStyle} center={center} onLoad={onLoad} onUnmount={onUnmount} options={options} onZoomChanged={onZoomChange} >
                            { /* Child components, such as markers, info windows, etc. */}
                            <></>
                        </GoogleMap>
                    </div>

                </div>
                <RenderAutoComplete autoCompleteLoad={autoCompleteLoad} placeChange={placeChange} map={map} />
                <Button onClick={() => invokeBrowserGeolocation(setCenter)}>
                    Find me!
                </Button>
            </>
        )
    }
    else if (loadError) {
        return <>
            Google maps load failed!
            {loadError}
        </>
    }
    return (
        <>
            Google maps loading...
        </>
    )
}
