
/*
For this insane problem:

Logs for your project will appear below. Press Ctrl+C to exit.
Android Bundling complete 16928ms
Android Bundling complete 56ms
Android Running app on Pixel XL
Android Running app on Pixel XL

ReferenceError: Can't find variable: BigInt
at node_modules\react-native\Libraries\LogBox\LogBox.js:149:8 in registerError
at node_modules\react-native\Libraries\LogBox\LogBox.js:60:8 in errorImpl
at node_modules\react-native\Libraries\LogBox\LogBox.js:34:4 in console.error
at node_modules\expo\build\environment\react-native-logs.fx.js:27:4 in error
at node_modules\react-native\Libraries\Core\ExceptionsManager.js:104:6 in reportException
at node_modules\react-native\Libraries\Core\ExceptionsManager.js:172:19 in handleException
at node_modules\react-native\Libraries\Core\setUpErrorHandling.js:24:6 in handleError
at node_modules\expo-dev-launcher\build\DevLauncherErrorManager.js:44:19 in errorHandler
at node_modules\expo-dev-launcher\build\DevLauncherErrorManager.js:49:24 in <anonymous>
at node_modules\@react-native\polyfills\error-guard.js:49:36 in ErrorUtils.reportFatalError
at node_modules\metro-runtime\src\polyfills\require.js:204:6 in guardedLoadModule
› Stopped server

...????
*/


// I swear to god.
// See: https://github.com/facebook/react-native/issues/28492#issuecomment-824698934
if (typeof BigInt === 'undefined') {
    global.BigInt = require('big-integer');
}
