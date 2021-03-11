import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../../app/store';


import {ErrorObjectType} from '../../utils/ErrorObject';
import {UserInfoMeasurements, defaultMeasurementInfo} from '../../utils/QueryDeviceInfo';

//Ok, so, the places stuff should come OUT of the googleslice and be here.


export interface SelectedPlaceDatabaseInfo {
    measurements: Array<UserInfoMeasurements> | null
}

export const defaultPlaceInfo: SelectedPlaceDatabaseInfo = {
    measurements: null
}

export interface EachPlaceFromDatabaseForMarker {
    place_id: number,
    google_place_id: string,
    place_lat: string,
    place_lng: string
}

export interface placesFromDatabaseForMarker {
    places: Array<EachPlaceFromDatabaseForMarker> | null
}

export const defaultPlaceMarkers: placesFromDatabaseForMarker = {
    places: null
}


export interface PlacesSlice {
    placesInfoFromDatabase: SelectedPlaceDatabaseInfo,
    placesInfoErrors: string,
    placeExistsInDatabase: boolean | null,
    placeMarkersFromDatabase: placesFromDatabaseForMarker,
    placeMarkersErrors: string
}

const initialState: PlacesSlice = {
    placesInfoFromDatabase: defaultPlaceInfo,
    placesInfoErrors: '',
    placeExistsInDatabase: null,
    placeMarkersFromDatabase: defaultPlaceMarkers,
    placeMarkersErrors: ''
}

//TODO: pull in google places slice
export const placesSlice = createSlice({
    name: 'placesInfo',
    initialState,
    reducers: {
        setPlacesInfoFromDatabase: (state, action: PayloadAction<SelectedPlaceDatabaseInfo>) => {
            state.placesInfoFromDatabase = action.payload;
        },
        setPlacesInfoErrors: (state, action: PayloadAction<string>) => {
            state.placesInfoErrors = action.payload;
        },
        setPlaceExistsInDatabase: (state, action: PayloadAction<boolean>) => {
            state.placeExistsInDatabase = action.payload;
        },
        setPlaceMarkersFromDatabase: (state, action: PayloadAction<placesFromDatabaseForMarker>) => {
            state.placeMarkersFromDatabase = action.payload;
        },
        setPlaceMarkersErrors: (state, action: PayloadAction<string>) => {
            state.placeMarkersErrors = action.payload;
        }
    }
})


export const {setPlacesInfoFromDatabase, setPlacesInfoErrors, setPlaceExistsInDatabase, setPlaceMarkersFromDatabase, setPlaceMarkersErrors} = placesSlice.actions;
export const selectPlacesInfoFromDatabase = (state: RootState) => state.placesInfo.placesInfoFromDatabase;
export const selectPlacesInfoErrors = (state: RootState) => state.placesInfo.placesInfoErrors;
export const selectPlaceExistsInDatabase = (state: RootState) => state.placesInfo.placeExistsInDatabase;

export const selectPlaceMarkersFromDatabase = (state: RootState) => state.placesInfo.placeMarkersFromDatabase;
export const selectPlacesMarkersErrors = (state: RootState) => state.placesInfo.placeMarkersErrors;
export const placesInfoReducer = placesSlice.reducer;
