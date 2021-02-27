import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../../app/store';

// import {ErrorObjectType} from '../../utils/ErrorObject';

export interface ManufacturerModelInfo {
    model_id: number,
    name: string,
    count: number
}

export interface SingleManufacturerInfo {
    manufacturer_id: number,
    name: string,
    models: Array<ManufacturerModelInfo>,
    // errors?: Array<ErrorObjectType>
}


interface selectedManufacturerState {
    selectedManufacturer_id: number | null
}

const initialState: selectedManufacturerState = {
    selectedManufacturer_id: null
}


export const manufacturerSlice = createSlice({
    name: 'manufacturer',
    initialState,
    reducers: {
        setSelectedManufacturer: (state, action: PayloadAction<number>) => {
            state.selectedManufacturer_id = action.payload;
        }
    }
})

export const {setSelectedManufacturer} = manufacturerSlice.actions;
export const selectSelectedManufacturer = (state: RootState) => state.manufacturer.selectedManufacturer_id;

export const manufacturerReducer = manufacturerSlice.reducer;

