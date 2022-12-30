import notifee, {NotificationSettings, Notification, EventType, Event, TriggerType, TimeUnit, IntervalTrigger, AndroidImportance, AuthorizationStatus} from '@notifee/react-native';
// import { ActivityAction, IntentLauncherParams, IntentLauncherResult, startActivityAsync } from 'expo-intent-launcher';
import {useState, useEffect, useRef} from 'react';
import { Button, AppState, AppStateStatus, Platform } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import * as Sentry from 'sentry-expo';

import { UserInfoDevice } from '../../../../co2_client/src/utils/DeviceInfoTypes';
import { UserSettings } from '../../../../co2_client/src/utils/UserSettings';
import { selectBackgroundPollingEnabled, selectBatteryOptimizationEnabled, selectShouldUpload, setBackgroundPollingEnabled, setBatteryOptimizationEnabled,  setShouldUpload } from '../../app/globalSlice';
import { AppDispatch } from '../../app/store';
import { unknownNativeErrorTryFormat } from '../../utils/FormatUnknownNativeError';
import { MaybeIfValue, MaybeIfValueTrue } from '../../utils/RenderValues';
import { timeNowAsString } from '../../utils/TimeNow';
import { useIsLoggedIn } from '../../utils/UseLoggedIn';
import { MeasurementDataForUpload } from '../Measurement/MeasurementTypes';
import { uploadMeasurementHeadless } from '../Measurement/MeasurementUpload';
import { onHeadlessTaskTriggerBluetooth } from '../bluetooth/Bluetooth';
// import { selectDeviceID, setScanningStatusString } from '../bluetooth/bluetoothSlice';
import { initialUserDevicesState } from '../userInfo/devicesSlice';
import { selectUserSettings } from '../userInfo/userInfoSlice';
import {logEvent} from './LogEvent';
import { setNotificationChannelID, selectNotificationChannelID, setDisplayNotificationNativeErrors, selectDisplayNotificationNativeErrors, selectNotificationState, setForegroundServiceRegistered, selectForegroundServiceRegistered, setTriggerNotificationID, selectTriggerNotificationID, selectForegroundServiceNotificationID, setForegroundServiceNotificationID } from './serviceSlice';
import { incrementUpdates, selectHasBluetooth } from '../bluetooth/bluetoothSlice';


function defaultForegroundServiceNotificationNoID(channelId: string): Notification {
    const defaultNotificationOptions: Notification = {
        // See: co2_native_client\node_modules\@notifee\react-native\dist\types\Notification.d.ts
        // See: co2_native_client\node_modules\@notifee\react-native\dist\types\NotificationAndroid.d.ts

        // See also: https://notifee.app/react-native/docs/android/appearance#small-icons
        title: 'CO2 tracker', // "The notification title which appears above the body text."
        subtitle: 'service is running!',
        // body: 'Everything is all good!', // "The main body content of a notification."
        android: { // "Android specific notification options. See the [`NotificationAndroid`](/react-native/reference/notificationandroid) interface for more information and default options which are applied to a notification."
            channelId, // "Specifies the `AndroidChannel` which the notification will be delivered on."
            smallIcon: 'ic_small_icon', // optional, defaults to 'ic_launcher'.
            importance: AndroidImportance.MIN,

            // https://notifee.app/react-native/docs/android/foreground-service
            asForegroundService: true,
            actions: [
                {
                    title: 'Open',
                    icon: 'https://my-cdn.com/icons/open-chat.png',
                    pressAction: {
                        id: 'open-chat',
                        launchActivity: 'default',
                    },
                },
                {
                    title: 'Stop',
                    pressAction: {
                        id: 'stop',
                    }
                }
            ],
            showTimestamp: true,
            pressAction: {
                id: 'default'
            }
        }
        // ,
        // ios: {
        //   interruptionLevel: 'passive'  
        // }
    }

    return defaultNotificationOptions;
}

function defaultForegroundServiceNotification(channelId: string, id?: string | null): Notification {
    if (id === undefined) {
        return defaultForegroundServiceNotificationNoID(channelId);
    }
    if (id === null) {
        return defaultForegroundServiceNotificationNoID(channelId);
    }

    const defaultNotificationOptions: Notification = {
        // See: co2_native_client\node_modules\@notifee\react-native\dist\types\Notification.d.ts
        // See: co2_native_client\node_modules\@notifee\react-native\dist\types\NotificationAndroid.d.ts

        // See also: https://notifee.app/react-native/docs/android/appearance#small-icons
        title: 'CO2 tracker', // "The notification title which appears above the body text."
        subtitle: 'service is running!',
        id,
        // body: 'Everything is all good!', // "The main body content of a notification."
        android: { // "Android specific notification options. See the [`NotificationAndroid`](/react-native/reference/notificationandroid) interface for more information and default options which are applied to a notification."
            channelId, // "Specifies the `AndroidChannel` which the notification will be delivered on."
            smallIcon: 'ic_small_icon', // optional, defaults to 'ic_launcher'.
            importance: AndroidImportance.MIN,

            // https://notifee.app/react-native/docs/android/foreground-service
            asForegroundService: true,
            actions: [
                {
                    title: 'Open',
                    icon: 'https://my-cdn.com/icons/open-chat.png',
                    pressAction: {
                        id: 'open-chat',
                        launchActivity: 'default',
                    },
                },
                {
                    title: 'Stop',
                    pressAction: {
                        id: 'stop',
                    }
                }
            ],
            showTimestamp: true,
            pressAction: {
                id: 'default'
            }
        }
        // ,
        // ios: {
        //   interruptionLevel: 'passive'  
        // }
    }
    return defaultNotificationOptions;
}

