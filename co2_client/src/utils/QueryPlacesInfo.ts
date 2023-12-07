import {API_URL, PLACES_BY_GOOGLE_PLACE_ID_EXISTS_ROUTE, PLACES_IN_BOUNDS, SHOW_PLACES_BY_GOOGLE_PLACE_ID_PATH} from './UrlPath';
import {fetchJSONWithChecks} from './FetchHelpers';
import {userRequestOptions} from './DefaultRequestOptions';
import {Errors, formatErrors} from './ErrorObject';
import {SelectedPlaceDatabaseInfo, setPlacesInfoFromDatabase, setPlacesInfoErrors, setPlaceExistsInDatabase, defaultPlaceInfo, setPlaceMarkersFromDatabase, setPlaceMarkersErrors, defaultPlaceMarkers, placesFromDatabaseForMarker, setPlaceMarkersFetchInProgress, setPlaceMarkersFetchFinishMS, setPlaceMarkersFetchStartMS} from '../features/places/placesSlice';

import { AppDispatch } from '../app/store';



type responseType = SelectedPlaceDatabaseInfo & {
    errors?: Errors
};

const queryPlacesBackend = (placeId: string) => {
    
    const thisPlace = (SHOW_PLACES_BY_GOOGLE_PLACE_ID_PATH + `/${placeId}`);
    const fetchCallback = async (awaitedResponse: Response) => {
        //TODO: strong type?
        return awaitedResponse.json();
    }
    const result = fetchJSONWithChecks(thisPlace, userRequestOptions(), 200, false,  fetchCallback, fetchCallback) as Promise<responseType>;
    return result;
}

interface placeExistsResponseType {
    exists: boolean
}

const queryPlacesBackendExists = (placeId: string) => {
    const CHECK_IF_PLACE_IN_DATABASE_PATH = (API_URL + PLACES_BY_GOOGLE_PLACE_ID_EXISTS_ROUTE);
    const thisPlace = (CHECK_IF_PLACE_IN_DATABASE_PATH + `/${placeId}`);
    const fetchCallback = async (awaitedResponse: Response) => {
        return awaitedResponse.json();
    }
    const result = fetchJSONWithChecks(thisPlace, userRequestOptions(), 200, false, fetchCallback, fetchCallback) as Promise<placeExistsResponseType>;
    return result;
}

const checkIfExists = (place_id: string, dispatch: AppDispatch): Promise<boolean> => {
    const placeExistsPromise = queryPlacesBackendExists(place_id);
    return placeExistsPromise.then((existsResponse) => {
        if (existsResponse.exists === false) {
            console.log("Place does not yet exist in database.")
            dispatch(setPlaceExistsInDatabase(false));
            dispatch(setPlacesInfoFromDatabase(defaultPlaceInfo));
            return false;
        }
        // console.log("Place exists in database!")
        // debugger;
        dispatch(setPlaceExistsInDatabase(true));
        // dispatch()
        return true
    }).catch((error) => {
        console.warn("Couldn't check if the place exists for some reason.")
        dispatch(setPlacesInfoErrors(`Failed checking if the place exists! Error message: ${error}`));
        return false;
    })

}

export const updatePlacesInfoFromBackend = (place_id: string, dispatch: AppDispatch) => {
    console.log(`updating places info from backend...`);
    dispatch(setPlacesInfoFromDatabase(defaultPlaceInfo));
    dispatch(setPlacesInfoErrors(''));
    
    const existsPromise = checkIfExists(place_id, dispatch);
    existsPromise.then((exists_or_continue) => {
        if (!exists_or_continue) {
            // debugger;
            console.log(`${place_id} not in database, nothing to query.`);
            return;
        }

        const placeInfoPromise = queryPlacesBackend(place_id);
        placeInfoPromise.then((placeInfo) => {
            if (placeInfo.errors !== undefined) {
                console.warn("some kind of error encountered");
                dispatch(setPlacesInfoErrors(formatErrors(placeInfo.errors)));
                debugger;
                dispatch(setPlacesInfoFromDatabase(defaultPlaceInfo));
            }
            else {
                // dispatch(setPlaceExistsInDatabase(false))
                // debugger;
                dispatch(setPlacesInfoFromDatabase(placeInfo));
            }
        }).catch((error) => {
            dispatch(setPlacesInfoErrors(`Low level error: ${String(error.message)}`));
        });
    })
}

