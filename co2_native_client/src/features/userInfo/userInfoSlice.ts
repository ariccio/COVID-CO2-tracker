import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '../../app/rootReducer';

interface NativeUserInfo {
    userName: string | null;
};

const initialState: NativeUserInfo = {
    userName: null
};


export const userInfoSlice = createSlice({
    name: 'userInfo',
    initialState,
    reducers: {
        setUserName: (state, action: PayloadAction<string | null>) => {
            state.userName = action.payload;
        }
    }
})

export const {setUserName} = userInfoSlice.actions;

export const selectUserName = (state: RootState) => state.userInfo.userName;

export const userInfoReducer = userInfoSlice.reducer;