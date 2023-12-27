import {useEffect, useState} from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RenderSelectedPlaceInfo } from './RenderPlaceInfo';
import { getPlacesServiceDetailsForMeasurement, updatePlacesServiceDetailsOnNewPlace } from '../google/googlePlacesServiceUtils';
import { useJsApiLoader } from '@react-google-maps/api';
import { GOOGLE_LIBRARIES } from '../google/GoogleMaps';

import { selectPlacesServiceStatus, selectSelectedPlace } from '../google/googleSlice';
import { ChatComponent } from '../openai/ChatGPTEmbed';


interface PlaceDetailsProps {
    mapsAaPeeEyeKey: string,
    placeId: string,
    divRef: React.MutableRefObject<HTMLDivElement | null>
}

interface PlaceDetailsMeasurementFromSinglePlaceProps {
    mapsAaPeeEyeKey: string,
    placeId: string,
    currentPlaceIfFromSingleParentLocation: google.maps.places.PlaceResult
}

export const PlaceDetails: React.FC<PlaceDetailsProps> = (props) => {
    const [service, setService] = useState(null as google.maps.places.PlacesService | null);
    const dispatch = useDispatch();
    const placesServiceStatus = useSelector(selectPlacesServiceStatus);
    const selectedPlace = useSelector(selectSelectedPlace);


    //TODO: factor this out, maybe use custom hook?
    const { isLoaded, loadError } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: props.mapsAaPeeEyeKey,
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
        console.log("Place details component: updating for new place...");
        // debugger;
        updatePlacesServiceDetailsOnNewPlace(service, dispatch, props.placeId);    
        
    }, [dispatch, props.placeId, service])

    return (
        <div>
            <RenderSelectedPlaceInfo currentPlace={selectedPlace} placesServiceStatus={placesServiceStatus}/>
            {/* <ChatComponent/> */}
        </div>
    );
}


export const PlaceDetailsSingleMeasurement: React.FC<PlaceDetailsMeasurementFromSinglePlaceProps> = (props) => {
    const placesServiceStatus = useSelector(selectPlacesServiceStatus);


    return (
        <div>
            <RenderSelectedPlaceInfo currentPlace={props.currentPlaceIfFromSingleParentLocation} placesServiceStatus={placesServiceStatus}/>
            {/* <ChatComponent/> */}
        </div>
    );
}