// function nearPlaceRequestInit(lat: number, lng: number): RequestInit {
//     const defaultOptions = postRequestOptions();
//     const newOptions = {
//         ...defaultOptions,
//         body: JSON.stringify({
//             place: {
//                 lat: lat,
//                 lng: lng
//             }
//         })
//     };
//     return newOptions;
// }


type nearbyPlacesResponseType = placesFromDatabaseForMarker & {
    errors?: Errors
}

function inBoundsQueryString(northEast: google.maps.LatLng, southWest: google.maps.LatLng): string {
    // const place = {
    //     place: {
    //         east: String(northEast.lng()),
    //         north: String(northEast.lat()),
    //         south: String(southWest.lat()),
    //         west: String(southWest.lng())
    //     }
    // };
    // const params = new URLSearchParams(place)
    // const encodedString = `?${stringify(place)}`;
    // return encodedString;
    return `?east=${northEast.lng()}&north=${northEast.lat()}&south=${southWest.lat()}&west=${southWest.lng()}`;   
}

function inBoundsQueryStringLiteral(northEast: google.maps.LatLngLiteral, southWest: google.maps.LatLngLiteral): string {
    // const place = {
    //     place: {
    //         east: String(northEast.lng()),
    //         north: String(northEast.lat()),
    //         south: String(southWest.lat()),
    //         west: String(southWest.lng())
    //     }
    // };
    // const params = new URLSearchParams(place)
    // const encodedString = `?${stringify(place)}`;
    // return encodedString;
    return `?east=${northEast.lng}&north=${northEast.lat}&south=${southWest.lat}&west=${southWest.lng}`;   
}


// function inBoundsPlaceRequestInit(): RequestInit {
//     const defaultOptions = userRequestOptions();
//     // const place = {
//     //     east: northEast.lng(),
//     //     north: northEast.lat(),
//     //     south: southWest.lat(),
//     //     west: southWest.lng()
//     // };
//     // const newOptions = {
//     //     ...defaultOptions,
//     //     // body: JSON.stringify({
//     //     //     place: place
//     //     // })
//     // };
//     return defaultOptions;
// }

// interface LatLngBoundsLiteral {
//     /**
//      * East longitude in degrees. Values outside the range [-180, 180] will be wrapped to the range [-180, 180]. For
//      * example, a value of -190 will be converted to 170. A value of 190 will be converted to -170. This reflects
//      * the fact that longitudes wrap around the globe.
//      * @see {@link https://developers.google.com/maps/documentation/javascript/reference/coordinates#LatLngBoundsLiteral.east Maps JavaScript API}
//      */
//     east: number;

//     /**
//      * North latitude in degrees. Values will be clamped to the range [-90, 90]. This means that if the value
//      * specified is less than -90, it will be set to -90. And if the value is greater than 90, it will be set to 90.
//      * @see {@link https://developers.google.com/maps/documentation/javascript/reference/coordinates#LatLngBoundsLiteral.north Maps JavaScript API}
//      */
//     north: number;

//     /**
//      * South latitude in degrees. Values will be clamped to the range [-90, 90]. This means that if the value
//      * specified is less than -90, it will be set to -90. And if the value is greater than 90, it will be set to 90.
//      * @see {@link https://developers.google.com/maps/documentation/javascript/reference/coordinates#LatLngBoundsLiteral.south Maps JavaScript API}
//      */
//     south: number;