function defaultTriggerNotificationNoID(channelId: string): Notification {
    const defaultNotificationOptions: Notification = {
        // See: co2_native_client\node_modules\@notifee\react-native\dist\types\Notification.d.ts
        // See: co2_native_client\node_modules\@notifee\react-native\dist\types\NotificationAndroid.d.ts

        // See also: https://notifee.app/react-native/docs/android/appearance#small-icons
        title: 'CO2 tracker', // "The notification title which appears above the body text."
        body: 'Updating TRIGGERED...', // "The main body content of a notification."
        android: { // "Android specific notification options. See the [`NotificationAndroid`](/react-native/reference/notificationandroid) interface for more information and default options which are applied to a notification."
            channelId, // "Specifies the `AndroidChannel` which the notification will be delivered on."
            smallIcon: 'ic_small_icon', // optional, defaults to 'ic_launcher'.
            timeoutAfter: (10000 * 60),
            onlyAlertOnce: true,
            importance: AndroidImportance.LOW,
            progress: {
                indeterminate: true
            }
        }
        // ,
        // ios: {

        // }
    }
    return defaultNotificationOptions;
}


function defaultTriggerNotification(channelId: string, triggerNotificationID: string | null): Notification {
    if (triggerNotificationID === null) {
        return defaultTriggerNotificationNoID(channelId);
    }

    const defaultNotificationOptions: Notification = {
        // See: co2_native_client\node_modules\@notifee\react-native\dist\types\Notification.d.ts
        // See: co2_native_client\node_modules\@notifee\react-native\dist\types\NotificationAndroid.d.ts

        // See also: https://notifee.app/react-native/docs/android/appearance#small-icons
        title: 'CO2 tracker', // "The notification title which appears above the body text."
        body: 'Updating TRIGGERED...', // "The main body content of a notification."
        id: triggerNotificationID,
        android: { // "Android specific notification options. See the [`NotificationAndroid`](/react-native/reference/notificationandroid) interface for more information and default options which are applied to a notification."
            channelId, // "Specifies the `AndroidChannel` which the notification will be delivered on."
            smallIcon: 'ic_small_icon', // optional, defaults to 'ic_launcher'.
            timeoutAfter: (10000 * 60),
            onlyAlertOnce: true,
            importance: AndroidImportance.LOW,
            progress: {
                indeterminate: true
            }
        }
        // ,
        // ios: {

        // }
    }
    return defaultNotificationOptions;
}


async function checkedCreateChannel(dispatch: AppDispatch): Promise<string | null> {
    try {
        return await notifee.createChannel({
            id: 'default',
            name: 'Default Channel',
            vibration: false,
            importance: AndroidImportance.MIN
        });
    }
    catch (exception) {
        //Probably native error.
        dispatch(setDisplayNotificationNativeErrors(`Error in createChannel: '${unknownNativeErrorTryFormat(exception)}'`));
        Sentry.Native.captureException(exception);
        return null;
    }
}

async function checkedRequestPermission(dispatch: AppDispatch): Promise<NotificationSettings | null> {
    try {
        return await notifee.requestPermission();
    }
    catch (exception) {
        //Probably native error.
        const errStr = `Error in requestPermission: '${unknownNativeErrorTryFormat(exception)}'`;
        dispatch(setDisplayNotificationNativeErrors(errStr));
        console.error(errStr);
        Sentry.Native.captureException(exception);
        return null;
    }
}







// { type: EventType, detail: EventDetail }
// async function handleForegroundEvent({ type, detail }: Event, deviceID: string, supportedDevices: UserInfoDevice[]) {
    
    
//     if (type === EventType.ACTION_PRESS) {
//         const eventMessage = logEvent('trigger', { type, detail });
//         console.log(`-------\r\n\t${eventMessage}: ${JSON.stringify(detail)}`);
        

//         if (!detail) {
//             console.warn("missing notification event detail?");
//             debugger;
//             return;
//         }
//         if (detail.pressAction === undefined) {
//             console.warn("missing notification event detail pressAction?");
//             debugger;
//             return;
//         }
//         if (detail.pressAction.id === 'stop') {
//             console.log("Stopping foreground service...");
//             notifee.stopForegroundService();
//             notifee.cancelAllNotifications();
//             notifee.cancelTriggerNotifications();
//             return;
//         }
//         console.log(`...Unexpected pressAction? ${detail.pressAction.id}`);
//     }

//     else if (type === EventType.DELIVERED) {
//         const eventMessage = logEvent('trigger', { type, detail });
//         console.log(`-------\r\n\t${eventMessage}: ${JSON.stringify(detail)}`);
        

//         if (detail.notification === undefined) {
//             throw new Error("Missing notification content in detail!");
//         }
//         if (detail.notification.id === undefined) {
//             throw new Error("Missing notification ID in detail!");
//         }

