import { useDispatch } from "react-redux";
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

function placeIdFromSelectionOrFromMarker(selectedPlaceIdString: string, selectedPlace?: string): string | null {
    if (selectedPlaceIdString !== '') {
        console.log(`Selecting place id string ${selectedPlaceIdString} from marker`);
        return selectedPlaceIdString;
    }
    if (selectedPlace !== undefined) {
        console.log(`Selecting place id string ${selectedPlace} from autocomplete`);
        return selectedPlace;
    }
    return null;
}

const getDetailsCallback = (result: google.maps.places.PlaceResult, status: google.maps.places.PlacesServiceStatus, dispatch: ReturnType<typeof useDispatch>) => {
    dispatch(setPlacesServiceStatus(status));
    if (status !== google.maps.places.PlacesServiceStatus.OK) {
        console.error(`Google places query returned ${status}`);
        
        if (status === google.maps.places.PlacesServiceStatus.OVER_QUERY_LIMIT) {
            alert('Used entire budgeted google places/maps API quota! File an issue on github or contact me.');
        }
        return;
    }
    // debugger;
    // setPlacesServiceStatus(status);
    const placeForAction = autocompleteSelectedPlaceToAction(result);
    console.log(`selecting place: ${placeForAction.name}`);
    dispatch(setSelectedPlace(placeForAction));
    if (placeForAction.place_id === undefined) {
        throw new Error('autocomplete place_id is undefined! Hmm.');
    }
    // dispatch(setSelectedPlaceIdString(placeForAction.place_id))
    dispatch(setSublocationSelectedLocationID(-1));
    if (result.place_id === undefined) {
        console.error("missing place_id?");
        return;
    }
    // console.log(result.utc_offset_minutes);
    // debugger;
    // result.
    updatePlacesInfoFromBackend(result.place_id, dispatch);
}


export const updateOnNewPlace = (service: google.maps.places.PlacesService | null, dispatch: ReturnType<typeof useDispatch>, place_id?: string) => {
    if (service === null) {
        // debugger;
        console.log("places service not ready yet");
        return;
    }
    if (place_id === undefined) {
        // console.log("no placeId from autocomplete yet.");
        // return;
    }
    if (place_id === null) {
        // debugger;
        console.warn("place_id is null from autocomplete?");
        return;
    }
    checkInterestingFields(INTERESTING_FIELDS);
    const placeIDForRequest = placeIdFromSelectionOrFromMarker('', place_id);
    debugger;
    if (placeIDForRequest === null) {
        console.log("no place id from either source.");
        return;
    }
    const request: google.maps.places.PlaceDetailsRequest = {
        placeId: placeIDForRequest,
        fields: INTERESTING_FIELDS
    } 
    const detailsCallbackThunk = (result: google.maps.places.PlaceResult, status: google.maps.places.PlacesServiceStatus) => {
        getDetailsCallback(result, status, dispatch);
    }
    // console.warn("places service request...")
    service.getDetails(request, detailsCallbackThunk);
}
