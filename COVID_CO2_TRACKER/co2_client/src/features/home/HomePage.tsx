import React, {FunctionComponent, useEffect, useState} from 'react';

import {getGooglePlacesScriptAPIKey, getGoogleMapsJavascriptAPIKey} from '../../utils/GoogleAPIKeys';

const loadGoogleMaps = async (callback: any) => {
    const existingScript = document.getElementById('googleMaps');
  
    if (!existingScript) {
      const script: HTMLScriptElement = document.createElement('script');
      const apiKey: string = await getGoogleMapsJavascriptAPIKey();
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.id = 'googleMaps';
      document.body.appendChild(script);
  
      script.onload = () => {
        if (callback) callback();
      };
    }
  
    if (existingScript && callback) {
      callback();
    }
  }
  

export const HomePage: FunctionComponent<{}> = (props: any) => {
    const [mapsReady, setMapsReady] = useState(false);

    useEffect(() => {
      loadGoogleMaps(() => {setMapsReady(true)});
    }, []);
  

    return (
        <>
            Welcome! nothing here yet.
            {mapsReady ? "Maps ready!" : "maps not ready!"}
        </>
    )
}