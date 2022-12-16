import notifee, {NotificationSettings, Notification, EventType, Event, TriggerType, TimeUnit, IntervalTrigger, AndroidImportance} from '@notifee/react-native';
import { ActivityAction, IntentLauncherParams, IntentLauncherResult, startActivityAsync } from 'expo-intent-launcher';
import {useState, useEffect, useRef} from 'react';
import { Button, AppState, AppStateStatus, Platform } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import * as Sentry from 'sentry-expo';

import { UserInfoDevice } from '../../../../co2_client/src/utils/DeviceInfoTypes';
import { UserSettings } from '../../../../co2_client/src/utils/UserSettings';
import { selectBackgroundPollingEnabled, selectBatteryOptimizationEnabled, selectJWT, selectShouldUpload, setBackgroundPollingEnabled, setBatteryOptimizationEnabled,  setShouldUpload } from '../../app/globalSlice';
import { AppDispatch } from '../../app/store';
import { unknownNativeErrorTryFormat } from '../../utils/FormatUnknownNativeError';
import { MaybeIfValue } from '../../utils/RenderValues';
import { timeNowAsString } from '../../utils/TimeNow';
import { useIsLoggedIn } from '../../utils/UseLoggedIn';
import { MeasurementDataForUpload } from '../Measurement/MeasurementTypes';
import { uploadMeasurementHeadless } from '../Measurement/MeasurementUpload';
import { onHeadlessTaskTriggerBluetooth } from '../bluetooth/Bluetooth';
import { selectDeviceID, setScanningStatusString } from '../bluetooth/bluetoothSlice';
import { initialUserDevicesState, selectSupportedDevices } from '../userInfo/devicesSlice';
import { selectUserSettings } from '../userInfo/userInfoSlice';
import {logEvent} from './LogEvent';
import { setNotificationChannelID, selectNotificationChannelID, setDisplayNotificationNativeErrors, selectDisplayNotificationNativeErrors, setNotificationAction, NotificationAction, selectNotificationAction, selectNotificationState } from './serviceSlice';



function defaultNotification(channelId: string): Notification {
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
        },
        ios: {
          interruptionLevel: 'passive'  
        }
    }
    return defaultNotificationOptions;
}


function defaultTriggerNotification(channelId: string): Notification {
    const defaultNotificationOptions: Notification = {
        // See: co2_native_client\node_modules\@notifee\react-native\dist\types\Notification.d.ts
        // See: co2_native_client\node_modules\@notifee\react-native\dist\types\NotificationAndroid.d.ts

        // See also: https://notifee.app/react-native/docs/android/appearance#small-icons
        title: 'CO2 tracker', // "The notification title which appears above the body text."
        body: 'Updating TRIGGERED...', // "The main body content of a notification."
        android: { // "Android specific notification options. See the [`NotificationAndroid`](/react-native/reference/notificationandroid) interface for more information and default options which are applied to a notification."
            channelId, // "Specifies the `AndroidChannel` which the notification will be delivered on."
            smallIcon: 'ic_small_icon', // optional, defaults to 'ic_launcher'.
            timeoutAfter: (1000 * 60),
            onlyAlertOnce: true,
            importance: AndroidImportance.LOW
        }
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
        dispatch(setDisplayNotificationNativeErrors(`Error in requestPermission: '${unknownNativeErrorTryFormat(exception)}'`));
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


async function handleForegroundServiceEvent(event: Event, deviceID: string, supportedDevices: UserInfoDevice[], userSettings: UserSettings, jwt: string, shouldUpload: boolean) {
    
    
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
            stopServiceAndClearNotifications();
            return;
        }
        console.log(`...Unexpected pressAction? ${event.detail.pressAction.id}`);
    }

    else if (event.type === EventType.DELIVERED) {
        const eventMessage = logEvent('foreground', event);
        console.log(`-------\r\n\t(SERVICE, ${timeNowAsString()})${eventMessage}: ${JSON.stringify(event)}`);
        

        if (event.detail.notification === undefined) {
            throw new Error("Missing notification content in detail!");
        }
        if (event.detail.notification.id === undefined) {
            throw new Error("Missing notification ID in detail!");
        }

        console.log("Likely event trigger?");
        console.log(`Starting headless task with deviceID: ${deviceID}, supportedDevices: ${JSON.stringify(supportedDevices)}`);
        const result: MeasurementDataForUpload | null = await onHeadlessTaskTriggerBluetooth(deviceID, supportedDevices);
        console.log(`Read this value!\n\t${JSON.stringify(await result)}`);
        await notifee.cancelDisplayedNotification(event.detail.notification.id);
        await uploadMeasurementHeadless(result, userSettings, jwt, shouldUpload);
    }
    else {
        const eventMessage = logEvent('foreground', event);
        console.log(`-------\r\n(SERVICE, ${timeNowAsString()})${eventMessage} (unimplemented event handling for this event.): ${JSON.stringify(event)}`);
    }
}

