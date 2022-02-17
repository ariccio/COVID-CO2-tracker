import { createSlice, PayloadAction } from '@reduxjs/toolkit'

import { RootState } from '../../app/rootReducer';
import {MeasurementDataForUpload} from './MeasurementTypes';

interface MeasurementState {
    measurementsForUpload: MeasurementDataForUpload[]
};

const initialMeasurementState: MeasurementState = {
    measurementsForUpload: []
};

export const measurementSlice = createSlice({
    name: 'measurementSlice',
    initialState: initialMeasurementState,
    reducers: {
        addMeasurement: (state, action: PayloadAction<MeasurementDataForUpload>) => {
            state.measurementsForUpload = state.measurementsForUpload.concat(action.payload);
        },
        setMeasurements: (state, action: PayloadAction<MeasurementDataForUpload[]>) => {
            state.measurementsForUpload = action.payload;
        }
    }
});

export const {addMeasurement, setMeasurements} = measurementSlice.actions;

export const selectMeasurements = (state: RootState) => state.measurements.measurementsForUpload;

export const measurementReducer = measurementSlice.reducer;
