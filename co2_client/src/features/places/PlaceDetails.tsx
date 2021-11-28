import React, {useEffect, useState} from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RenderSelectedPlaceInfo } from './RenderPlaceInfo';
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


    //TODO: factor this out, maybe use custom hook?
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
                console.error(`Load error: ${JSON.stringify(loadError)}`)
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

        updateOnNewPlace(service, dispatch, props.placeId);    
        
    }, [dispatch, props.placeId, service])

    return (
        <div>
            <RenderSelectedPlaceInfo currentPlace={selectedPlace} placesServiceStatus={placesServiceStatus}/>
        </div>
    );
}
