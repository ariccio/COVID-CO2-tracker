import * as Sentry from "@sentry/browser"; // for manual error reporting.

import { AppDispatch } from "../../app/store";
import { updatePlacesInfoFromBackend } from "../../utils/QueryPlacesInfo";
import { setSublocationSelectedLocationID } from "../sublocationsDropdown/sublocationSlice";
import { autocompleteSelectedPlaceToAction, INTERESTING_FIELDS, setPlacesServiceStatus, setSelectedPlace } from "./googleSlice";

function warnFieldMessage(): void {
    console.warn(`Warning: If you do not specify at least one field with a request, or if you omit the fields parameter from a request, ALL possible fields will be returned, and you will be billed accordingly. This applies only to Place Details requests (including Place Details requests made from the Place Autocomplete widget).`);
}


function checkInterestingFields(interestingFields: Array<string>): void {
    if (interestingFields === undefined) {
        warnFieldMessage();
    }
    if (interestingFields === null) {
        warnFieldMessage();
        return;
    }
    if (interestingFields.length === 0) {
        warnFieldMessage();
        return;
    }
    if (interestingFields[0] === null) {
        warnFieldMessage();
        return;
    }
    if (interestingFields[0].length === 0) {
        warnFieldMessage();
    }
}

const reportWeirdness = (result: google.maps.places.PlaceResult | null, status: google.maps.places.PlacesServiceStatus) => {
    if (status === google.maps.places.PlacesServiceStatus.NOT_FOUND) {
        //Nothing wrong.
        return;
    }
    if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
        //Nothing wrong.
        return;
    }

    console.error(`Google places query returned non-OK status: ${status}`);
    console.assert(status !== google.maps.places.PlacesServiceStatus.OK);

    if (result !== null) {
        console.error("unexpected combination of results.");
        Sentry.captureMessage(`Unexpected combination of PlacesServiceStatus and PlaceResult. PlaceResult: '${JSON.stringify(result)}'`);
    }
        
    if (status === google.maps.places.PlacesServiceStatus.OVER_QUERY_LIMIT) {
        Sentry.captureMessage("Over google places quota limit!")
        alert("Used entire budgeted google places/maps API quota! This issue has been automatically reported, but the app won't work correctly until I fix it.");
        return;
    }
    if (status === google.maps.places.PlacesServiceStatus.INVALID_REQUEST) {
        Sentry.captureMessage("Something wrong with places request (INVALID_REQUEST).");
        alert("Hmm, You've navigated to an invalid Place, or I may have messed up something in the code that looks up google place information. This issue has been automatically reported.");
        debugger;
        return;
    }
    if (status === google.maps.places.PlacesServiceStatus.REQUEST_DENIED) {
        Sentry.captureMessage("Google Places service request denied (REQUEST_DENIED)");
        alert("Something is wrong with the API key or GCP permissions used by this app. Alternatively, this may be a bug or an undetected/unhandled error. This issue has been automatically reported, but the app won't work correctly until I fix it.");
        return;
    }
    if (status === google.maps.places.PlacesServiceStatus.UNKNOWN_ERROR) {
        Sentry.captureMessage("Google Places service hit an unknown error. Not much we can do, but reporting anyways...");
        alert("Google messed up... try reloading the page! This issue has been automatically reported, but there's not much I can do about it!");
        return;
    }
    Sentry.captureMessage(`Unhandled PlacesServiceStatus: ${status}`);
    return;

}

const getDetailsCallback = (result: google.maps.places.PlaceResult | null, status: google.maps.places.PlacesServiceStatus, dispatch: AppDispatch) => {
    dispatch(setPlacesServiceStatus(status));
    if (status !== google.maps.places.PlacesServiceStatus.OK) {
        reportWeirdness(result, status);
        return;
    }
    // debugger;
    // setPlacesServiceStatus(status);
    if (result === null) {
        console.error("PlaceResult is null?");
        return;
    }
    const placeForAction = autocompleteSelectedPlaceToAction(result);
    console.warn(`selecting place: ${placeForAction.name}`);
    dispatch(setSelectedPlace(placeForAction));
    if (placeForAction.place_id === undefined) {
        throw new Error('autocomplete place_id is undefined! Hmm.');
    }
    // dispatch(setSelectedPlaceIdString(placeForAction.place_id))
    dispatch(setSublocationSelectedLocationID(-1));
    if (result.place_id === undefined) {
        throw new Error("google places result is missing place_id! Something is broken.");
    }
    // console.log(result.utc_offset_minutes);
    // debugger;
    // result.
    updatePlacesInfoFromBackend(result.place_id, dispatch);
}


export const updatePlacesServiceDetailsOnNewPlace = (service: google.maps.places.PlacesService | null, dispatch: AppDispatch, place_id?: string) => {
    if (service === null) {
        // debugger;
        console.log("places service not ready yet");
        return;
    }
    if (place_id === null) {
        // debugger;
        console.warn("place_id is null from autocomplete?");
        return;
    }
    checkInterestingFields(INTERESTING_FIELDS);
    if (place_id === undefined) {
        console.log("no place id.");
        return;
    }
    const request: google.maps.places.PlaceDetailsRequest = {
        placeId: place_id,
        fields: INTERESTING_FIELDS
    } 
    const detailsCallbackThunk = (result: google.maps.places.PlaceResult | null, status: google.maps.places.PlacesServiceStatus) => {
        getDetailsCallback(result, status, dispatch);
    }
    // console.warn("places service request...")
        /**
     * Retrieves details about the place identified by the given
     * <code>placeId</code>.
         getDetails(
            request: google.maps.places.PlaceDetailsRequest,
            callback:
                (a: google.maps.places.PlaceResult|null,
                 b: google.maps.places.PlacesServiceStatus) => void): void;
     */
    console.log(`Requesting update from google for place '${place_id}'...`);
    service.getDetails(request, detailsCallbackThunk);
}