//         console.log("Likely event trigger?");
//         console.log(`Starting headless task with deviceID: ${deviceID}, supportedDevices: ${JSON.stringify(supportedDevices)}`);
//         const result = onHeadlessTaskTriggerBluetooth(deviceID, supportedDevices);
//         console.log(`Read this value!\n\t${JSON.stringify(await result)}`);
//         await notifee.cancelDisplayedNotification(detail.notification.id)
//     }
//     else {
//         const eventMessage = logEvent('trigger', { type, detail });
//         console.log(`-------\r\n\t${eventMessage} (unimplemented event handling for this event.): ${JSON.stringify(detail)}`);
//     }
// }


async function handleForegroundServiceEvent(event: Event, deviceID: string, supportedDevices: UserInfoDevice[], userSettings: UserSettings, jwt: string, shouldUpload: boolean, dispatch: AppDispatch, triggerNotificationID: string | null, serviceNotificationID: string | null) {
    if (event.type === EventType.ACTION_PRESS) {
        const eventMessage = logEvent('foreground', event);
        console.log(`-------\r\n(SERVICE, ${timeNowAsString()})${eventMessage}: ${JSON.stringify(event)}`);

        if (!event.detail) {
            console.warn("missing notification event detail?");
            return;
        }
        if (event.detail.pressAction === undefined) {
            console.warn("missing notification event detail pressAction?");
            return;
        }
        if (event.detail.pressAction.id === 'stop') {
            console.log("Stopping foreground service...");
            stopUploadingAndPolling(dispatch, triggerNotificationID, serviceNotificationID);
            return;
        }
        console.log(`...Unexpected pressAction? ${event.detail.pressAction.id}`);
    }

    else if (event.type === EventType.DELIVERED) {
        const eventMessage = logEvent('foreground', event);
        const UID = Math.random();
        console.log(`-------\r\n\t(SERVICE, ${timeNowAsString()})${eventMessage}: ${JSON.stringify(event)}`);
        

        if (event.detail.notification === undefined) {
            throw new Error("Missing notification content in detail!");
        }
        if (event.detail.notification.id === undefined) {
            throw new Error("Missing notification ID in detail!");
        }

        console.log("Likely event trigger?");
        console.log(`Starting headless task (${UID}) with deviceID: ${deviceID}, supportedDevices: ${JSON.stringify(supportedDevices)}`);
        const result: MeasurementDataForUpload | null = await onHeadlessTaskTriggerBluetooth(deviceID, supportedDevices);
        console.log(`Read this value!\n\t${JSON.stringify(await result)}`);
        await uploadMeasurementHeadless(result, userSettings, jwt, shouldUpload, dispatch);
        // await notifee.cancelDisplayedNotification(event.detail.notification.id);
        console.log(`Headless task ${UID} complete.`);
        dispatch(incrementUpdates());
    }
    else {
        const eventMessage = logEvent('foreground', event);
        console.warn(`-------\r\n(SERVICE, ${timeNowAsString()})${eventMessage} (unimplemented event handling for this event.): ${JSON.stringify(event)}`);
    }
    const triggers = await notifee.getTriggerNotificationIds();
    console.log(`triggers:`)
    for (let i = 0; i < triggers.length; ++i) {
        console.log(`\t${i}: ${triggers[i]}`);
    }
    console.log(`----`);
}

function isKnownUndefinedDetailEvent(event: Event): boolean {
    // https://notifee.app/react-native/reference/eventtype
    switch (event.type) {
        case (EventType.APP_BLOCKED):
            return true;

    }
    return false;
}

async function handleBackgroundEvent(event: Event, deviceID: string, supportedDevices: UserInfoDevice[], userSettings: UserSettings, jwt: string, shouldUpload: boolean, dispatch: AppDispatch) {
    const eventMessage = logEvent('background', event);
    console.log(`-------\r\n(SERVICE, ${timeNowAsString()})${eventMessage} (unimplemented event handling for this event.): ${JSON.stringify(event)}`);

    if (event.detail.notification === undefined) {
        if (!isKnownUndefinedDetailEvent(event)) {
            const errorMessageStr = `Error in handleBackgroundEvent: event.detail.notification is undefined, probably a native error?`;
            dispatch(setDisplayNotificationNativeErrors(errorMessageStr));
            Sentry.Native.captureMessage(errorMessageStr);
            // Sentry.Native.captureException(exception);
        }
        return;
    }
    if (event.detail.notification.id === undefined) {
        if (!isKnownUndefinedDetailEvent(event)) {
            const errorMessageStr = `Error in handleBackgroundEvent: event.detail.notification.id is undefined, probably a native error?`;
            dispatch(setDisplayNotificationNativeErrors(errorMessageStr));
            Sentry.Native.captureMessage(errorMessageStr);
            // Sentry.Native.captureException(exception);
        }
        return;
    }

    // await notifee.cancelNotification(event.detail.notification.id);
}

