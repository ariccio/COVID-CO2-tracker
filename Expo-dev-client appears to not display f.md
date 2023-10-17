Expo-dev-client appears to not display full context for Javascript syntax errors encountered in development builds. Ideally, I'd see something like: 
```
ERROR  [SyntaxError: Unexpected identifier 'resolveAfter2Seconds'. Expected ')' to end an argument list.]
/Users/alexanderriccio/Documents/scratch_work/weird_expo_compile_issue_bare/my-app/index.js:15:13
console.log(await resolveAfter2Seconds);
     ~~~~~~~^
```
...instead, all we get is:
```
 ERROR  [SyntaxError: Unexpected identifier 'resolveAfter2Seconds'. Expected ')' to end an argument list.]
```



In my case, an errant top level await (`console.log(await notifee.getTriggerNotifications());`) that would normally show up in the expo error overlay (ErrorFragment?) *somehow* made it through metro compilation, and then caused hermes to fail. The development build would immediately native crash anyways, so I wouldn't know. My *only* clue was this line in the device system log (`adb logcat`):
```
HermesVM: Compiling JS failed: 1200:21:')' expected at end of function call,  Buffer size 7031284 starts with: 766172205f5f42554e444c455f535441 and has protection mode(s): r--p
```

Sometimes - very rarely, like when typing this report - it would instead display that message in a "Project didn't load" screen.

I am not entirely sure how expo normally handles errors, so I'm not *actually* sure why this caused a native crash. Currently, my wild guess is that somewhere [like in the module interop code](https://github.com/expo/expo/blob/023bc8eafe7ef5665dc3716a4163127f0e945c5c/android/vendored/sdk47/react-native-reanimated/Common/cpp/Registries/WorkletsCache.cpp#L30), [low level view code](https://github.com/expo/expo/blob/023bc8eafe7ef5665dc3716a4163127f0e945c5c/android/versioned-abis/expoview-abi47_0_0/src/main/java/abi47_0_0/host/exp/exponent/modules/api/components/webview/RNCWebViewManager.java#L1666) (also, [higher up the callstack](https://github.com/expo/expo/blob/023bc8eafe7ef5665dc3716a4163127f0e945c5c/android/versioned-abis/expoview-abi47_0_0/src/main/java/abi47_0_0/host/exp/exponent/modules/api/components/webview/RNCWebViewManager.java#L927)), or somewhere else entirely, is calling into `evaluateJavascript` and not catching the C++ exception.

[I initially thought this was a hermes bug where for some reason no useful info was dumped](https://github.com/facebook/hermes/issues/877). I was wrong, and honestly it should have been a little bit more obvious to me in retrospect, but I was confused by the fact that I'd seen no errors from metro or expo. In this case, the hermesvm output to the android system log was the *only* clue as to why the app was breaking. Without it, I may have been fighting for hours over a tiny mistake.

When explicitly running a release variant (`npx expo run:android --device --variant release`), I get the correct/reasonable output:
```
/Users/alexanderriccio/Documents/GitHub/COVID-CO2-tracker/co2_native_client/android/app/build/generated/assets/react/release/index.android.bundle:712:21: error: ')' expected at end of function call
  console.log(await _reactNative.default.getTriggerNotifications());
             ~~~~~~~^
```
