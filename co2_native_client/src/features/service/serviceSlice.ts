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
    // notificationAction: NotificationAction | null;
    foregroundServiceRegistered: boolean;
    triggerNotificationID: string | null;
    foregroundServiceNotificationID: string | null;
    // triggerMutexLocked: boolean;
}

const initialState: ServiceSlice = {
    notificationState: undefined,
    notificationChannelID: null,
    displayNotificationNativeErrors: null,
    // notificationAction: null,
    foregroundServiceRegistered: false,
    triggerNotificationID: null,
    foregroundServiceNotificationID: null,
    // triggerMutexLocked: false
}

export const serviceSlice = createSlice({
    name: 'service',
    initialState,
    reducers: {
        setNotificationState: (state, action: PayloadAction<NotifeeNotificationHookState>) => {
            // console.log(`Changing notification state. Old: ${JSON.stringify(state)}, new: ${JSON.stringify(action.payload)}`)
            state.notificationState = action.payload;
        },
        setNotificationChannelID: (state, action: PayloadAction<string | null>) => {
            state.notificationChannelID = action.payload;
        },
        setDisplayNotificationNativeErrors: (state, action: PayloadAction<string | null>) => {
            state.displayNotificationNativeErrors = action.payload;
        },
        // setNotificationAction: (state, action: PayloadAction<NotificationAction | null>) => {
        //     state.notificationAction = action.payload;
        // },
        setForegroundServiceRegistered: (state, action: PayloadAction<boolean>) => {
            state.foregroundServiceRegistered = action.payload;
        },
        setTriggerNotificationID: (state, action: PayloadAction<string | null>) => {
            state.triggerNotificationID = action.payload;
        },
        setForegroundServiceNotificationID: (state, action: PayloadAction<string | null>) => {
            state.foregroundServiceNotificationID = action.payload;
        },
        // setTriggerMutexLocked: (state, action: PayloadAction<boolean>) => {
        //     state.triggerMutexLocked = action.payload;
        // }
    }
});

export const {setNotificationState, setNotificationChannelID, setDisplayNotificationNativeErrors, /*setNotificationAction, */ setForegroundServiceRegistered, setTriggerNotificationID, setForegroundServiceNotificationID} = serviceSlice.actions;

export const selectNotificationState = (state: RootState) => state.service.notificationState;
export const selectNotificationChannelID = (state: RootState) => state.service.notificationChannelID;
export const selectDisplayNotificationNativeErrors = (state: RootState) => state.service.displayNotificationNativeErrors;
// export const selectNotificationAction = (state: RootState) => state.service.notificationAction;
export const selectForegroundServiceRegistered = (state: RootState) => state.service.foregroundServiceRegistered;
export const selectTriggerNotificationID = (state: RootState) => state.service.triggerNotificationID;
export const selectForegroundServiceNotificationID = (state: RootState) => state.service.foregroundServiceNotificationID;

// export const selectTriggerMutexLocked = (state: RootState) => state.service.triggerMutexLocked;

export const serviceReducer = serviceSlice.reducer;
