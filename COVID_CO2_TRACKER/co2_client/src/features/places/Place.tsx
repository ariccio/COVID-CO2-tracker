import React, {useEffect} from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {RouteComponentProps} from 'react-router-dom';
// import {useLocation} from 'react-router-dom';
import { updatePlacesInfoFromBackend } from '../../utils/QueryPlacesInfo';
import { selectPlaceExistsInDatabase, selectPlacesInfoErrors, selectPlacesInfoFromDatabase } from './placesSlice';

import {renderFromDatabaseNoGoogleParam} from '../home/HomePage';

interface PlaceProps {
    placeId: string
}

export const Place: React.FC<RouteComponentProps<PlaceProps>> = (props) => {
    console.log("place")
    // const location = useLocation();
    const dispatch = useDispatch();
    const selectedPlaceInfoFromDatabase = useSelector(selectPlacesInfoFromDatabase);
    const selectedPlaceInfoFromDatabaseErrors = useSelector(selectPlacesInfoErrors);
    const selectedPlaceExistsInDatabase = useSelector(selectPlaceExistsInDatabase);

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
                No place selected.
            </>
        )
    }


    if (props.match.params.placeId === '') {
        return (
            <>
                placeId empty.
            </>
        )
    }

    return (
        <>
            Place {props.match.params.placeId}
            {renderFromDatabaseNoGoogleParam(selectedPlaceInfoFromDatabase, selectedPlaceInfoFromDatabaseErrors, selectedPlaceExistsInDatabase)}
        </>
    )
}