const foregroundServiceCallback = (notification: Notification, deviceID: string, supportedDevices: UserInfoDevice[], userSettings: UserSettings, jwt: string, shouldUpload: boolean, dispatch: AppDispatch, triggerNotificationID: string | null, serviceNotificationID: string | null): Promise<void> => {
    console.log(`--------FOREGROUND SERVICE CALLBACK ${JSON.stringify(notification)}------`);
    return new Promise(() => {
        console.log("Registering notification service event handlers...");
        // https://notifee.app/react-native/docs/android/foreground-service
        notifee.onForegroundEvent((event: Event) => {return handleForegroundServiceEvent(event, deviceID, supportedDevices, userSettings, jwt, shouldUpload, dispatch, triggerNotificationID, serviceNotificationID)});
        notifee.onBackgroundEvent((event: Event) => {return handleBackgroundEvent(event, deviceID, supportedDevices, userSettings, jwt, shouldUpload, dispatch)});
        // debugger;
    })
}

function registerForegroundService(deviceID: string, supportedDevices: UserInfoDevice[], userSettings: UserSettings, jwt: string, shouldUpload: boolean, dispatch: AppDispatch, triggerNotificationID: string | null, serviceNotificationID: string | null) {
    try {
        console.log("Registering foreground service...");
        notifee.registerForegroundService((notification: Notification) => foregroundServiceCallback(notification, deviceID, supportedDevices, userSettings, jwt, shouldUpload, dispatch, triggerNotificationID, serviceNotificationID));
        // dispatch(setForegroundServiceRegistered(true));
    }
    catch (exception) {
        dispatch(setDisplayNotificationNativeErrors(`Error in registerForegroundService: '${unknownNativeErrorTryFormat(exception)}'`));
        Sentry.Native.captureException(exception);
        //Probably native error.
    }
}

// async function registerBackgroundEventHandler(deviceID: string, supportedDevices: UserInfoDevice[], userSettings: UserSettings, jwt: string, shouldUpload: boolean, dispatch: AppDispatch): Promise<void> {
//     try {
//         console.log("Registering background event handler...");
//         notifee.onBackgroundEvent((event: Event) => {return handleBackgroundEvent(event, deviceID, supportedDevices, userSettings, jwt, shouldUpload, dispatch)})
//     }
//     catch (exception) {
//         dispatch(setDisplayNotificationNativeErrors(`Error in registerBackgroundEventHandler: '${unknownNativeErrorTryFormat(exception)}'`));
//         Sentry.Native.captureException(exception);
//         //Probably native error.
//     }
// }

//https://notifee.app/react-native/docs/displaying-a-notification
async function startForegroundService(setDisplayNotificationErrors: React.Dispatch<React.SetStateAction<string | null>>, channelId: string, deviceID: string, supportedDevices: UserInfoDevice[], userSettings: UserSettings, jwt: string, shouldUpload: boolean, dispatch: AppDispatch, triggerNotificationID: string | null, foregroundServiceNotificationID: string | null) {
    // Create a channel

    //https://github.com/invertase/notifee/blob/7d03bb4eda27b5d4325473cf155852cef42f5909/docs/react-native/docs/debugging.md
    // To quickly view Android logs in the terminal:
    //   adb logcat '*:S' NOTIFEE:D
    if (!foregroundServiceNotificationID) {
        const os = Platform.OS;
        if (os === 'android') {
            console.log("Creating foreground service...");
            
            await registerForegroundService(deviceID, supportedDevices, userSettings, jwt, shouldUpload, dispatch, triggerNotificationID, foregroundServiceNotificationID);
        }
        else if (os === 'ios') {
            // console.log('creating ios background event handler...');
            // registerBackgroundEventHandler(deviceID, supportedDevices, userSettings, jwt, shouldUpload, dispatch);
            console.log("IOS backgrounding is not implemented with notifications.");
            return;
        }
        else {
            console.error("unimplemented");
            throw new Error("tf?")
        }
    }

    // Required for iOS
    // See https://notifee.app/react-native/docs/ios/permissions
    const settings = await checkedRequestPermission(dispatch);
    // console.log(`notification permission settings: ${JSON.stringify(settings)}`);
    if (settings?.authorizationStatus !== AuthorizationStatus.AUTHORIZED) {
        console.error(`Notifications may not be authorized?`);
    }

    const foregroundServiceNotificationWithChannel = defaultForegroundServiceNotification(channelId, foregroundServiceNotificationID);
    console.log(`Creating notification for foreground service`);

    try {
        // Display a notification

        // See also:
        //   https://github.com/invertase/notifee/blob/7d03bb4eda27b5d4325473cf155852cef42f5909/android/src/main/java/app/notifee/core/NotificationManager.java#L508
        //     AKA Task<Void> displayNotification(NotificationModel notificationModel, Bundle triggerBundle) 
        //   https://github.com/invertase/notifee/blob/7d03bb4eda27b5d4325473cf155852cef42f5909/android/src/main/java/app/notifee/core/NotificationManager.java#L83
        //   AKA Task<NotificationCompat.Builder> notificationBundleToBuilder(NotificationModel notificationModel)

        // result is ID.
        // From Notification.d.ts: (See: co2_native_client\node_modules\@notifee\react-native\dist\types\Notification.d.ts)
        //   "A unique identifier for your notification."
        //   "Notifications with the same ID will be created as the same instance, allowing you to update a notification which already exists on the device."
        //   "Defaults to a random string if not provided."
        const result = await notifee.displayNotification(foregroundServiceNotificationWithChannel);
        console.assert(result !== null);
        console.assert(result !== undefined);
        console.assert(typeof result === 'string');
        console.log("Sucessfully displayed notifee notification.");
        setDisplayNotificationErrors(null);
        dispatch(setForegroundServiceNotificationID(result));
        // return result;
    }
    catch (e) {
        console.error(`Error displaying notification! ${unknownNativeErrorTryFormat(e)}`);
        Sentry.Native.captureException(e);
        if (e instanceof Error) {
            setDisplayNotificationErrors(String(e));
            return;
        }
        // Usually a Native Module exception?
        // See: https://github.com/facebook/react-native/blob/main/ReactAndroid/src/main/java/com/facebook/react/bridge/PromiseImpl.java
        // usually has some fields like
        //   'code' (e.g. "EUNSPECIFIED")
        //   'message' (e.g. "Invalid notification (no valid small icon): Notification(channel=default pri=0 contentView=null vibrate=null sound=null defaults=0x0 flags=0x10 color=0x00000000 vis=PRIVATE)")
        //   'nativeStackAndroid' (e.g. ...giant array...)
        setDisplayNotificationErrors(unknownNativeErrorTryFormat(e));
    }
}

