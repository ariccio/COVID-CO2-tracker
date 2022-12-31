// https://github.com/expo/expo/blob/main/docs/pages/versions/unversioned/sdk/background-fetch.mdx

import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import { UserInfoDevice } from '../../../../co2_client/src/utils/DeviceInfoTypes';
import { UserSettings } from '../../../../co2_client/src/utils/UserSettings';
import { selectShouldUpload } from '../../app/globalSlice';
import { useIsLoggedIn } from '../../utils/UseLoggedIn';
import { MeasurementDataForUpload } from '../Measurement/MeasurementTypes';
import { uploadMeasurementHeadless } from '../Measurement/MeasurementUpload';
import { onHeadlessTaskTriggerBluetooth } from '../bluetooth/Bluetooth';
import { incrementUpdates, selectDeviceID } from '../bluetooth/bluetoothSlice';
import { selectSupportedDevices } from '../userInfo/devicesSlice';
import { selectUserSettings } from '../userInfo/userInfoSlice';
import { AppDispatch } from '../../app/store';

export const BACKGROUND_FETCH_TASK = 'background-fetch';


interface TaskStateGlobal {
    deviceID: string;
    supportedDevices: UserInfoDevice[];
    userSettings: UserSettings;
    jwt: string;
    shouldUpload: boolean;
    dispatch: AppDispatch;

}

let taskStateGlobal: TaskStateGlobal | null = null;

const backgroundFetchTaskCallback = async () => {
    // if (Platform.OS === 'android') {
    //     console.log(`Use different background mechanism for android, not expo background fetch :)`);
    //     return;
    // }
    const now = Date.now();
  
    console.log(`Got background fetch call at date: ${new Date(now).toISOString()}`);
    if (taskStateGlobal === null) {
        console.warn(`taskStateGlobal is null. God I feel like a C programmer using qsort. Bailing.`);
        return;
    }

    console.log(`Starting headless task with deviceID: ${taskStateGlobal.deviceID}, supportedDevices: ${JSON.stringify(taskStateGlobal.supportedDevices)}`);
    const result: MeasurementDataForUpload | null = await onHeadlessTaskTriggerBluetooth(taskStateGlobal.deviceID, taskStateGlobal.supportedDevices);

    taskStateGlobal.dispatch(incrementUpdates());
    console.log(`Read this value!\n\t${JSON.stringify(await result)}`);
    await uploadMeasurementHeadless(result, taskStateGlobal.userSettings, taskStateGlobal.jwt, taskStateGlobal.shouldUpload, taskStateGlobal.dispatch);



    // Be sure to return the successful result type!
    return BackgroundFetch.BackgroundFetchResult.NewData;
}

// if (Platform.OS === 'ios') {
//     // 1. Define the task by providing a name and the function that should be executed
//     // Note: This needs to be called in the global scope (e.g outside of your React components)
// }
TaskManager.defineTask(BACKGROUND_FETCH_TASK, backgroundFetchTaskCallback);




// 2. Register the task at some point in your app by providing the same name,
// and some configuration options for how the background fetch should behave
// Note: This does NOT need to be in the global scope and CAN be used in your React components!
export async function registerBackgroundFetchAsync() {
    return BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
      minimumInterval: 60 * 15, // 15 minutes
      stopOnTerminate: false, // android only,
      startOnBoot: true, // android only
    });
}



// 3. (Optional) Unregister tasks by specifying the task name
// This will cancel any future background fetch calls that match the given name
// Note: This does NOT need to be in the global scope and CAN be used in your React components!
export async function unregisterBackgroundFetchAsync() {
    return BackgroundFetch.unregisterTaskAsync(BACKGROUND_FETCH_TASK);
}


export function useIosBackgroundTaskToReadBluetoothAranet4() {
    const shouldUpload = useSelector(selectShouldUpload);
    const {loggedIn, jwt} = useIsLoggedIn();

    const supportedDevices = useSelector(selectSupportedDevices);
    const deviceID = useSelector(selectDeviceID);
    const userSettings = useSelector(selectUserSettings);
    const dispatch = useDispatch();
    
    useEffect(() => {
        if (!loggedIn) {
            console.log(`Not logged in (loggedIn: ${loggedIn}), not writing JWT to store for background task.`);
            return;
        }
        if (!jwt) {
            console.log(`jwt falsy (JWT: ${jwt}), not writing JWT to store for background task.`);
            return;
        }
        if (jwt?.length === 0) {
            console.log(`jwt empty`);
            return;
        }
        if (supportedDevices === null) {
            console.log(`supportedDevices null, no devices to pass to background fetch handler...`);
            return;
        }
        if (supportedDevices.length === 0) {
            console.log(`supportedDevices empty, no devices to pass to background fetch handler...`);
            return;
        }
        if (deviceID === null) {
            console.log(`deviceID null, no devices to pass to background fetch handler...`);
            return;
        }
        if (deviceID.length === 0 ) {
            console.log(`deviceID empty, no devices to pass to background fetch handler...`);
            return;
        }
        if (!userSettings) {
            console.log(`userSettings (${userSettings}) falsy, nothing to do in background handler...`);
            return;
        }

        taskStateGlobal = {
            deviceID,
            jwt,
            shouldUpload,
            supportedDevices,
            userSettings,
            dispatch
        };
        return (() => {
            taskStateGlobal = null;
        });


    }, [loggedIn, jwt, deviceID, shouldUpload, supportedDevices, userSettings, dispatch])

    return;

}
