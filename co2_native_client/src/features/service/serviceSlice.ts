import { createSlice, PayloadAction } from '@reduxjs/toolkit'

import { RootState } from '../../app/rootReducer';
import { NotifeeNotificationHookState } from './Notification';


export enum NotificationAction {
    StartNotification,
    StopNotification
}

interface ServiceSlice {
    notificationState: NotifeeNotificationHookState | undefined;
    notificationChannelID: string | null;
    displayNotificationNativeErrors: string | null;
    notificationAction: NotificationAction | null;
}

const initialState: ServiceSlice = {
    notificationState: undefined,
    notificationChannelID: null,
    displayNotificationNativeErrors: null,
    notificationAction: null
}

export const serviceSlice = createSlice({
    name: 'service',
    initialState,
    reducers: {
        setNotificationState: (state, action: PayloadAction<NotifeeNotificationHookState>) => {
            state.notificationState = action.payload;
        },
        setNotificationChannelID: (state, action: PayloadAction<string | null>) => {
            state.notificationChannelID = action.payload;
        },
        setDisplayNotificationNativeErrors: (state, action: PayloadAction<string | null>) => {
            state.displayNotificationNativeErrors = action.payload;
        },
        setNotificationAction: (state, action: PayloadAction<NotificationAction | null>) => {
            state.notificationAction = action.payload;
        }
    }
});

export const {setNotificationState, setNotificationChannelID, setDisplayNotificationNativeErrors, setNotificationAction} = serviceSlice.actions;

export const selectNotificationState = (state: RootState) => state.service.notificationState;
export const selectNotificationChannelID = (state: RootState) => state.service.notificationChannelID;
export const selectDisplayNotificationNativeErrors = (state: RootState) => state.service.displayNotificationNativeErrors;
export const selectNotificationAction = (state: RootState) => state.service.notificationAction;


export const serviceReducer = serviceSlice.reducer;
