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

export interface PlacesSlice {
    placesInfoFromDatabase: SelectedPlaceDatabaseInfo,
    placesInfoErrors: string
}

const initialState: PlacesSlice = {
    placesInfoFromDatabase: defaultPlaceInfo,
    placesInfoErrors: ''
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
        }
    }
})


export const {setPlacesInfoFromDatabase, setPlacesInfoErrors} = placesSlice.actions;
export const selectPlacesInfoFromDatabase = (state: RootState) => state.placesInfo.placesInfoFromDatabase;
export const selectPlacesInfoErrors = (state: RootState) => state.placesInfo.placesInfoErrors;

export const placesInfoReducer = placesSlice.reducer;
