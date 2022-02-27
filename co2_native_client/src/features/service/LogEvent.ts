import {EventType} from '@notifee/react-native';

// https://github.com/invertase/notifee/blob/7d03bb4eda27b5d4325473cf155852cef42f5909/tests_react_native/example/videoApp.tsx#L142
export function logEvent(state: string, event: any): string {
    const { type, detail } = event;

    let eventTypeString;

    switch (type) {
        case EventType.UNKNOWN:
            eventTypeString = 'UNKNOWN';
            console.log('Notification Id', detail.notification?.id);
            break;
        case EventType.DISMISSED:
            eventTypeString = 'DISMISSED';
            return `Dissmissed ${detail.notification?.id}`;
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

    return (`Received a ${eventTypeString} ${state} event in JS mode.`);
    // console.warn(JSON.stringify(event));
}
