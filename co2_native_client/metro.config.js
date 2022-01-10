// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

const path = require('path');

const extraNodeModules = {
    'utils': path.resolve(__dirname + '/../co2_client/src/utils'),
    };

const watchFolders = [
    path.resolve(__dirname + '/../co2_client/src/utils')
    ];

//"Please note that you only need to specify the options that you want to customize: the custom config will be merged with the defaults from expo/metro-config when using Expo CLI."
// module.exports = getDefaultConfig(__dirname);


module.exports = {
    resolver: {
        extraNodeModules
      },
      watchFolders,
}