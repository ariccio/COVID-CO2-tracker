import './shim';
import 'expo-dev-client';

import {registerRootComponent} from 'expo';

import AppContainer from './App';

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