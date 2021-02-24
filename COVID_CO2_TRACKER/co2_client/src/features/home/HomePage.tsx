import React, {FunctionComponent, useEffect, useState} from 'react';
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';
import {Button} from 'react-bootstrap';

import {getGooglePlacesScriptAPIKey, getGoogleMapsJavascriptAPIKey} from '../../utils/GoogleAPIKeys';
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

interface APIKeyProps {
    api_key: string
}

type containterStyleType = {
    width: string,
    height: string
}

type centerType = {
    lat: number,
    lng: number
}

const renderMap = (containerStyle: containterStyleType, center: centerType, zoom: number, onLoad: (map: any) => void, onUnmount: (map: any) => void) =>
    <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={10} onLoad={onLoad} onUnmount={onUnmount} >
        { /* Child components, such as markers, info windows, etc. */ }
        <></>
    </GoogleMap>


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
            setCenter({lat: position.coords.latitude, lng: position.coords.longitude});
        }
        // Fun fact: https://source.chromium.org/chromium/chromium/src/+/master:third_party/blink/renderer/modules/geolocation/geolocation.cc;bpv=1;bpt=1;l=191?q=geolocation
        navigator.geolocation.getCurrentPosition(validPositionCallback, errorPositionCallback);
    }
    else {
        alert("geolocation not available (no reason available)")
    }
  }


const GoogleMapsAPIWrapper: FunctionComponent<APIKeyProps> = (props) => {
    const containerStyle = {
        width: '400px',
        height: '400px'
      };
      
      const [center, setCenter] = useState(defaultCenter);
      const { isLoaded, loadError } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: props.api_key
      })
    
      const [map, setMap] = React.useState(null);
    

      const onLoad = React.useCallback((map) => {
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
        map.panTo(center);
      }, [])
    
      const onUnmount = React.useCallback(function callback(map) {
        setMap(null)
      }, [])


      if (isLoaded) {
          return( 
              <>
                {renderMap(containerStyle, center, 10, onLoad, onUnmount)}
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


export const HomePage: FunctionComponent<{}> = (props: any) => {
    const [mapsAPIKey, setMapsAPIKey] = useState("");

    useEffect(() => {
        getGoogleMapsJavascriptAPIKey().then((key: string) => setMapsAPIKey(key))
    }, []);
  

    return (
        <>
            <h3>Welcome!</h3>
            {mapsAPIKey !== '' ? <GoogleMapsAPIWrapper api_key={mapsAPIKey}/> : "maps not ready!"}
        </>
    )
}