async function handleBackgroundEvent(event: Event, deviceID: string, supportedDevices: UserInfoDevice[], userSettings: UserSettings, jwt: string, shouldUpload: boolean, dispatch: AppDispatch) {
    const eventMessage = logEvent('background', event);
    console.log(`-------\r\n(SERVICE, ${timeNowAsString()})${eventMessage} (unimplemented event handling for this event.): ${JSON.stringify(event)}`);

    if (event.detail.notification === undefined) {
        const errorMessageStr = `Error in handleBackgroundEvent: event.detail.notification is undefined, probably a native error?`;
        dispatch(setDisplayNotificationNativeErrors(errorMessageStr));
        Sentry.Native.captureMessage(errorMessageStr);
        // Sentry.Native.captureException(exception);
        return;
    }
    if (event.detail.notification.id === undefined) {
        const errorMessageStr = `Error in handleBackgroundEvent: event.detail.notification.id is undefined, probably a native error?`;
        dispatch(setDisplayNotificationNativeErrors(errorMessageStr));
        Sentry.Native.captureMessage(errorMessageStr);
        // Sentry.Native.captureException(exception);
        return;
    }

    await notifee.cancelNotification(event.detail.notification.id);
}

const foregroundServiceCallback = (notification: Notification, deviceID: string, supportedDevices: UserInfoDevice[], userSettings: UserSettings, jwt: string, shouldUpload: boolean, dispatch: AppDispatch): Promise<void> => {
    console.log(`--------FOREGROUND SERVICE CALLBACK ${JSON.stringify(notification)}------`);
    return new Promise(() => {
        console.log("Registering notification service event handlers...");
        // https://notifee.app/react-native/docs/android/foreground-service
        notifee.onForegroundEvent((event: Event) => {return handleForegroundServiceEvent(event, deviceID, supportedDevices, userSettings, jwt, shouldUpload)});
        notifee.onBackgroundEvent((event: Event) => {return handleBackgroundEvent(event, deviceID, supportedDevices, userSettings, jwt, shouldUpload, dispatch)});
        // debugger;
    })
}

function registerForegroundService(deviceID: string, supportedDevices: UserInfoDevice[], userSettings: UserSettings, jwt: string, shouldUpload: boolean, dispatch: AppDispatch) {
    try {
        console.log("Registering foreground service...");
        notifee.registerForegroundService((notification: Notification) => foregroundServiceCallback(notification, deviceID, supportedDevices, userSettings, jwt, shouldUpload, dispatch));
    }
    catch (exception) {
        dispatch(setDisplayNotificationNativeErrors(`Error in registerForegroundService: '${unknownNativeErrorTryFormat(exception)}'`));
        Sentry.Native.captureException(exception);
        //Probably native error.
    }
}

async function registerBackgroundEventHandler(deviceID: string, supportedDevices: UserInfoDevice[], userSettings: UserSettings, jwt: string, shouldUpload: boolean, dispatch: AppDispatch): Promise<void> {
    try {
        console.log("Registering background event handler...");
        notifee.onBackgroundEvent((event: Event) => {return handleBackgroundEvent(event, deviceID, supportedDevices, userSettings, jwt, shouldUpload, dispatch)})
    }
    catch (exception) {
        dispatch(setDisplayNotificationNativeErrors(`Error in registerBackgroundEventHandler: '${unknownNativeErrorTryFormat(exception)}'`));
        Sentry.Native.captureException(exception);
        //Probably native error.
    }
}

