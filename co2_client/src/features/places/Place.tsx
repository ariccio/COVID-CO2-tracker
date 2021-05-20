import React, {useEffect, useRef} from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {RouteComponentProps} from 'react-router-dom';
// import {useLocation} from 'react-router-dom';
import { updatePlacesInfoFromBackend } from '../../utils/QueryPlacesInfo';
import { selectPlaceExistsInDatabase, selectPlacesInfoErrors, selectPlacesInfoFromDatabase } from './placesSlice';

// import { renderSelectedPlaceInfo} from '../home/HomePage';
import { selectMapsAPIKey, selectMapsAPIKeyErrorState, setMapsAPIKey, setMapsAPIKeyErrorState } from '../google/googleSlice';
import { getGoogleMapsJavascriptAPIKey } from '../../utils/GoogleAPIKeys';
import { RenderFromDatabaseNoGoogleParam } from './RenderPlaceFromDatabase';

import {PlaceDetails} from './PlaceDetails';

interface PlaceProps {
    placeId: string
}


const DivElem = (props: {elementRef: React.MutableRefObject<HTMLDivElement | null>}) => {
    return (
        <div id='ghost-map' ref={props.elementRef}>
        </div>
    );
}

export const Place: React.FC<RouteComponentProps<PlaceProps>> = (props) => {
    // console.log("place")
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
            <RenderFromDatabaseNoGoogleParam selectedPlaceInfoFromDatabase={selectedPlaceInfoFromDatabase} selectedPlaceInfoErrors={selectedPlaceInfoFromDatabaseErrors} selectedPlaceExistsInDatabase={selectedPlaceExistsInDatabase}/>
            <br/>
            There will be graphs and risk analysis here, eventually.
        </>
    )
}