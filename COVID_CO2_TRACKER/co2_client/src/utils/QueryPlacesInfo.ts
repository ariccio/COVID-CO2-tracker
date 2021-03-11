import {API_URL} from './UrlPath';
import {fetchJSONWithChecks} from './FetchHelpers';
import {postRequestOptions, userRequestOptions} from './DefaultRequestOptions';
import {Errors, formatErrors} from './ErrorObject';
import {SelectedPlaceDatabaseInfo, setPlacesInfoFromDatabase, setPlacesInfoErrors, setPlaceExistsInDatabase, defaultPlaceInfo, setPlaceMarkersFromDatabase, setPlaceMarkersErrors, defaultPlaceMarkers, placesFromDatabaseForMarker} from '../features/places/placesSlice';

import {useDispatch} from 'react-redux';

const PLACES_BY_GOOGLE_PLACE_ID_ROUTE: string = '/places_by_google_place_id';
const PLACES_BY_GOOGLE_PLACE_ID_EXISTS_ROUTE: string = '/places_by_google_place_id_exists';
const PLACES_NEAR: string = (API_URL + '/places_near');

type responseType = SelectedPlaceDatabaseInfo & {
    errors?: Errors
};

const queryPlacesBackend = (placeId: string) => {
    const SHOW_PLACES_BY_GOOGLE_PLACE_ID_PATH = (API_URL + PLACES_BY_GOOGLE_PLACE_ID_ROUTE);
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

const checkIfExists = (place_id: string, dispatch: ReturnType<typeof useDispatch>): Promise<boolean> => {
    const placeExistsPromise = queryPlacesBackendExists(place_id);
    return placeExistsPromise.then((existsResponse) => {
        if (existsResponse.exists === false) {
            console.log("Place does not yet exist in database.")
            dispatch(setPlaceExistsInDatabase(false));
            dispatch(setPlacesInfoFromDatabase(defaultPlaceInfo));
            return false;
        }
        console.log("Place exists in database!")
        dispatch(setPlaceExistsInDatabase(true));
        // dispatch()
        return true
    }).catch((error) => {
        console.warn("Couldn't check if the place exists for some reason.")
        dispatch(setPlacesInfoErrors(`Failed checking if the place exists! Error message: ${error}`));
        return false;
    })

}

export const updatePlacesInfoFromBackend = (place_id: string, dispatch: ReturnType<typeof useDispatch>) => {
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
                dispatch(setPlacesInfoFromDatabase(defaultPlaceInfo));
            }
            else {
                // dispatch(setPlaceExistsInDatabase(false))
                dispatch(setPlacesInfoFromDatabase(placeInfo));
            }
        }).catch((error) => {
            dispatch(setPlacesInfoErrors(error.message));
        });
    })
}

function nearPlaceRequestInit(lat: number, lng: number): RequestInit {
    const defaultOptions = postRequestOptions();
    const newOptions = {
        ...defaultOptions,
        body: JSON.stringify({
            place: {
                lat: lat,
                lng: lng
            }
        })
    };
    return newOptions;
}


type nearbyPlacesResponseType = placesFromDatabaseForMarker & {
    errors?: Errors
}

export const queryPlacesNearbyFromBackend = (lat: number, lng: number, dispatch: ReturnType<typeof useDispatch>) => {
    const init = nearPlaceRequestInit(lat, lng);
    const fetchFailedCallback = async (awaitedResponse: Response): Promise<nearbyPlacesResponseType> => {
        console.error("Failed to find nearby places!");
        return awaitedResponse.json();
    }
    const fetchSuccessCallback = async (awaitedResponse: Response): Promise<nearbyPlacesResponseType> => {
        return awaitedResponse.json();
    }
    const result = fetchJSONWithChecks(PLACES_NEAR, init, 200, true, fetchFailedCallback, fetchSuccessCallback) as Promise<nearbyPlacesResponseType>;
    result.then((response) => {
        if (response.errors !== undefined) {
            console.warn("some kind of error while fetching place markers")
            dispatch(setPlaceMarkersErrors(formatErrors(response.errors)));
            dispatch(setPlaceMarkersFromDatabase(defaultPlaceMarkers));
        }
        else {
            console.log("successfully queried place markers");
            dispatch(setPlaceMarkersFromDatabase(response));
            // debugger;
        }
        // debugger;
    }).catch((errors) => {
        console.error("error getting place markers");
        dispatch(setPlaceMarkersErrors(errors.message))  
    })
}