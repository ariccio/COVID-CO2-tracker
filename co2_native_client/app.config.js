// see https://github.com/expo/eas-cli/issues/968#issuecomment-1162881861


import { withXcodeProject } from "@expo/config-plugins";

const config = {
  // contents of `expo` object from `app.json`
  "name": "co2_native_client",
  "slug": "co2_native_client",
  "jsEngine": "hermes",
  "version": "1.0.22",
  "orientation": "portrait",
  "icon": "./assets/icon.png",
  "splash": {
    "image": "./assets/splash.png",
    "resizeMode": "contain",
    "backgroundColor": "#ffffff"
  },
  "updates": {
    "fallbackToCacheTimeout": 0
  },
  "assetBundlePatterns": [
    "**/*"
  ],
  "ios": {
    "supportsTablet": true,
    "buildNumber": "1.0.22",
    "bundleIdentifier": "riccio.co2.client"
  },
  "android": {
    "adaptiveIcon": {
      "foregroundImage": "./assets/adaptive-icon.png",
      "backgroundColor": "#FFFFFF"
    },
    "permissions": [
      "android.permission.BLUETOOTH",
      "android.permission.BLUETOOTH_ADMIN",
      "android.permission.BLUETOOTH_SCAN",
      "android.permission.BLUETOOTH_ADVERTISE",
      "android.permission.ACCESS_FINE_LOCATION",
      "android.permission.ACCESS_COARSE_LOCATION",
      "android.hardware.bluetooth_le",
      "android.permission.BLUETOOTH_CONNECT"
    ],
    "versionCode": 460010022,
    "package": "riccio.co2.client"
  },
  "web": {
    "favicon": "./assets/favicon.png"
  },
  "plugins": [
    "@config-plugins/react-native-ble-plx",
    "@notifee/react-native",
    "sentry-expo"
  ],
  "hooks": {
    "postPublish": [
      {
        "file": "sentry-expo/upload-sourcemaps",
        "config": {
          "organization": "covid-co2-tracker",
          "project": "covid-co2-tracker",
          "authToken": "62c8b1fd78484639bc77b251408ee0ea9d634bb4022a440fa13c0201a035c77d"
        }
      }
    ]
  },
  "extra": {
    "eas": {
      "projectId": "2294feeb-9a3c-4503-acb6-12dbea34da3b"
    }
  }

}

export default withXcodeProject(config, async (nativeConfig) => {
    const xcodeProject = nativeConfig.modResults;
    xcodeProject.debugInformationFormat = "dwarf-with-dsym";
    return nativeConfig;
  });
