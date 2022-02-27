import notifee, {IOSNotificationSettings, Notification, EventType, Event, TriggerType, TimeUnit, IntervalTrigger} from '@notifee/react-native';
import {useState, useEffect} from 'react';
import { Button } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import { selectJWT, setBatteryOptimizationEnabled } from '../../app/globalSlice';
import { MaybeIfValue } from '../../utils/RenderValues';
import { selectUserSettings } from '../userInfo/userInfoSlice';


function defaultNotification(channelId: string): Notification {
    const defaultNotificationOptions: Notification = {
        // See: co2_native_client\node_modules\@notifee\react-native\dist\types\Notification.d.ts
        // See: co2_native_client\node_modules\@notifee\react-native\dist\types\NotificationAndroid.d.ts

        // See also: https://notifee.app/react-native/docs/android/appearance#small-icons
        title: 'COVID CO2 tracker', // "The notification title which appears above the body text."
        body: 'Main body content of the notification', // "The main body content of a notification."
        android: { // "Android specific notification options. See the [`NotificationAndroid`](/react-native/reference/notificationandroid) interface for more information and default options which are applied to a notification."
            channelId, // "Specifies the `AndroidChannel` which the notification will be delivered on."
            smallIcon: 'ic_small_icon', // optional, defaults to 'ic_launcher'.

            // https://notifee.app/react-native/docs/android/foreground-service
            asForegroundService: true,
            actions: [
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




async function checkedCreateChannel(setNativeErrors: React.Dispatch<React.SetStateAction<string | null>>): Promise<string | null> {
    try {
        return await notifee.createChannel({
            id: 'default',
            name: 'Default Channel',
        });
    }
    catch (exception) {
        //Probably native error.
        setNativeErrors(`Error in createChannel: '${String(exception)}'`);
        debugger;
        return null;
    }
}

async function checkedRequestPermission(setNativeErrors: React.Dispatch<React.SetStateAction<string | null>>): Promise<IOSNotificationSettings | null> {
    try {
        return await notifee.requestPermission();
    }
    catch (exception) {
        //Probably native error.
        setNativeErrors(`Error in requestPermission: '${String(exception)}'`);
        debugger;
        return null;
    }
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
        }
    }
    return defaultNotificationOptions;
}


// https://github.com/invertase/notifee/blob/7d03bb4eda27b5d4325473cf155852cef42f5909/tests_react_native/example/videoApp.tsx#L142
function logEvent(state: string, event: any): void {
    const { type, detail } = event;

    let eventTypeString;

    switch (type) {
        case EventType.UNKNOWN:
            eventTypeString = 'UNKNOWN';
            console.log('Notification Id', detail.notification?.id);
            break;
        case EventType.DISMISSED:
            eventTypeString = 'DISMISSED';
            console.log('Notification Id', detail.notification?.id);
            break;
        case EventType.PRESS:
            eventTypeString = 'PRESS';
            console.log('Action ID', detail.pressAction?.id || 'N/A');
            break;
        case EventType.ACTION_PRESS:
            eventTypeString = 'ACTION_PRESS';
            console.log('Action ID', detail.pressAction?.id || 'N/A');
            break;
        case EventType.DELIVERED:
            eventTypeString = 'DELIVERED';
            console.log('Notification Id', detail.notification?.id);
            break;
        case EventType.APP_BLOCKED:
            eventTypeString = 'APP_BLOCKED';
            console.log('Blocked', detail.blocked);
            break;
        case EventType.CHANNEL_BLOCKED:
            eventTypeString = 'CHANNEL_BLOCKED';
            console.log('Channel', detail.channel);
            break;
        case EventType.CHANNEL_GROUP_BLOCKED:
            eventTypeString = 'CHANNEL_GROUP_BLOCKED';
            console.log('Channel Group', detail.channelGroup);
            break;
        case EventType.TRIGGER_NOTIFICATION_CREATED:
            eventTypeString = 'TRIGGER_NOTIFICATION_CREATED';
            console.log('Trigger Notification');
            break;
        default:
            eventTypeString = 'UNHANDLED_NATIVE_EVENT';
    }

    console.log(`Received a ${eventTypeString} ${state} event in JS mode.`);
    // console.warn(JSON.stringify(event));
}



// { type: EventType, detail: EventDetail }
async function handleForegroundEvent({ type, detail }: Event) {
    logEvent('foreground', { type, detail });
    console.log(`-------\r\n\tRecieved foreground service event: ${JSON.stringify(type)}, ${JSON.stringify(detail)}`);
    if (type === EventType.ACTION_PRESS) {
        if (!detail) {
            console.warn("missing notification event detail?");
            debugger;
            return;
        }
        if (detail.pressAction === undefined) {
            console.warn("missing notification event detail pressAction?");
            debugger;
            return;
        }
        if (detail.pressAction.id === 'stop') {
            console.log("Stopping foreground service...");
            await notifee.stopForegroundService();
            return;
        }
        console.log(`...Unexpected pressAction? ${detail.pressAction.id}`);
    }

    if (type === EventType.DELIVERED) {
        console.log("Likely event trigger?");
    }
}
async function registerForegroundService(setNativeErrors: React.Dispatch<React.SetStateAction<string | null>>): Promise<void> {
    try {
        console.log("Registering foreground service...");
        notifee.registerForegroundService((notification) => {
            return new Promise(() => {
                console.log("Registering notification service event handlers...");
                // https://notifee.app/react-native/docs/android/foreground-service
                notifee.onForegroundEvent(handleForegroundEvent);
                notifee.onBackgroundEvent(handleForegroundEvent);
                // debugger;
            })
        })
    }
    catch (exception) {
        //Probably native error.
        setNativeErrors(`Error in registerForegroundService: '${String(exception)}'`);
        debugger;
    }
}

//https://notifee.app/react-native/docs/displaying-a-notification
async function onDisplayNotification(setDisplayNotificationErrors: React.Dispatch<React.SetStateAction<string | null>>, setNativeErrors: React.Dispatch<React.SetStateAction<string | null>>, channelId: string) {
    // Create a channel

    //https://github.com/invertase/notifee/blob/7d03bb4eda27b5d4325473cf155852cef42f5909/docs/react-native/docs/debugging.md
    // To quickly view Android logs in the terminal:
    //   adb logcat '*:S' NOTIFEE:D

    await registerForegroundService(setNativeErrors);

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

    try {
        const result = await notifee.createTriggerNotification(triggerNotif, trigger);
        return result;
    }
    catch (exception) {
        setNativeErrors(`Error creating trigger notification: ${String(exception)}`);
    }
}


const onClickNotificationButton = (handleClickDisplayNotification: () => Promise<void>, setShouldUpload: React.Dispatch<React.SetStateAction<boolean>>) => {
    setShouldUpload(false);
    handleClickDisplayNotification();

}


export const NotificationInfo = (props: { notificationState: NotifeeNotificationHookState, batteryOptimizationEnabled: boolean | null, setShouldUpload: React.Dispatch<React.SetStateAction<boolean>> }) => {

    return (
        <>
            <Button title="Display notifee Notification" onPress={() => { onClickNotificationButton(props.notificationState.handleClickDisplayNotification, props.setShouldUpload) }} />
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

export const useNotifeeNotifications = (): NotifeeNotificationHookState => {
    const [displayNotificationErrors, setDisplayNotificationErrors] = useState(null as (string | null));
    const [nativeErrors, setNativeErrors] = useState(null as (string | null));
    const [notificationID, setNotificationID] = useState(null as (string | null));
    const [channelID, setChannelID] = useState(null as (string | null));
    const [triggerNotification, setTriggerNotification] = useState(null as (string | null));


    const userSettings = useSelector(selectUserSettings);
    const jwt = useSelector(selectJWT);


    const dispatch = useDispatch();

    const handleClickDisplayNotification = async () => {
        const channelId_ = await checkedCreateChannel(setNativeErrors);
        if (channelId_ === null) {
            debugger;
            return;
        }
        setChannelID(channelId_);

        const result = await onDisplayNotification(setDisplayNotificationErrors, setNativeErrors, channelId_);
        if (result !== undefined) {
            setNotificationID(result);
        }
        const triggerResult = await createTriggerNotification(setNativeErrors, channelId_);
        if (triggerResult !== undefined) {
            setTriggerNotification(triggerResult);
        }
    }


    useEffect(() => {
        // debugger;
        notifee.isBatteryOptimizationEnabled().then((result) => {
            console.log(`Battery optimization: ${result}`);
            dispatch(setBatteryOptimizationEnabled(result));
        }).catch((exception) => {
            // In theory, the native java code can throw exceptions if something is desperatley wrong...
            setNativeErrors(`Error in isBatteryOptimizationEnabled: '${String(exception)}'`);
        })
    }, [])


    return { handleClickDisplayNotification, displayNotificationErrors, nativeErrors, notificationID, channelID, triggerNotification }
}
