// /// <reference types="googlemaps/reference/places-service.d.ts" />

// note to self: there's got to be a better way to do this.
// https://stackoverflow.com/a/28989650/625687
// That's a bit like headers.
// import('@types/googlemaps/reference/places-service');
// import {PlaceResult} from 'googlemaps';

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../../app/store';

//Places API reference: https://developers.google.com/places/web-service/search


/*
PlaceResult from: COVID_CO2_TRACKER\co2_client\node_modules\@types\googlemaps\reference\places-service.d.ts


    interface PlaceResult {
        address_components?: GeocoderAddressComponent[];
        adr_address?: string;
        aspects?: PlaceAspectRating[];
        formatted_address?: string;
        formatted_phone_number?: string;
        geometry?: PlaceGeometry;
        html_attributions?: string[];
        icon?: string;
        id?: string;
        international_phone_number?: string;
        name: string;
        opening_hours?: OpeningHours;
        permanently_closed?: boolean;
        photos?: PlacePhoto[];
        place_id?: string;
        plus_code?: PlacePlusCode;
        price_level?: number;
        rating?: number;
        reviews?: PlaceReview[];
        types?: string[];
        url?: string;
        user_ratings_total?: number;
        utc_offset?: number;
        utc_offset_minutes?: number;
        vicinity?: string;
        website?: string;
    }

/*
example autocomplete getPlace result:

{address_components: Array(8), adr_address: "<span class="street-address">1066 3rd Ave</span>, …065</span>, <span class="country-name">USA</span>", business_status: "OPERATIONAL", formatted_address: "1066 3rd Ave, New York, NY 10065, USA", formatted_phone_number: "(212) 935-9551", …}
address_components: Array(8)
0: {long_name: "1066", short_name: "1066", types: Array(1)}
1: {long_name: "3rd Avenue", short_name: "3rd Ave", types: Array(1)}
2: {long_name: "Manhattan", short_name: "Manhattan", types: Array(3)}
3: {long_name: "New York", short_name: "New York", types: Array(2)}
4: {long_name: "New York County", short_name: "New York County", types: Array(2)}
5: {long_name: "New York", short_name: "NY", types: Array(2)}
6: {long_name: "United States", short_name: "US", types: Array(2)}
7: {long_name: "10065", short_name: "10065", types: Array(1)}
length: 8
__proto__: Array(0)
adr_address: "<span class="street-address">1066 3rd Ave</span>, <span class="locality">New York</span>, <span class="region">NY</span> <span class="postal-code">10065</span>, <span class="country-name">USA</span>"
business_status: "OPERATIONAL"
formatted_address: "1066 3rd Ave, New York, NY 10065, USA"
formatted_phone_number: "(212) 935-9551"
geometry: {location: _.I, viewport: _.Rf}
html_attributions: []
icon: "https://maps.gstatic.com/mapfiles/place_api/icons/v1/png_71/shopping-71.png"
international_phone_number: "+1 212-935-9551"
name: "Morton Williams Supermarkets"
opening_hours:
isOpen: ƒ (l)
open_now: (...)
periods: (7) [{…}, {…}, {…}, {…}, {…}, {…}, {…}]
weekday_text: (7) ["Monday: 7:00 AM – 12:00 AM", "Tuesday: 7:00 AM – 12:00 AM", "Wednesday: 7:00 AM – 12:00 AM", "Thursday: 7:00 AM – 12:00 AM", "Friday: 7:00 AM – 12:00 AM", "Saturday: 7:00 AM – 12:00 AM", "Sunday: 7:00 AM – 12:00 AM"]
get open_now: ƒ ()
set open_now: ƒ (l)
__proto__: Object
photos: (10) [{…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}]
place_id: "ChIJQyEH0ehYwokRdBbXzsOGYmQ"
plus_code: {compound_code: "Q27P+Q3 New York, NY, USA", global_code: "87G8Q27P+Q3"}
rating: 4.1
reference: "ChIJQyEH0ehYwokRdBbXzsOGYmQ"
reviews: (5) [{…}, {…}, {…}, {…}, {…}]
types: (6) ["supermarket", "grocery_or_supermarket", "food", "point_of_interest", "store", "establishment"]
url: "https://maps.google.com/?cid=7233492127057385076"
user_ratings_total: 521
utc_offset: (...)
utc_offset_minutes: -300
vicinity: "1066 3rd Avenue, New York"
website: "http://www.mortonwilliams.com/"
get utc_offset: ƒ ()
set utc_offset: ƒ (c)
__proto__: Object



-----------
parts we're interested in:
formatted_address: "1066 3rd Ave, New York, NY 10065, USA"
icon: "https://maps.gstatic.com/mapfiles/place_api/icons/v1/png_71/shopping-71.png"
name: "Morton Williams Supermarkets"
place_id: "ChIJQyEH0ehYwokRdBbXzsOGYmQ"
types: (6) ["supermarket", "grocery_or_supermarket", "food", "point_of_interest", "store", "establishment"]
url: "https://maps.google.com/?cid=7233492127057385076"
vicinity: "1066 3rd Avenue, New York"
*/

