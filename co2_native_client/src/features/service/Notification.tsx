import notifee, {IOSNotificationSettings, Notification, EventType, Event, TriggerType, TimeUnit, IntervalTrigger, AndroidImportance} from '@notifee/react-native';
import {useState, useEffect, useRef} from 'react';
import { Button, AppState, AppStateStatus } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import * as Sentry from 'sentry-expo';

import { UserInfoDevice } from '../../../../co2_client/src/utils/DeviceInfoTypes';
import { UserSettings } from '../../../../co2_client/src/utils/UserSettings';
import { selectBackgroundPollingEnabled, selectJWT, selectShouldUpload, setBackgroundPollingEnabled, setBatteryOptimizationEnabled, setShouldUpload } from '../../app/globalSlice';
import { AppDispatch } from '../../app/store';
import { MaybeIfValue } from '../../utils/RenderValues';
import { useIsLoggedIn } from '../../utils/UseLoggedIn';
import { MeasurementDataForUpload } from '../Measurement/MeasurementTypes';
import { uploadMeasurementHeadless } from '../Measurement/MeasurementUpload';
import { onHeadlessTaskTriggerBluetooth } from '../bluetooth/Bluetooth';
import { selectDeviceID } from '../bluetooth/bluetoothSlice';
import { selectSupportedDevices } from '../userInfo/devicesSlice';
import { selectUserSettings } from '../userInfo/userInfoSlice';
import {logEvent} from './LogEvent';
import { timeNowAsString } from '../../utils/TimeNow';

function defaultNotification(channelId: string): Notification {
    const defaultNotificationOptions: Notification = {
        // See: co2_native_client\node_modules\@notifee\react-native\dist\types\Notification.d.ts
        // See: co2_native_client\node_modules\@notifee\react-native\dist\types\NotificationAndroid.d.ts

        // See also: https://notifee.app/react-native/docs/android/appearance#small-icons
        title: 'COVID CO2 tracker', // "The notification title which appears above the body text."
        body: 'COVID CO2 tracker service is running.', // "The main body content of a notification."
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
            ]
        }
    }
    return defaultNotificationOptions;
}


