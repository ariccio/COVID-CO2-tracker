import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../../app/store';


interface deviceModelsState {
    selectedModel: number,
    selectedModelName: string
    selectedDevice: number,
    selectedDeviceSerialNumber: string
}

const initialState: deviceModelsState = {
    selectedModel: -1,
    selectedModelName: '',
    selectedDevice: -1,
    selectedDeviceSerialNumber: ''
}

export const deviceModelsSlice = createSlice({
    name: 'devicemodels',
    initialState,
    reducers: {
        setSelectedModel: (state, action: PayloadAction<number>) => {
            state.selectedModel = action.payload;
        },
        setSelectedModelName: (state, action: PayloadAction<string>) => {
            state.selectedModelName = action.payload;
        },
        setSelectedDevice: (state, action: PayloadAction<number>) => {
            state.selectedDevice = action.payload;
        },
        setSelectedDeviceSerialNumber: (state, action: PayloadAction<string>) => {
            state.selectedDeviceSerialNumber = action.payload;
        }
    }
})

export const {setSelectedModel, setSelectedModelName, setSelectedDevice, setSelectedDeviceSerialNumber} = deviceModelsSlice.actions;
export const selectSelectedModel = (state: RootState) => state.devicemodels.selectedModel;
export const selectSelectedModelName = (state: RootState) => state.devicemodels.selectedModelName;
export const selectSelectedDevice = (state: RootState) => state.devicemodels.selectedDevice;
export const selectSelectedDeviceSerialNumber = (state: RootState) => state.devicemodels.selectedDeviceSerialNumber;

export const devicemodelsReducer = deviceModelsSlice.reducer;


