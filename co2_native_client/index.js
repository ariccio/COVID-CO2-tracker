import './shim';
import 'expo-dev-client';

import notifee from '@notifee/react-native';
import {registerRootComponent} from 'expo';

import AppContainer from './App';

console.log(`--------------\n\n\n\nRUNNING JAVASCRIPT\n\n\n\n--------------`);
console.log(`notifee notifications (seems like expo dev restart DOES NOT) clear?`);


// This line isn't
// eslint-disable-next-line promise/catch-or-return
notifee.getTriggerNotifications().then((result) => {console.log(`trigger notifs: ${result}`)});

// This line is broken
// 
// TO MY GREAT INITIAL CONFUSION, in the bundled code, this gets translated as:
// console.log(await _reactNative.default.getTriggerNotifications());
// It's the ONLY instance of await that is *not* transpiled.
// It's incorrect - is that why it's not transpiled?
// console.log(await notifee.getTriggerNotifications());

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(AppContainer);

if (__DEV__) {
    // https://docs.expo.dev/workflow/customizing/
    const EXPO_WARNING_NATIVE_CODE_PREBUILD = `If you manually modify the ios/ or android/ folders, you won't be able to safely re-run expo prebuild, this is known as the bare workflow.`;
    const EXPO_WARNING_STATIC_FILES = `If you want to make static changes to your native project files like the iOS Info.plist, or AndroidManifest.xml and still have access to prebuilding, check out the config plugins guide to see how you can hook into the prebuild process to make those changes.`;
    
    console.log(`Note to self: ${EXPO_WARNING_NATIVE_CODE_PREBUILD}`);

    console.log(`Note to self: '${EXPO_WARNING_STATIC_FILES}'`);

    console.log("NOTE TO SELF: if no fetch requests are going through to local machine in dev, make sure running rails as 'rails s -b 0.0.0.0 to allow all through!");
    
    console.log("Note to self (TODO): there's really nothing sensitive about the client ID, but I'd like to obfuscate it anyways.");
}