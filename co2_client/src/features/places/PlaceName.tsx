import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { selectApiLoadError, selectApiLoaded } from "../google/googleSlice";
import { MaybeLoadError } from "./PlaceDetails";
import { getPlaceName } from "../google/googlePlacesServiceUtils";

interface PlaceNameProps {
    placeId: string,
    divRef: React.MutableRefObject<HTMLDivElement | null>
}

const MaybePlaceStatus: React.FC<{placesStatus: google.maps.places.PlacesServiceStatus | null}> = (props) => {
    if (props.placesStatus === null) {
        return null;
    }
    if (props.placesStatus === google.maps.places.PlacesServiceStatus.OK) {
        return null;
    }
    return (
        <div>
            Places status: {props.placesStatus}
        </div>
    );

}

export const PlaceName: React.FC<PlaceNameProps> = (props) => {
    const [service, setService] = useState(null as google.maps.places.PlacesService | null);
    const apiLoaded = useSelector(selectApiLoaded);
    const loadError = useSelector(selectApiLoadError);
    const [placeName, setPlaceName] = useState(null as string | null);
    const [placesStatus, setPlacesStatus] = useState(null as google.maps.places.PlacesServiceStatus | null);
    /*
    
    status: google.maps.places.PlacesServiceStatus;
    result: google.maps.places.PlaceResult | null;


    where result is something like:
                {"name":"Hospital for Special Surgery Main Hospital","place_id":"ChIJ9z3A-cNYwokRlZ6EH23xq1c","html_attributions":[]}

    */
    useEffect(() => {
        if (props.divRef.current === null) {
            console.warn("no div ref")
            return;
        }
        if (apiLoaded === null) {
            console.log("api not loaded yet. (null)");
            // if (loadError !== undefined) {
            //     //TODO: bubble this to user?
            //     console.error(`Load error: ${JSON.stringify(loadError)}`)
            // }
            return;
        }
        if (!apiLoaded) {
            console.log("api not loaded yet. (false)");
            // if (loadError !== undefined) {
            //     //TODO: bubble this to user?
            //     console.error(`Load error: ${JSON.stringify(loadError)}`)
            // }
            return;
        }
        const service = new google.maps.places.PlacesService(props.divRef.current);
        setService(service);
    }, [apiLoaded, loadError, props.divRef])


    useEffect(() => {
        if (!service) {
            return;
        }
        if (!apiLoaded) {
            return;
        }
        getPlaceName(service, props.placeId, setPlacesStatus, setPlaceName)
    }, [service, props.placeId, apiLoaded]);

    if (placeName !== null) {
        return (
            <>
                <MaybeLoadError apiLoaded divRef={props.divRef} loadError={loadError} />
                {placeName}
                <MaybePlaceStatus placesStatus={placesStatus} />
            </>
        )
    }
    return (
        <>
            <MaybeLoadError apiLoaded divRef={props.divRef} loadError={loadError} />
            place (loading)
            <MaybePlaceStatus placesStatus={placesStatus} />
        </>
    );
}