async function createTriggerNotification(dispatch: AppDispatch, channelId: string, triggerNotificationID: string | null) {
    const os = Platform.OS;
    if (os === 'ios') {
        console.log("No trigger notification on IOS.");
        return;
    }
    const trigger: IntervalTrigger = {
        type: TriggerType.INTERVAL,
        interval: 15,
        timeUnit: TimeUnit.MINUTES
    };

    // console.warn(`Current trigger: ${triggerNotificationID}`);

    const triggerNotif = defaultTriggerNotification(channelId, triggerNotificationID);
    console.log(`Creating trigger notification at ${timeNowAsString()}...`);
    try {
        const result = await notifee.createTriggerNotification(triggerNotif, trigger);
        console.log(`Created trigger notification ${result}`);
        dispatch(setTriggerNotificationID(result));
        return result;
    }
    catch (exception) {
        dispatch(setDisplayNotificationNativeErrors(`Error creating trigger notification: ${unknownNativeErrorTryFormat(exception)}`));
        Sentry.Native.captureException(exception);
    }
}


// async function sendToBackgroundByNavigatingHome(dispatch: AppDispatch) {
//     try {
//         const intentLauncherParams: IntentLauncherParams = {
//             data: `package:${androidPackageName()}`
//         }
//         const settingsActionResult: IntentLauncherResult = await startActivityAsync(ActivityAction.HOME_SETTINGS, intentLauncherParams);
//         console.log(`Bluetooth settings intent returned resultCode: "${settingsActionResult.resultCode}", "data: "${settingsActionResult.data}, extra: "${settingsActionResult.extra}"`);
//         if (settingsActionResult.resultCode !== 0) {
//             Sentry.Native.captureMessage(`Unexpected IntentLauncherResult: '${JSON.stringify(settingsActionResult)}'`);
//         }
//         // if (settingsActionResult === )
//         return;

//     }
//     catch(error) {
//         dispatch(setScanningStatusString(`Some kind of unexpected error when trying to open settings: ${unknownNativeErrorTryFormat(error, true)}`));
//         Sentry.Native.captureException(error);
//         return;
//     }
// }

const onClickStartNotificationButton = (dispatch: AppDispatch, notificationChannelID: string | null, triggerNotificationID: string | null, setErrorState: React.Dispatch<React.SetStateAction<string | null>>) => {
    console.log("Setting notification action to StartNotification");
    dispatch(setShouldUpload(true));
    // dispatch(setNotificationAction(NotificationAction.StartNotification));
    // handleClickDisplayNotification();
    // clickDisplayNotification(notificationChannelID, dispatch, triggerNotificationID);
    if (notificationChannelID === null) {
        const str = `notificationChannelID === null - cannot start notification!`;
        setErrorState(str);
        Sentry.Native.captureMessage(str);
        return;
    }
    dispatch(setBackgroundPollingEnabled(true));
    createTriggerNotification(dispatch, notificationChannelID, triggerNotificationID);
}


const onClickStopNotificationButton = (dispatch: AppDispatch, triggerNotificationID: string | null, serviceNotificationID: string | null) => {
    // dispatch(setNotificationAction(NotificationAction.StopNotification));
    // handleClickStopNotification();
    clickStopNotification(dispatch, triggerNotificationID, serviceNotificationID);
}

