import React, {FunctionComponent, useEffect, useState} from 'react';
import {getGooglePlacesScriptAPIKey, getGoogleMapsJavascriptAPIKey} from '../../utils/GoogleAPIKeys';

import {GoogleMapsContainer} from '../google/GoogleMaps';


export const HomePage: FunctionComponent<{}> = (props: any) => {
    const [mapsAPIKey, setMapsAPIKey] = useState("");

    useEffect(() => {
        getGoogleMapsJavascriptAPIKey().then((key: string) => setMapsAPIKey(key))
    }, []);
  

    return (
        <>
            <h3>Welcome!</h3>
            {mapsAPIKey !== '' ? <GoogleMapsContainer api_key={mapsAPIKey}/> : "maps not ready!"}
        </>
    )
}