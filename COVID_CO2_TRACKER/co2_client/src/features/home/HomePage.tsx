import React, {FunctionComponent, useEffect, useState} from 'react';
import {getGoogleMapsJavascriptAPIKey} from '../../utils/GoogleAPIKeys';

import {GoogleMapsContainer} from '../google/GoogleMaps';


export const HomePage: FunctionComponent<{}> = (props: any) => {
    const [mapsAPIKey, setMapsAPIKey] = useState("");
    const [errorState, setErrorState] = useState("");
    useEffect(() => {
        getGoogleMapsJavascriptAPIKey().then((key: string) => setMapsAPIKey(key)).catch((error) => {
            setErrorState(error.message);
        })
        try {
        }
        catch (error) {
            console.error(error);
            debugger;
        }
    }, []);
  
    if (errorState !== '') {
        return (
            <>
                Error loading maps API key!
                <br/>
                {errorState}
            </>
        );
    }

    return (
        <>
            <h3>Welcome!</h3>
            {mapsAPIKey !== '' ? <GoogleMapsContainer api_key={mapsAPIKey}/> : "maps not ready - loading API key"}
            {errorState}
        </>
    )
}