export function booleanIsBackroundPollingUploadingForButton(foregroundServiceNotificationID: string | null, notificationState: NotifeeNotificationHookState | undefined): boolean | null {

    if (notificationState === undefined) {
        return null;
    }

    if (
        (notificationState !== undefined ) && 
        foregroundServiceNotificationID && notificationState.triggerNotification) {
        // && 
        const os = Platform.OS;
        if (os === 'android') {
            if (!notificationState.channelID) {
                return false;
            }
        }
        return true;
    }
    // console.log(`notificationState.notificationID: ${notificationState.notificationID}, notificationState.triggerNotification: ${notificationState.triggerNotification}, notificationState.channelID:  ${notificationState.channelID}`)
    return false;

}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const StartOrStopButton = (props: {onPressAction?: () => any}) => {
    const dispatch = useDispatch();
    const notificationState = useSelector(selectNotificationState);

    const foregroundServiceNotificationID = useSelector(selectForegroundServiceNotificationID);
    const notificationChannelID = useSelector(selectNotificationChannelID);
    const triggerNotificationID = useSelector(selectTriggerNotificationID);
    const [errorState, setErrorState] = useState(null as (string | null)); 

    const callOnPressAction = () => {
        if (props.onPressAction) {
            props.onPressAction();
        }
    }

    const isBackroundPollingUploadingForButton = booleanIsBackroundPollingUploadingForButton(foregroundServiceNotificationID, notificationState);
    if (isBackroundPollingUploadingForButton === null) {
        return null;
    }

    if (isBackroundPollingUploadingForButton) {
        return (
            <>
                <Button title="Stop background polling" onPress={() => {onClickStopNotificationButton(dispatch, triggerNotificationID, foregroundServiceNotificationID)}}/>
            </>
        )
    }
    return (
        <>
            <MaybeIfValue text="Errors: " value={errorState}/>
            <Button title="Start background polling & uploading" onPress={() => { onClickStartNotificationButton(dispatch, notificationChannelID, triggerNotificationID, setErrorState); callOnPressAction() }} />
        </>
    )
}

export const NotificationInfo = () => {
    const batteryOptimizationEnabled = useSelector(selectBatteryOptimizationEnabled);
    const notificationNativeErrors = useSelector(selectDisplayNotificationNativeErrors);
    const notificationState = useSelector(selectNotificationState);
    // const foregroundServiceRegistered = useSelector(selectForegroundServiceRegistered);
    const foregroundServiceNotificationID = useSelector(selectForegroundServiceNotificationID);
    
    return (
        <>
            <StartOrStopButton/>
            
            <MaybeIfValue text="Errors from displaying notifications: " value={notificationState?.displayNotificationErrors} />
            <MaybeIfValueTrue text="WARNING: Battery optimization enabled!" value={batteryOptimizationEnabled} />
            <MaybeIfValue text="Notifee native errors (what?): " value={notificationNativeErrors} />
            {/* <MaybeIfValue text="Notification ID: " value={notificationState?.notificationID} /> */}
            <MaybeIfValue text="Trigger notification: " value={notificationState?.triggerNotification} />
            <MaybeIfValue text="Notification channel: " value={notificationState?.channelID} />
            {/* <MaybeIfValueTrue text="ForegroundService registered." value={foregroundServiceRegistered}/> */}
            <MaybeIfValue text="Foreground service notification id: " value={foregroundServiceNotificationID}/>
        </>
    )
}


export interface NotifeeNotificationHookState {
    // handleClickDisplayNotification: () => Promise<void>;
    displayNotificationErrors: string | null;
    channelID: string | null;
    triggerNotification: string | null;
    // handleClickStopNotification: () => Promise<void>;
    
    // Reeaaallly needs to be refactored.
    shouldUpload: boolean;


}

async function createNotificationChannel(dispatch: AppDispatch): Promise<void> {
    console.log("Channel not created yet, creating...");
    const channelIdResult = await checkedCreateChannel(dispatch);
    if (channelIdResult === null) {
        console.error("Channel creation failed! Native errors should be set.");
        return;
    }
    console.log(`Created notification channel: '${channelIdResult}'`);
    if (Platform.OS === 'android') {
        if ((channelIdResult === '')) {
            console.error("Channel creation returned an empty string? Native errors MAY be set.");
            Sentry.Native.captureMessage(`created Channel ID is null on Android?`);
            return;
        }
        dispatch(setNotificationChannelID(channelIdResult));
        return;
    }
    if (channelIdResult !== '') {
        console.warn(`Unexpected channel ID result ('${channelIdResult}') on non-android platform?`);
        Sentry.Native.captureMessage(`created Channel ID is NOT null: '${channelIdResult}'`);
        dispatch(setNotificationChannelID(channelIdResult));
    }
    return;

}

const init = async (channelID: string, dispatch: AppDispatch, triggerNotificationID: string | null) => {
    


    // console.log(`display notification result: ${result}`);
    // if (result !== undefined) {
    //     setNotificationID(result);
    // }
    if (triggerNotificationID !== null) {
        // console.warn(`Trigger notification already set! (${triggerNotificationID})(init)`);
        // // await notifee.cancelTriggerNotification(triggerNotificationID);
        // await notifee.cancelTriggerNotifications();
        return;
    }
    
    console.warn(`trigger init`);
    // console.warn("TODO: create trigger here?")
    const triggerResult = await createTriggerNotification(dispatch, channelID, triggerNotificationID);
    if (triggerResult !== triggerNotificationID) {
        if (triggerResult !== undefined) {
            dispatch(setTriggerNotificationID(triggerResult));
        }
        // console.warn(`created trigger notification ${triggerResult}`)
    }
    dispatch(setBackgroundPollingEnabled(true));
}