function defaultTriggerNotification(channelId: string): Notification {
    const defaultNotificationOptions: Notification = {
        // See: co2_native_client\node_modules\@notifee\react-native\dist\types\Notification.d.ts
        // See: co2_native_client\node_modules\@notifee\react-native\dist\types\NotificationAndroid.d.ts

        // See also: https://notifee.app/react-native/docs/android/appearance#small-icons
        title: 'COVID CO2 tracker', // "The notification title which appears above the body text."
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


async function checkedCreateChannel(setNativeErrors: React.Dispatch<React.SetStateAction<string | null>>): Promise<string | null> {
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
        Sentry.Native.captureException(exception);
        setNativeErrors(`Error in createChannel: '${String(exception)}'`);
        return null;
    }
}

async function checkedRequestPermission(setNativeErrors: React.Dispatch<React.SetStateAction<string | null>>): Promise<IOSNotificationSettings | null> {
    try {
        return await notifee.requestPermission();
    }
    catch (exception) {
        //Probably native error.
        Sentry.Native.captureException(exception);
        setNativeErrors(`Error in requestPermission: '${String(exception)}'`);
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


async function handleForegroundServiceEvent({ type, detail }: Event, deviceID: string, supportedDevices: UserInfoDevice[], foreground: string, userSettings: UserSettings, jwt: string, shouldUpload: boolean) {
    
    
    if (type === EventType.ACTION_PRESS) {
        const eventMessage = logEvent(foreground, { type, detail });
        console.log(`-------\r\n(SERVICE, ${timeNowAsString()})${eventMessage}: ${JSON.stringify(detail)}`);
        

        if (!detail) {
            console.warn("missing notification event detail?");
            return;
        }
        if (detail.pressAction === undefined) {
            console.warn("missing notification event detail pressAction?");
            return;
        }
        if (detail.pressAction.id === 'stop') {
            console.log("Stopping foreground service...");
            notifee.stopForegroundService();
            notifee.cancelAllNotifications();
            notifee.cancelTriggerNotifications();
            return;
        }
        console.log(`...Unexpected pressAction? ${detail.pressAction.id}`);
    }

    else if (type === EventType.DELIVERED) {
        const eventMessage = logEvent(foreground, { type, detail });
        console.log(`-------\r\n\t(SERVICE, ${timeNowAsString()})${eventMessage}: ${JSON.stringify(detail)}`);
        

        if (detail.notification === undefined) {
            throw new Error("Missing notification content in detail!");
        }
        if (detail.notification.id === undefined) {
            throw new Error("Missing notification ID in detail!");
        }

        console.log("Likely event trigger?");
        console.log(`Starting headless task with deviceID: ${deviceID}, supportedDevices: ${JSON.stringify(supportedDevices)}`);
        const result: MeasurementDataForUpload | null = await onHeadlessTaskTriggerBluetooth(deviceID, supportedDevices);
        console.log(`Read this value!\n\t${JSON.stringify(await result)}`);
        await notifee.cancelDisplayedNotification(detail.notification.id);
        await uploadMeasurementHeadless(result, userSettings, jwt, shouldUpload);
    }
    else {
        const eventMessage = logEvent(foreground, { type, detail });
        console.log(`-------\r\n(SERVICE, ${timeNowAsString()})${eventMessage} (unimplemented event handling for this event.): ${JSON.stringify(detail)}`);
    }
}

const foregroundServiceCallback = (notification: Notification, deviceID: string, supportedDevices: UserInfoDevice[], userSettings: UserSettings, jwt: string, shouldUpload: boolean): Promise<void> => {
    console.log(`--------FOREGROUND SERVICE CALLBACK ${JSON.stringify(notification)}------`);
    return new Promise(() => {
        console.log("Registering notification service event handlers...");
        // https://notifee.app/react-native/docs/android/foreground-service
        notifee.onForegroundEvent(({ type, detail }: Event) => {return handleForegroundServiceEvent({type, detail}, deviceID, supportedDevices, 'foreground', userSettings, jwt, shouldUpload)});
        notifee.onBackgroundEvent(({ type, detail }: Event) => {return handleForegroundServiceEvent({type, detail}, deviceID, supportedDevices, 'background', userSettings, jwt, shouldUpload)});
        // debugger;
    })
}

async function registerForegroundService(setNativeErrors: React.Dispatch<React.SetStateAction<string | null>>, deviceID: string, supportedDevices: UserInfoDevice[], userSettings: UserSettings, jwt: string, shouldUpload: boolean): Promise<void> {
    try {
        console.log("Registering foreground service...");
        notifee.registerForegroundService((notification: Notification) => foregroundServiceCallback(notification, deviceID, supportedDevices, userSettings, jwt, shouldUpload));
    }
    catch (exception) {
        Sentry.Native.captureException(exception);
        //Probably native error.
        setNativeErrors(`Error in registerForegroundService: '${String(exception)}'`);
    }
}

//https://notifee.app/react-native/docs/displaying-a-notification
async function onDisplayNotification(setDisplayNotificationErrors: React.Dispatch<React.SetStateAction<string | null>>, setNativeErrors: React.Dispatch<React.SetStateAction<string | null>>, channelId: string, deviceID: string, supportedDevices: UserInfoDevice[], userSettings: UserSettings, jwt: string, shouldUpload: boolean) {
    // Create a channel

    //https://github.com/invertase/notifee/blob/7d03bb4eda27b5d4325473cf155852cef42f5909/docs/react-native/docs/debugging.md
    // To quickly view Android logs in the terminal:
    //   adb logcat '*:S' NOTIFEE:D

    console.log("Creating foreground service...");
    await registerForegroundService(setNativeErrors, deviceID, supportedDevices, userSettings, jwt, shouldUpload);

    // Required for iOS
    // See https://notifee.app/react-native/docs/ios/permissions
    await checkedRequestPermission(setNativeErrors);


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
        Sentry.Native.captureException(e);
        console.error(`Error displaying notification! ${String(e)}`);
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
        setDisplayNotificationErrors(String(e));
    }
}

async function createTriggerNotification(setNativeErrors: React.Dispatch<React.SetStateAction<string | null>>, channelId: string) {
    const trigger: IntervalTrigger = {
        type: TriggerType.INTERVAL,
        interval: 15,
        timeUnit: TimeUnit.MINUTES
    };

    const triggerNotif = defaultTriggerNotification(channelId);
    console.log(`Creating trigger notification at ${timeNowAsString()}...`);
    try {
        const result = await notifee.createTriggerNotification(triggerNotif, trigger);
        return result;
    }
    catch (exception) {
        Sentry.Native.captureException(exception);
        setNativeErrors(`Error creating trigger notification: ${String(exception)}`);
    }
}


const onClickNotificationButton = (handleClickDisplayNotification: () => Promise<void>, dispatch: AppDispatch) => {
    dispatch(setShouldUpload(false));
    dispatch(setShouldUpload(true));
    handleClickDisplayNotification();
    dispatch(setBackgroundPollingEnabled(true));
}


export const NotificationInfo = (props: { notificationState: NotifeeNotificationHookState, batteryOptimizationEnabled: boolean | null}) => {
    const dispatch = useDispatch();
    return (
        <>
            <Button title="Start background polling & uploading" onPress={() => { onClickNotificationButton(props.notificationState.handleClickDisplayNotification, dispatch) }} />
            <MaybeIfValue text="Errors from displaying notifications: " value={props.notificationState.displayNotificationErrors} />
            <MaybeIfValue text="Battery optimization enabled: " value={(props.batteryOptimizationEnabled === null) ? null : String(props.batteryOptimizationEnabled)} />
            <MaybeIfValue text="Notifee native errors (what?): " value={props.notificationState.nativeErrors} />
            <MaybeIfValue text="Notification ID: " value={props.notificationState.notificationID} />
            <MaybeIfValue text="Trigger notification: " value={props.notificationState.triggerNotification} />
            <MaybeIfValue text="Notification channel: " value={props.notificationState.channelID} />
        </>
    )
}


export interface NotifeeNotificationHookState {
    handleClickDisplayNotification: () => Promise<void>;
    displayNotificationErrors: string | null;
    nativeErrors: string | null;
    notificationID: string | null;
    channelID: string | null;
    triggerNotification: string | null;
}

const init = async (setDisplayNotificationErrors: React.Dispatch<React.SetStateAction<string | null>>, setNativeErrors: React.Dispatch<React.SetStateAction<string | null>>, deviceID: string | null, supportedDevices: UserInfoDevice[] | null, setChannelID: React.Dispatch<React.SetStateAction<string | null>>, setNotificationID: React.Dispatch<React.SetStateAction<string | null>>, channelID: string | null, loggedIn: boolean, userSettings: UserSettings, jwt: string, shouldUpload: boolean) => {
    if (channelID === null) {
        console.log("Channel not created yet, creating...");
        const channelId_ = await checkedCreateChannel(setNativeErrors);
        if (channelId_ === null) {
            console.error("Channel creation failed! Native errors should be set.");
            return;
        }
        setChannelID(channelId_);
        return;
    }

    if (deviceID === null) {
        console.log("Need to connect to device before starting service...");
        return;
    }
    if (supportedDevices === null) {
        if (!loggedIn) {
            alert("Please log in.");
            return;
        }
        console.log("need to load user info before starting service...");
        return;
    }

    const result = await onDisplayNotification(setDisplayNotificationErrors, setNativeErrors, channelID, deviceID, supportedDevices, userSettings, jwt, shouldUpload);
    if (result !== undefined) {
        setNotificationID(result);
    }
}


export const useNotifeeNotifications = (): NotifeeNotificationHookState => {
    const [displayNotificationErrors, setDisplayNotificationErrors] = useState(null as (string | null));
    const [nativeErrors, setNativeErrors] = useState(null as (string | null));
    
    const [notificationID, setNotificationID] = useState(null as (string | null));
    const [channelID, setChannelID] = useState(null as (string | null));
    const [triggerNotification, setTriggerNotification] = useState(null as (string | null));

    const appState = useRef(AppState.currentState);
    const [appStateVisible, setAppStateVisible] = useState(appState.current);

    const deviceID = useSelector(selectDeviceID);
    const supportedDevices = useSelector(selectSupportedDevices);
    const backgroundPollingEnabled = useSelector(selectBackgroundPollingEnabled);

    const userSettings = useSelector(selectUserSettings);
    const jwt = useSelector(selectJWT);
    const shouldUpload = useSelector(selectShouldUpload);
    const {loggedIn} = useIsLoggedIn();
    

    const dispatch = useDispatch();

    const handleClickDisplayNotification = async () => {
        await notifee.stopForegroundService();
        await notifee.cancelAllNotifications();
        await notifee.cancelTriggerNotifications();
        let channelId_ = channelID;
        if (channelId_ === null) {
            console.log("Channel not created yet, creating...");
            channelId_ = await checkedCreateChannel(setNativeErrors);
            if (channelId_ === null) {
                console.error("Channel creation failed! Native errors should be set.");
                return;
            }
            setChannelID(channelId_);
            // return;
    
        }
        const triggerResult = await createTriggerNotification(setNativeErrors, channelId_);
        if (triggerResult !== undefined) {
            setTriggerNotification(triggerResult);
        }
        dispatch(setBackgroundPollingEnabled(true));
    }

    useEffect(() => {
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
            return;
        }
        if (userSettings === undefined) {
            console.log("Can't start polling yet, loading user settings.");
            return;
        }

        console.log("polling in background.");
        init(setDisplayNotificationErrors, setNativeErrors, deviceID, supportedDevices, setChannelID, setNotificationID, channelID, loggedIn, userSettings, jwt, shouldUpload);
        return (() => {
            notifee.stopForegroundService();
            notifee.cancelAllNotifications();
            notifee.cancelTriggerNotifications();
        })
    }, [deviceID, supportedDevices, channelID, backgroundPollingEnabled, loggedIn, userSettings, jwt, shouldUpload])

    // useEffect(() => {
    //     console.log(appStateVisible);
    // }, [appStateVisible]);

    // https://docs.expo.dev/versions/latest/react-native/appstate/  
    useEffect(() => {
      AppState.addEventListener('change', _handleAppStateChange);
  
      return () => {
        AppState.removeEventListener('change', _handleAppStateChange);
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
        // debugger;
        notifee.isBatteryOptimizationEnabled().then((result) => {
            // console.log(`Battery optimization: ${result}`);
            return dispatch(setBatteryOptimizationEnabled(result));
        }).catch((exception) => {
            Sentry.Native.captureException(exception);
            // In theory, the native java code can throw exceptions if something is desperatley wrong...
            setNativeErrors(`Error in isBatteryOptimizationEnabled: '${String(exception)}'`);
        })
    }, [])


    return { handleClickDisplayNotification, displayNotificationErrors, nativeErrors, notificationID, channelID, triggerNotification }
}