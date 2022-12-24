import * as Sentry from 'sentry-expo';

function maybeHPCTimeStr(): string | null {
    /*
    global.nativePerformanceNow is an undocumented way to access the underlying platform high precision timer.
    https://github.com/facebook/react-native/blob/022e22cbd400cdf0124c562f1ad382587cadab76/ReactCommon/jsiexecutor/jsireact/JSIExecutor.cpp#L568

    On iOS, it reminds me a lot of windows QueryPerformanceCounter, and how that's implemented for the C++ STL:

    https://github.com/facebook/react-native/blob/90998a8f85b9f1eaa6b715a31bd801d78c419c2c/React/CxxBridge/RCTJSIExecutorRuntimeInstaller.mm#L24
    ```
        PerformanceNow iosPerformanceNowBinder = []() {
        auto time = std::chrono::steady_clock::now();
        auto duration = std::chrono::duration_cast<std::chrono::nanoseconds>(time.time_since_epoch()).count();

        constexpr double NANOSECONDS_IN_MILLISECOND = 1000000.0;

        return duration / NANOSECONDS_IN_MILLISECOND;
        };
    ```
    ...similarly for android, but not as an inline C++ lambda:
    https://github.com/facebook/react-native/blob/114d31feeeb47f5a57419e5088c3cbe9340f757a/ReactAndroid/src/main/jni/react/jni/NativeTime.cpp#L14
    ```
        double reactAndroidNativePerformanceNowHook() {
            auto time = std::chrono::steady_clock::now();
            auto duration = std::chrono::duration_cast<std::chrono::nanoseconds>(
                                time.time_since_epoch())
                                .count();

            constexpr double NANOSECONDS_IN_MILLISECOND = 1000000.0;

            return duration / NANOSECONDS_IN_MILLISECOND;
        }
    ```
    ...bound separately: https://github.com/facebook/react-native/blob/32d12e89f864a106433c8e54c10691d7876333ee/ReactAndroid/src/main/jni/react/hermes/reactexecutor/OnLoad.cpp#L60

    ...and the common interface: 

    https://github.com/facebook/react-native/blob/022e22cbd400cdf0124c562f1ad382587cadab76/ReactCommon/jsiexecutor/jsireact/JSIExecutor.cpp#L568
    ```
        void bindNativePerformanceNow(Runtime &runtime, PerformanceNow performanceNow) {
        runtime.global().setProperty(
            runtime,
            "nativePerformanceNow",
            Function::createFromHostFunction(
                runtime,
                PropNameID::forAscii(runtime, "nativePerformanceNow"),
                0,
                [performanceNow = std::move(performanceNow)](
                    jsi::Runtime &runtime,
                    const jsi::Value &,
                    const jsi::Value *args,
                    size_t count) { return Value(performanceNow()); }));
        }
    ```
    ...`createFromHostFunction` is declared: https://github.com/facebook/react-native/blob/03b17d9af7e4e3ad3f9ec078b76d0ffa33a3290e/ReactCommon/jsi/jsi/jsi.h#L978
    ...and defined: https://github.com/facebook/react-native/blob/03b17d9af7e4e3ad3f9ec078b76d0ffa33a3290e/ReactCommon/jsi/jsi/jsi-inl.h#L248

    The comment on the declaration says: 
    ```
        /// \param name the name property for the function.
        /// \param paramCount the length property for the function, which
        /// may not be the number of arguments the function is passed.
    ```

    ...so we can guess based not just on usage, but on impl, that it's meant to be called without params.

    */
    
    let maybeNativeHPCStr = '';
    type nativePerformanceNowFunctionType = () => number;
    const maybeUndocumentedHPCAPI = (global as any).nativePerformanceNow as unknown;
    if (maybeUndocumentedHPCAPI === undefined) {
        Sentry.Native.captureMessage(`global.nativePerformanceNow is undefined for this instance.`);
        return null;
    }
    if (maybeUndocumentedHPCAPI === null) {
        Sentry.Native.captureMessage(`global.nativePerformanceNow is null for this instance.`);
        return null;
    }

    if (typeof maybeUndocumentedHPCAPI !== 'function') {
        Sentry.Native.captureMessage(`global.nativePerformanceNow is NOT a function for this instance. Type: ${typeof maybeUndocumentedHPCAPI}`);
        return null;
    }
    const maybeNativePerformanceNowFunction = maybeUndocumentedHPCAPI as nativePerformanceNowFunctionType;
    const now = maybeNativePerformanceNowFunction();
    return now.toString();    

}

export function timeNowAsString(): string {
    const now = Date.now();
    const nowS = new Date(now).toUTCString();
    const maybeHPCTime = maybeHPCTimeStr();
    if (maybeHPCTimeStr === null) {
        return nowS;
    }
    return `${nowS} ${maybeHPCTime}`;
}