export async function stopUploadingAndPolling(dispatch: AppDispatch, triggerNotificationID: string | null, serviceNotificationID: string | null) {
    console.log("Stopping uploading and polling");
    dispatch(setBackgroundPollingEnabled(false));
    if (triggerNotificationID === null) {
        console.warn(`Trying to stop without a trigger notification ID?`);
        Sentry.Native.captureMessage(`Missing notification ID for trigger!`);
    }
    else {
        await notifee.cancelTriggerNotification(triggerNotificationID);
        dispatch(setTriggerNotificationID(null));
        const triggers = await notifee.getTriggerNotificationIds();
        console.log(`triggers:`)
        for (let i = 0; i < triggers.length; ++i) {
            console.log(`\t${i}: ${triggers[i]}`);
        }
        console.log(`----`);
    
    }

    // dispatch(setForegroundServiceRegistered(false));
    await notifee.stopForegroundService();
    if (serviceNotificationID === null) {
        console.warn(`Trying to stop without a service notification ID?`);
        Sentry.Native.captureMessage(`Missing notification ID for service!`);
    }
    // else if (serviceNotificationID === undefined) {
    //     dispatch(setForegroundServiceNotificationID(null));
    // }
    else {
        await notifee.cancelNotification(serviceNotificationID);
        dispatch(setForegroundServiceNotificationID(null));
    }
    await notifee.cancelTriggerNotifications();

}

// const useHasAvailableKnownDevice() {

// }


// function handleNotificationAction(dispatch: AppDispatch, notificationAction: NotificationAction | null, channelID: string | null, triggerNotification: string | null) {
//     switch (notificationAction) {
//         case (NotificationAction.StartNotification): {
//             console.log("notification start requested");
//             if (triggerNotification !== null) {
//                 console.warn(`triggerNotification !== null (triggerNotification), do I need to delete?`);
//                 notifee.cancelTriggerNotification(triggerNotification);

//             }
//             clickDisplayNotification(channelID, dispatch, triggerNotification);
//             break;
//         }
//         case (NotificationAction.StopNotification): {
//             console.log("notification stop requested");
//             clickStopNotification(dispatch);
//             break;
//         }
//     }
// }

const _handleAppStateChange = (nextAppState: AppStateStatus, appState: React.MutableRefObject<AppStateStatus>, setAppStateVisible: React.Dispatch<React.SetStateAction<AppStateStatus>>) => {
    if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
      console.log('App has come to the foreground!');
    }

    appState.current = nextAppState;
    setAppStateVisible(appState.current);
    console.log('AppState', appState.current);
  };


export const useNotifeeNotifications = (supportedDevices: UserInfoDevice[] | null, deviceID: string | null): NotifeeNotificationHookState => {
    const [displayNotificationErrors, setDisplayNotificationErrors] = useState(null as (string | null));

    // const [notificationID, setNotificationID] = useState(null as (string | null));
    // const [triggerNotificationID, setTriggerNotification] = useState(null as (string | null));


    const appState = useRef(AppState.currentState);
    const [appStateVisible, setAppStateVisible] = useState(appState.current);
    
    
    const triggerNotificationID = useSelector(selectTriggerNotificationID);
    const backgroundPollingEnabled = useSelector(selectBackgroundPollingEnabled);

    const userSettings = useSelector(selectUserSettings);

    const shouldUpload = useSelector(selectShouldUpload);
    const channelID = useSelector(selectNotificationChannelID);
    // const notificationAction = useSelector(selectNotificationAction);

    const hasBluetooth = useSelector(selectHasBluetooth);
    // const foregroundServiceRegistered = useSelector(selectForegroundServiceRegistered);
    const foregroundServiceNotificationID = useSelector(selectForegroundServiceNotificationID);

    const {loggedIn, jwt} = useIsLoggedIn();

    const dispatch = useDispatch();

    // useEffect(() => {
    //     handleNotificationAction(dispatch, channelID, triggerNotificationID);
    // }, [channelID, dispatch, triggerNotificationID])

    useEffect(() => {
        if (channelID === null) {
            createNotificationChannel(dispatch);
        }
    }, [channelID])

    // useEffect(() => {
        
    //     createOrUpdateNotification(setDisplayNotificationErrors, channelID, dispatch, triggerNotificationID);
    // }, [supportedDevices, channelID, dispatch, triggerNotificationID])

    useEffect(() => {
        createForeground(setDisplayNotificationErrors, deviceID, supportedDevices, channelID, jwt, shouldUpload, backgroundPollingEnabled, dispatch, triggerNotificationID, hasBluetooth, foregroundServiceNotificationID, userSettings);
    }, [deviceID, supportedDevices, channelID, backgroundPollingEnabled, userSettings, jwt, shouldUpload, dispatch, hasBluetooth, foregroundServiceNotificationID, triggerNotificationID])

    // https://docs.expo.dev/versions/latest/react-native/appstate/  
    useEffect(() => {
        const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => _handleAppStateChange(nextAppState, appState, setAppStateVisible));
      return () => {
        subscription.remove();
      };
    }, []);
  

    useEffect(() => {
        checkBatteryOptimization(dispatch);
    }, [])

    return { displayNotificationErrors, channelID, triggerNotification: triggerNotificationID, shouldUpload }
}