//     /**
//      * West longitude in degrees. Values outside the range [-180, 180] will be wrapped to the range [-180, 180]. For
//      * example, a value of -190 will be converted to 170. A value of 190 will be converted to -170. This reflects
//      * the fact that longitudes wrap around the globe.
//      * @see {@link https://developers.google.com/maps/documentation/javascript/reference/coordinates#LatLngBoundsLiteral.west Maps JavaScript API}
//      */
//     west: number;
// }

// This may end up being too slow
export const queryPlacesInBoundsFromBackend = (northEast: google.maps.LatLng, southWest: google.maps.LatLng, dispatch: AppDispatch) => {
    const fetchFailedCallback = async (awaitedResponse: Response): Promise<nearbyPlacesResponseType> => {
        dispatch(setPlaceMarkersFetchFinishMS(performance.now()));
        console.error("Failed to find nearby places!");
        return awaitedResponse.json();
    }
    const fetchSuccessCallback = async (awaitedResponse: Response): Promise<nearbyPlacesResponseType> => {
        dispatch(setPlaceMarkersFetchFinishMS(performance.now()));
        console.log("TODO: strong type");
        return awaitedResponse.json();
    }

    const stringifiedBounds = inBoundsQueryString(northEast, southWest);
    const placesInBoundsURLWithQueryString = (PLACES_IN_BOUNDS + stringifiedBounds)
    dispatch(setPlaceMarkersFetchStartMS(performance.now()));
    const result = fetchJSONWithChecks(placesInBoundsURLWithQueryString, userRequestOptions(), 200, true, fetchFailedCallback, fetchSuccessCallback) as Promise<nearbyPlacesResponseType>;
    return nearbyResultsFetchedCallback(result, dispatch);
}

export const queryPlacesInBoundsFromBackendLiteral = (northEast: google.maps.LatLngLiteral, southWest: google.maps.LatLngLiteral, dispatch: AppDispatch) => {
    const fetchFailedCallback = async (awaitedResponse: Response): Promise<nearbyPlacesResponseType> => {
        dispatch(setPlaceMarkersFetchFinishMS(performance.now()));
        console.error("Failed to find nearby places!");
        return awaitedResponse.json();
    }
    const fetchSuccessCallback = async (awaitedResponse: Response): Promise<nearbyPlacesResponseType> => {
        dispatch(setPlaceMarkersFetchFinishMS(performance.now()));
        console.log(`Fetched places early?`);
        return awaitedResponse.json();
    }

    const stringifiedBounds = inBoundsQueryStringLiteral(northEast, southWest);
    const placesInBoundsURLWithQueryString = (PLACES_IN_BOUNDS + stringifiedBounds)
    dispatch(setPlaceMarkersFetchStartMS(performance.now()));
    const result = fetchJSONWithChecks(placesInBoundsURLWithQueryString, userRequestOptions(), 200, true, fetchFailedCallback, fetchSuccessCallback) as Promise<nearbyPlacesResponseType>;
    return nearbyResultsFetchedCallback(result, dispatch);
}


const nearbyResultsFetchedCallback = (result: Promise<nearbyPlacesResponseType>, dispatch: AppDispatch) => {
    return result.then((response) => {
        dispatch(setPlaceMarkersFetchInProgress(false));
        if (response.errors !== undefined) {
            console.warn("some kind of error while fetching place markers")
            dispatch(setPlaceMarkersErrors(formatErrors(response.errors)));
            dispatch(setPlaceMarkersFromDatabase(defaultPlaceMarkers));
        }
        else {
            // debugger;
            console.assert(response.places !== undefined)
            if (response.places === undefined) {
                throw new Error("missing data for places in bounds!")
            }
            // console.log("successfully queried place markers");
            dispatch(setPlaceMarkersFromDatabase(response));
            // debugger;
        }
        // debugger;
    }).catch((errors) => {
        dispatch(setPlaceMarkersFetchInProgress(false));
        console.error("error getting place markers");
        dispatch(setPlaceMarkersErrors(errors.message))  
    })

}

