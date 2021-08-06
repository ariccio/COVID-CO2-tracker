import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../../app/store';

import {SerializedSingleMeasurement, defaultSerializedSingleMeasurementInfo} from '../../utils/QueryDeviceInfo';

//Ok, so, the places stuff should come OUT of the googleslice and be here.

export interface SublocationMeasurements {
    measurements: {
        data: Array<SerializedSingleMeasurement>,
    },
    sub_location_id: number,
    description: string
}

const defaultSublocationMeasurements: SublocationMeasurements = {
    measurements: {
        data: [defaultSerializedSingleMeasurementInfo],
    },
    sub_location_id: -99999,
    description: ''
}

export interface SelectedPlaceDatabaseInfo {
    measurements_by_sublocation: Array<SublocationMeasurements>
}

export const defaultPlaceInfo: SelectedPlaceDatabaseInfo = {
    measurements_by_sublocation: [defaultSublocationMeasurements]
}


/*
    {
        :data=>{
            :id=>"2",
            :type=>:place,
            :attributes=>{
                :google_place_id=>"ChIJ1eYq8etYwokRd-KvCCjd6cg",
                :place_lat=>0.40768731e2,
                :place_lng=>-0.73965915e2
                }
            }
    }
*/
export interface EachPlaceFromDatabaseForMarker {
    id: number,
    type: string,
    attributes: {
        google_place_id: string,
        place_lat: string,
        place_lng: string
    }
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
    placeMarkersErrors: string,
    placeMarkersFetchInProgress: boolean
}

const initialState: PlacesSlice = {
    placesInfoFromDatabase: defaultPlaceInfo,
    placesInfoErrors: '',
    placeExistsInDatabase: null,
    placeMarkersFromDatabase: defaultPlaceMarkers,
    placeMarkersErrors: '',
    placeMarkersFetchInProgress: false
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
        },
        setPlaceMarkersFetchInProgress: (state, action: PayloadAction<boolean>) => {
            state.placeMarkersFetchInProgress = action.payload;
        }
    }
})

export const {setPlacesInfoFromDatabase, setPlacesInfoErrors, setPlaceExistsInDatabase, setPlaceMarkersFromDatabase, setPlaceMarkersErrors, setPlaceMarkersFetchInProgress} = placesSlice.actions;
export const selectPlacesInfoFromDatabase = (state: RootState) => state.placesInfo.placesInfoFromDatabase;
export const selectPlacesInfoErrors = (state: RootState) => state.placesInfo.placesInfoErrors;
export const selectPlaceExistsInDatabase = (state: RootState) => state.placesInfo.placeExistsInDatabase;

export const selectPlaceMarkersFromDatabase = (state: RootState) => state.placesInfo.placeMarkersFromDatabase;
export const selectPlacesMarkersErrors = (state: RootState) => state.placesInfo.placeMarkersErrors;
export const selectPlaceMarkersFetchInProgress = (state: RootState) => state.placesInfo.placeMarkersFetchInProgress;
export const placesInfoReducer = placesSlice.reducer;