function checkBatteryOptimization(dispatch: AppDispatch) {
    notifee.isBatteryOptimizationEnabled().then((result) => {
        // console.log(`Battery optimization: ${result}`);
        return dispatch(setBatteryOptimizationEnabled(result));
    }).catch((exception) => {
        dispatch(setDisplayNotificationNativeErrors(`Error in isBatteryOptimizationEnabled: '${unknownNativeErrorTryFormat(exception)}'`));
        Sentry.Native.captureException(exception);
        // In theory, the native java code can throw exceptions if something is desperatley wrong...
    });
}

async function clickDisplayNotification(channelID: string | null, dispatch: AppDispatch, currentTriggerNotification: string | null) {
    dispatch(setBackgroundPollingEnabled(true));
    return;


    // // stopServiceAndClearNotifications(dispatch);
    // let channelId_ = channelID;
    // if (channelId_ === null) {
    //     console.log("Channel not created yet, creating...");
    //     channelId_ = await checkedCreateChannel(dispatch);
    //     if (channelId_ === null) {
    //         console.error("Channel creation failed! Native errors should be set.");
    //         return;
    //     }
    //     dispatch(setNotificationChannelID(channelId_));
    //     // return;

    // }

    // if (currentTriggerNotification !== null) {
    //     console.warn(`Trigger notification already set! (${currentTriggerNotification})(clickDisplayNotification)`);
    // }
    // const triggerResult = await createTriggerNotification(dispatch, channelId_, currentTriggerNotification);
    // if (triggerResult !== undefined) {
    //     console.warn(`Created trigger notification: ${triggerResult}`);
    //     dispatch(setTriggerNotificationID(triggerResult));
    // }
    // else {
    //     console.error(`Unexpected error creating trigger notification?`);
    // }
    // dispatch(setBackgroundPollingEnabled(true));

}


async function clickStopNotification(dispatch: AppDispatch, triggerNotificationID: string | null, serviceNotificationID: string | null) {
    await stopUploadingAndPolling(dispatch, triggerNotificationID, serviceNotificationID);
    dispatch(setShouldUpload(false));
}

function allParametersReady(deviceID: string | null, supportedDevices: UserInfoDevice[] | null, channelID: string | null, jwt: string | null, shouldUpload: boolean, backgroundPollingEnabled: boolean, hasBluetooth: boolean | null, userSettings?: UserSettings | null): boolean {
    if (!backgroundPollingEnabled) {
        console.log("NOT polling in background.");
        return false;
    }
    if (jwt === null) {
        console.log("Can't start polling, not logged in.");
        return false;
    }
    if (userSettings === null) {
        console.log("Can't start polling yet, no user settings.");
        alert("You need to create settings in the web console first!");
        return false;
    }

    if (userSettings === undefined) {
        console.log("Can't start polling yet, loading user settings.");
        // alert("Still loading user settings, are you logged in?");
        return false;
    }

    if (hasBluetooth === null) {
        console.log("Can't start polling yet, bluetooth permissions checks still in progress...");
        return false;
    }
    if (!hasBluetooth) {
        console.log("Can't start polling yet, bluetooth not available...");
        return false;
    }
    if (!shouldUpload) {
        console.log("Can't start polling yet, !shouldUpload");
        return false;
    }
    if (deviceID === null) {
        console.log("Need to connect to device before starting service...");
        return false;
    }
    if (supportedDevices === null) {
        console.error("Supported devices field is null in notification init code!");
        // if (!loggedIn) {
        //     alert("Please log in.");
        //     return;
        // }
        console.log("need to load user info before starting service...");
        return false;
    }
    if (channelID === null) {
        console.log(`Channel not created yet.`)
        return false;
    }

    return true;
}



function basicParametersReady(channelID: string | null): boolean {
    if (channelID === null) {
        console.log(`Channel not created yet.`)
        return false;
    }

    return true;
}


function createForeground(setDisplayNotificationErrors: React.Dispatch<React.SetStateAction<string | null>>, deviceID: string | null, supportedDevices: UserInfoDevice[] | null, channelID: string | null, jwt: string | null, shouldUpload: boolean, backgroundPollingEnabled: boolean, dispatch: AppDispatch, triggerNotificationID: string | null, hasBluetooth: boolean | null, foregroundServiceNotificationID: string | null,userSettings?: UserSettings | null) {
    if (!allParametersReady(deviceID, supportedDevices, channelID, jwt, shouldUpload, backgroundPollingEnabled, hasBluetooth, userSettings)) {
        return;
    }
    try {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        startForegroundService(setDisplayNotificationErrors, channelID!, deviceID!, supportedDevices!, userSettings!, jwt!, shouldUpload, dispatch, triggerNotificationID, foregroundServiceNotificationID);
        
    }
    catch (error) {
        const str = `Native error: ${unknownNativeErrorTryFormat(error)}`;
        setDisplayNotificationErrors(str);
        console.error(str);
    }

}

function createOrUpdateNotification(setDisplayNotificationErrors: React.Dispatch<React.SetStateAction<string | null>>, channelID: string | null, dispatch: AppDispatch, triggerNotificationID: string | null) {
    if (!basicParametersReady(channelID)) {
        return;
    }


    console.log("polling in background.");
    try {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        init(channelID!, dispatch, triggerNotificationID);
    }
    catch (error) {
        const str = `Native error: ${unknownNativeErrorTryFormat(error)}`;
        setDisplayNotificationErrors(str);
        console.error(str);
    }
}