//https://notifee.app/react-native/docs/displaying-a-notification
async function onDisplayNotification(setDisplayNotificationErrors: React.Dispatch<React.SetStateAction<string | null>>, channelId: string, deviceID: string, supportedDevices: UserInfoDevice[], userSettings: UserSettings, jwt: string, shouldUpload: boolean, dispatch: AppDispatch) {
    // Create a channel

    //https://github.com/invertase/notifee/blob/7d03bb4eda27b5d4325473cf155852cef42f5909/docs/react-native/docs/debugging.md
    // To quickly view Android logs in the terminal:
    //   adb logcat '*:S' NOTIFEE:D
    const os = Platform.OS;
    if (os === 'android') {
        console.log("Creating foreground service...");
        await registerForegroundService(deviceID, supportedDevices, userSettings, jwt, shouldUpload, dispatch);
    }
    else if (os === 'ios') {
        console.log('creating ios background event handler...');
        registerBackgroundEventHandler(deviceID, supportedDevices, userSettings, jwt, shouldUpload, dispatch);
    }
    else {
        console.error("unimplemented");
        throw new Error("tf?")
    }

    // Required for iOS
    // See https://notifee.app/react-native/docs/ios/permissions
    const settings = await checkedRequestPermission(dispatch);
    console.log(`notification permission settings: ${JSON.stringify(settings)}`);

    const notificationWithChannel = defaultNotification(channelId);
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
        const result = await notifee.displayNotification(notificationWithChannel);
        console.assert(result !== null);
        console.assert(result !== undefined);
        console.assert(typeof result === 'string');
        console.log("Sucessfully displayed notifee notification.");
        setDisplayNotificationErrors(null);
        return result;
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

async function createTriggerNotification(dispatch: AppDispatch, channelId: string) {
    const trigger: IntervalTrigger = {
        type: TriggerType.INTERVAL,
        interval: 15,
        timeUnit: TimeUnit.MINUTES
    };

    const triggerNotif = defaultTriggerNotification(channelId);
    console.log(`Creating trigger notification at ${timeNowAsString()}...`);
    try {
        const result = await notifee.createTriggerNotification(triggerNotif, trigger);
        console.log(`Created trigger notification ${result}`);
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

const onClickStartNotificationButton = (dispatch: AppDispatch) => {
    console.log("Setting notification action to StartNotification");
    dispatch(setShouldUpload(false));
    dispatch(setShouldUpload(true));
    dispatch(setNotificationAction(NotificationAction.StartNotification));
    // handleClickDisplayNotification();
}


const onClickStopNotificationButton = (dispatch: AppDispatch) => {
    dispatch(setNotificationAction(NotificationAction.StopNotification));
    // handleClickStopNotification();
}

export function booleanIsBackroundPollingUploadingForButton(notificationState: NotifeeNotificationHookState | undefined): boolean | null {

    if (notificationState === undefined) {
        return null;
    }

    if (
        (notificationState !== undefined ) && 
        notificationState.notificationID && notificationState.triggerNotification) {
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

    const callOnPressAction = () => {
        if (props.onPressAction) {
            props.onPressAction();
        }
    }

    const isBackroundPollingUploadingForButton = booleanIsBackroundPollingUploadingForButton(notificationState);
    if (isBackroundPollingUploadingForButton === null) {
        return null;
    }

    if (isBackroundPollingUploadingForButton) {
        return (
            <>
                <Button title="Stop background polling" onPress={() => {onClickStopNotificationButton(dispatch)}}/>
            </>
        )
    }
    return (
        <>
            <Button title="Start background polling & uploading" onPress={() => { onClickStartNotificationButton(dispatch); callOnPressAction() }} />
        </>
    )
}

export const NotificationInfo = () => {
    const batteryOptimizationEnabled = useSelector(selectBatteryOptimizationEnabled);
    const notificationNativeErrors = useSelector(selectDisplayNotificationNativeErrors);
    const notificationState = useSelector(selectNotificationState);
    return (
        <>
            <StartOrStopButton/>
            
            <MaybeIfValue text="Errors from displaying notifications: " value={notificationState?.displayNotificationErrors} />
            <MaybeIfValue text="Battery optimization enabled: " value={(batteryOptimizationEnabled === null) ? null : String(batteryOptimizationEnabled)} />
            <MaybeIfValue text="Notifee native errors (what?): " value={notificationNativeErrors} />
            <MaybeIfValue text="Notification ID: " value={notificationState?.notificationID} />
            <MaybeIfValue text="Trigger notification: " value={notificationState?.triggerNotification} />
            <MaybeIfValue text="Notification channel: " value={notificationState?.channelID} />
        </>
    )
}


export interface NotifeeNotificationHookState {
    // handleClickDisplayNotification: () => Promise<void>;
    displayNotificationErrors: string | null;
    notificationID: string | null;
    channelID: string | null;
    triggerNotification: string | null;
    // handleClickStopNotification: () => Promise<void>;
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

const init = async (setDisplayNotificationErrors: React.Dispatch<React.SetStateAction<string | null>>, deviceID: string | null, supportedDevices: UserInfoDevice[] | null, setNotificationID: React.Dispatch<React.SetStateAction<string | null>>, channelID: string | null, loggedIn: boolean, userSettings: UserSettings, jwt: string, shouldUpload: boolean, dispatch: AppDispatch, setTriggerNotification: React.Dispatch<React.SetStateAction<string | null>>, currentTriggerNotification: string | null) => {
    if (channelID === null) {
        return await createNotificationChannel(dispatch);
    }

    if (deviceID === null) {
        console.log("Need to connect to device before starting service...");
        return;
    }
    if (supportedDevices === null) {
        console.error("Supported devices field is null in notification init code!");
        if (!loggedIn) {
            alert("Please log in.");
            return;
        }
        console.log("need to load user info before starting service...");
        return;
    }
    if (supportedDevices === initialUserDevicesState.userSupportedDevices) {
        console.warn("Supported devices still loading?");
        return;
    }

    const result = await onDisplayNotification(setDisplayNotificationErrors, channelID, deviceID, supportedDevices, userSettings, jwt, shouldUpload, dispatch);
    if (result !== undefined) {
        setNotificationID(result);
    }
    if (currentTriggerNotification !== null) {
        console.warn(`Trigger notification already set! (init)`);
    }
    // console.warn("TODO: create trigger here?")
    const triggerResult = await createTriggerNotification(dispatch, channelID);
    if (triggerResult !== undefined) {
        setTriggerNotification(triggerResult);
    }
    else {
        console.error(`Unexpected error creating trigger notification?`);
    }
    dispatch(setBackgroundPollingEnabled(true));
}


export async function stopServiceAndClearNotifications() {
    console.log("Stopping service, cancelling notifications...");
    await notifee.stopForegroundService();
    await notifee.cancelAllNotifications();
    await notifee.cancelTriggerNotifications();
}

export const useNotifeeNotifications = (): NotifeeNotificationHookState => {
    const [displayNotificationErrors, setDisplayNotificationErrors] = useState(null as (string | null));
    // const [nativeErrors, setNativeErrors] = useState(null as (string | null));    
    const [notificationID, setNotificationID] = useState(null as (string | null));
    const [triggerNotification, setTriggerNotification] = useState(null as (string | null));

    const appState = useRef(AppState.currentState);
    const [appStateVisible, setAppStateVisible] = useState(appState.current);

    const deviceID = useSelector(selectDeviceID);
    const supportedDevices = useSelector(selectSupportedDevices);
    const backgroundPollingEnabled = useSelector(selectBackgroundPollingEnabled);

    const userSettings = useSelector(selectUserSettings);
    const jwt = useSelector(selectJWT);
    const shouldUpload = useSelector(selectShouldUpload);
    const channelID = useSelector(selectNotificationChannelID);
    const notificationAction = useSelector(selectNotificationAction);

    const {loggedIn} = useIsLoggedIn();

    const dispatch = useDispatch();

    // const handleClickDisplayNotification = async () => {
        
    // }

    // const handleClickStopNotification = async () => {
        
    // }


    useEffect(() => {
        switch (notificationAction) {
            case (NotificationAction.StartNotification): {
                console.log("notification start requested");
                if (triggerNotification !== null) {
                    console.warn(`triggerNotification !== null (triggerNotification), do I need to delete?`);
                }
                clickDisplayNotification(channelID, setTriggerNotification, dispatch, triggerNotification);
                break;
            }
            case (NotificationAction.StopNotification): {
                console.log("notification stop requested");
                clickStopNotification(setTriggerNotification, dispatch, setNotificationID);
                break;
            }
        }
    }, [notificationAction, channelID, dispatch])

    useEffect(() => {
        createOrUpdateNotification(setDisplayNotificationErrors, deviceID, supportedDevices, setNotificationID, channelID, loggedIn, jwt, shouldUpload, backgroundPollingEnabled, dispatch, setTriggerNotification, triggerNotification, userSettings);
        return (() => {
            // console.log("(cleanup) from notifee hook destructor")
            stopServiceAndClearNotifications();
        })
    }, [deviceID, supportedDevices, channelID, backgroundPollingEnabled, loggedIn, userSettings, jwt, shouldUpload, dispatch])

    // https://docs.expo.dev/versions/latest/react-native/appstate/  
    useEffect(() => {
        const subscription = AppState.addEventListener('change', _handleAppStateChange);
      return () => {
        // AppState.removeEventListener('change', _handleAppStateChange);
        subscription.remove();
      };
    }, []);
  
    const _handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        console.log('App has come to the foreground!');
      }
  
      appState.current = nextAppState;
      setAppStateVisible(appState.current);
      console.log('AppState', appState.current);
    };

    useEffect(() => {
        checkBatteryOptimization(dispatch);
    }, [])

    return { displayNotificationErrors, notificationID, channelID, triggerNotification }
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

async function clickDisplayNotification(channelID: string | null, setTriggerNotification: React.Dispatch<React.SetStateAction<string | null>>, dispatch: AppDispatch, currentTriggerNotification: string | null) {
    stopServiceAndClearNotifications();
    let channelId_ = channelID;
    if (channelId_ === null) {
        console.log("Channel not created yet, creating...");
        channelId_ = await checkedCreateChannel(dispatch);
        if (channelId_ === null) {
            console.error("Channel creation failed! Native errors should be set.");
            return;
        }
        dispatch(setNotificationChannelID(channelId_));
        // return;

    }

    if (currentTriggerNotification !== null) {
        console.warn(`Trigger notification already set! (clickDisplayNotification)`);
    }
    const triggerResult = await createTriggerNotification(dispatch, channelId_);
    if (triggerResult !== undefined) {
        setTriggerNotification(triggerResult);
    }
    else {
        console.error(`Unexpected error creating trigger notification?`);
    }
    dispatch(setBackgroundPollingEnabled(true));

}


async function clickStopNotification(setTriggerNotification: React.Dispatch<React.SetStateAction<string | null>>, dispatch: AppDispatch, setNotificationID: React.Dispatch<React.SetStateAction<string | null>>) {
    stopServiceAndClearNotifications();
    dispatch(setNotificationChannelID(null));
    setTriggerNotification(null);
    dispatch(setBackgroundPollingEnabled(false));
    setNotificationID(null);
    dispatch(setShouldUpload(false));
}

function createOrUpdateNotification(setDisplayNotificationErrors: React.Dispatch<React.SetStateAction<string | null>>, deviceID: string | null, supportedDevices: UserInfoDevice[] | null, setNotificationID: React.Dispatch<React.SetStateAction<string | null>>, channelID: string | null, loggedIn: boolean, jwt: string | null, shouldUpload: boolean, backgroundPollingEnabled: boolean, dispatch: AppDispatch, setTriggerNotification: React.Dispatch<React.SetStateAction<string | null>>, triggerNotification: string | null, userSettings?: UserSettings | null) {
    if (!backgroundPollingEnabled) {
        console.log("NOT polling in background.");
        return;
    }
    if (jwt === null) {
        console.log("Can't start polling, not logged in.");
        return;
    }
    if (userSettings === null) {
        console.log("Can't start polling yet, no user settings.");
        alert("You need to create settings in the web console first!");
        return;
    }

    if (userSettings === undefined) {
        console.log("Can't start polling yet, loading user settings.");
        alert("Still loading user settings, are you logged in?");
        return;
    }

    console.log("polling in background.");
    init(setDisplayNotificationErrors, deviceID, supportedDevices, setNotificationID, channelID, loggedIn, userSettings, jwt, shouldUpload, dispatch, setTriggerNotification);
}

