import { createSlice, PayloadAction } from '@reduxjs/toolkit'

import { RootState } from '../../app/rootReducer';

interface UploadState {
    uploadStatus: string | null;
};

const initialState: UploadState = {
    uploadStatus: null
};

export const uploadSlice = createSlice({
    name: 'uploadSlice',
    initialState,
    reducers: {
        setUploadStatus: (state, action: PayloadAction<string | null>) => {
            state.uploadStatus = action.payload;
        }
    }
});


export const {setUploadStatus} = uploadSlice.actions;

export const selectUploadStatus = (state: RootState) => state.upload.uploadStatus;

export const uploadReducer = uploadSlice.reducer;