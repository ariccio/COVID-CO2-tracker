import React, {FunctionComponent, useEffect, useState} from 'react';
import {useSelector} from 'react-redux';
import {selectSelectedPlace} from '../google/googleSlice';
import {getGoogleMapsJavascriptAPIKey} from '../../utils/GoogleAPIKeys';

import {GoogleMapsContainer} from '../google/GoogleMaps';


export const HomePage: FunctionComponent<{}> = (props: any) => {
    const [mapsAPIKey, setMapsAPIKey] = useState("");
    const [errorState, setErrorState] = useState("");
    const currentPlace = useSelector(selectSelectedPlace);
    useEffect(() => {
        getGoogleMapsJavascriptAPIKey().then((key: string) => setMapsAPIKey(key)).catch((error) => {
            // debugger;
            setErrorState(error.message);
        })
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
            {currentPlace.formatted_address}
            {currentPlace.place_id}
            <a href={currentPlace.url}>{currentPlace.name}</a>
        </>
    )
}