export const INTERESTING_FIELDS = [
    "name",
    "place_id",
    "formatted_address",
    "icon",
    "types",
    "url",
    "vicinity",
    "geometry",
    "utc_offset_minutes"
];

type geometryPODType = {
    geometry_translated?: {
        lat?: number,
        lng?: number
    }
}

export type placeResultWithTranslatedType = google.maps.places.PlaceResult & geometryPODType;

interface googlePlacesState {
    // google.maps.places.
    selected: placeResultWithTranslatedType,
    placesServiceStatus: google.maps.places.PlacesServiceStatus | null,
    definitelyNotAMapsAPeeEyeKey: string,
    mapsAaaPeeEyeKeyErrorState: string,
    // selectedPlaceIdString: string
    // isLoaded: boolean,
    // JSAPILoadError: Error | undefined
}

export const defaultGooglePlacesState: googlePlacesState = {
    selected: {
        name: ''
    },
    placesServiceStatus: null,
    definitelyNotAMapsAPeeEyeKey: '',
    mapsAaaPeeEyeKeyErrorState: '',
    // selectedPlaceIdString: ''
    // isLoaded: false,
    // JSAPILoadError: undefined
}

export const googlePlacesSlice = createSlice({
    name: 'places', // TODO: change?
    initialState: defaultGooglePlacesState,
    reducers: {
        setSelectedPlace: (state, action: PayloadAction<placeResultWithTranslatedType>) => {
            if (action.payload.geometry !== undefined) {
                throw new Error("needs translation");
            }
            state.selected = action.payload;
        },
        setPlacesServiceStatus: (state, action: PayloadAction<google.maps.places.PlacesServiceStatus>) => {
            state.placesServiceStatus = action.payload;
        },
        setMapsAaaPeeEyeKey: (state, action: PayloadAction<string>) => {
            state.definitelyNotAMapsAPeeEyeKey = action.payload;
        },
        setMapsAaaPeeEyeKeyErrorState: (state, action: PayloadAction<string>) => {
            state.mapsAaaPeeEyeKeyErrorState = action.payload;
        }
        // setSelectedPlaceIdString: (state, action: PayloadAction<string>) => {
        //     state.selectedPlaceIdString = action.payload;
        // }
        // setIsLoaded: (state, action: PayloadAction<boolean>) => {
        //     state.isLoaded = action.payload;
        // },
        // setJSAPILoadError: (state, action: PayloadAction<Error|undefined>) => {
        //     state.JSAPILoadError = action.payload;
        // }
    },

});

//lat and lng are functions because google loves OO. Redux does not like functions as data. They aren't serializable.
export function autocompleteSelectedPlaceToAction(action_: google.maps.places.PlaceResult): placeResultWithTranslatedType {
    // console.log("the utc_offset warning in the next line is spurious. I do not use that field, but copying this object touches it.");
    const action = Object.assign({}, action_);
    const lat = action.geometry?.location?.lat();
    const lng = action.geometry?.location?.lng();
    const geo: geometryPODType = {
        geometry_translated: {
            lat: lat,
            lng: lng
        }
    }
    action.geometry = undefined;
    const newSelected: placeResultWithTranslatedType = {
        ...action,
        ...geo
    }
    return newSelected;
}


export const {setSelectedPlace, setPlacesServiceStatus, setMapsAaaPeeEyeKey, setMapsAaaPeeEyeKeyErrorState} = googlePlacesSlice.actions;

export const selectSelectedPlace = (state: RootState) => state.places.selected;
export const selectPlacesServiceStatus = (state: RootState) => state.places.placesServiceStatus;
export const selectMapsAaPeEyeKey = (state: RootState) => state.places.definitelyNotAMapsAPeeEyeKey;
export const selectMapsAaaPeeEyeKeyErrorState = (state: RootState) => state.places.mapsAaaPeeEyeKeyErrorState;
// export const selectSelectedPlaceIdString = (state: RootState) => state.places.selectedPlaceIdString;
// export const selectIsLoaded = (state: RootState) => state.places.isLoaded;
// export const selectJSApiLoadError = (state: RootState) => state.places.JSAPILoadError;
export const placesReducer = googlePlacesSlice.reducer;
