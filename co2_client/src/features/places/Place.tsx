import React, {useEffect, useRef, useState} from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {RouteComponentProps} from 'react-router-dom';
// import {useLocation} from 'react-router-dom';
import { updatePlacesInfoFromBackend } from '../../utils/QueryPlacesInfo';
import { selectPlaceExistsInDatabase, selectPlacesInfoErrors, selectPlacesInfoFromDatabase } from './placesSlice';

import {renderFromDatabaseNoGoogleParam, renderSelectedPlaceInfo} from '../home/HomePage';
import { selectMapsAPIKey, selectMapsAPIKeyErrorState, selectPlacesServiceStatus, selectSelectedPlace, setMapsAPIKey, setMapsAPIKeyErrorState } from '../google/googleSlice';
import { GOOGLE_LIBRARIES } from '../google/GoogleMaps';
import { useJsApiLoader } from '@react-google-maps/api';
import { getGoogleMapsJavascriptAPIKey } from '../../utils/GoogleAPIKeys';
import { updateOnNewPlace } from '../google/googlePlacesServiceUtils';

interface PlaceProps {
    placeId: string
}

interface PlaceDetailsProps {
    mapsAPIKey: string,
    placeId: string,
    divRef: React.MutableRefObject<HTMLDivElement | null>
}

const PlaceDetails: React.FC<PlaceDetailsProps> = (props) => {
    const [service, setService] = useState(null as google.maps.places.PlacesService | null);
    const dispatch = useDispatch();
    const placesServiceStatus = useSelector(selectPlacesServiceStatus);
    const selectedPlace = useSelector(selectSelectedPlace);

    const { isLoaded, loadError } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: props.mapsAPIKey,
        libraries: GOOGLE_LIBRARIES
    })

    useEffect(() => {
        if (props.divRef.current === null) {
            console.log("no div ref")
            return;
        }
        if (!isLoaded) {
            console.log("api not loaded yet.");
            console.log(`Load error: ${loadError}`)
            return;
        }
        const service = new google.maps.places.PlacesService(props.divRef.current);
        setService(service);
    }, [isLoaded, loadError, props.divRef])

    useEffect(() => {
        if (props.placeId === '') {
            return;
        }
        if (service === null) {
            return;
        }

        updateOnNewPlace(service, props.placeId, dispatch);    
        
    }, [dispatch, props.placeId, service])

    return (
        <>
            {renderSelectedPlaceInfo(selectedPlace, placesServiceStatus)}
        </>
    );
}
const DivElem = (props: {elementRef: React.MutableRefObject<HTMLDivElement | null>}) => {
    return (
        <div id='ghost-map' ref={props.elementRef}>
        </div>
    );
}

export const Place: React.FC<RouteComponentProps<PlaceProps>> = (props) => {
    console.log("place")
    // const location = useLocation();
    const dispatch = useDispatch();
    const selectedPlaceInfoFromDatabase = useSelector(selectPlacesInfoFromDatabase);
    const selectedPlaceInfoFromDatabaseErrors = useSelector(selectPlacesInfoErrors);
    const selectedPlaceExistsInDatabase = useSelector(selectPlaceExistsInDatabase);
    
    const mapsAPIKey = useSelector(selectMapsAPIKey);
    const mapsAPIKeyErrorState = useSelector(selectMapsAPIKeyErrorState);

    const elementRef = useRef(null as HTMLDivElement | null);
    useEffect(() => {
        if (mapsAPIKey !== '') {
            return;
        }
        getGoogleMapsJavascriptAPIKey().then((key: string) => {
            dispatch(setMapsAPIKey(key));
        }).catch((error) => {
            dispatch(setMapsAPIKeyErrorState(error.message));
        });
    }, [dispatch, mapsAPIKey]);



    useEffect(() => {
        if (props.match.params.placeId === undefined) {
            return;
        }
        if (props.match.params.placeId === '') {
            return;
        }
        updatePlacesInfoFromBackend(props.match.params.placeId, dispatch);
    }, [dispatch, props.match.params.placeId]);

    if (props.match.params.placeId === undefined) {
        return (
            <>
                <DivElem elementRef={elementRef}/>
                No place selected.
            </>
        )
    }

    if (props.match.params.placeId === '') {
        return (
            <>
                <DivElem elementRef={elementRef}/>
                placeId empty.
            </>
        )
    }

    if (mapsAPIKeyErrorState !== '') {
        return (
            <>
                Error loading maps API key: {mapsAPIKeyErrorState}
                <DivElem elementRef={elementRef}/>
            </>
        );
    }
    if (mapsAPIKey === '') {
        return (
            <>
                Loading maps API key...
                <DivElem elementRef={elementRef}/>
            </>
        );
    }

    return (
        <>
            Place {props.match.params.placeId}
            <DivElem elementRef={elementRef}/>
            <PlaceDetails mapsAPIKey={mapsAPIKey} placeId={props.match.params.placeId} divRef={elementRef}/>
            {renderFromDatabaseNoGoogleParam(selectedPlaceInfoFromDatabase, selectedPlaceInfoFromDatabaseErrors, selectedPlaceExistsInDatabase)}
            <br/>
            There will be graphs and risk analysis here, eventually.
        </>
    )
}