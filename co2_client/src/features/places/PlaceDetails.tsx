import React, {useEffect, useRef, useState} from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { renderSelectedPlaceInfo } from './RenderPlaceInfo';
import { updateOnNewPlace } from '../google/googlePlacesServiceUtils';
import { useJsApiLoader } from '@react-google-maps/api';
import { GOOGLE_LIBRARIES } from '../google/GoogleMaps';

import { selectPlacesServiceStatus, selectSelectedPlace } from '../google/googleSlice';


interface PlaceDetailsProps {
    mapsAPIKey: string,
    placeId: string,
    divRef: React.MutableRefObject<HTMLDivElement | null>
}

export const PlaceDetails: React.FC<PlaceDetailsProps> = (props) => {
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
            console.warn("no div ref")
            return;
        }
        if (!isLoaded) {
            // console.log("api not loaded yet.");
            if (loadError !== undefined) {
                //TODO: bubble this to user?
                console.error(`Load error: ${loadError}`)
            }
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
