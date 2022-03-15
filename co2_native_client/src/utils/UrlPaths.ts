// See updated (more restrictive) licensing restrictions for this subproject! Updated 02/03/2022.

import Constants from 'expo-constants';


import {EMAIL_URL, LOGIN_URL, REAL_TIME_MEASUREMENT_URL, USER_DEVICES_URL, USER_SETTINGS_URL} from '../../../co2_client/src/utils/UrlPath';

const {manifest} = Constants;


/*
https://stackoverflow.com/a/49198103/625687
const api = (typeof manifest.packagerOpts === `object`) && manifest.packagerOpts.dev
  ? manifest.debuggerHost.split(`:`).shift().concat(`:3000`)
  : `api.example.com`;
*/

function apiUrlInDevOrProd(): string {
    console.log(`typeof manifest?.packagerOpts: ${typeof manifest?.packagerOpts}`);
    if ((typeof manifest?.packagerOpts === `object`)) {
        console.log(`manifest.packagerOpts.dev: ${manifest.packagerOpts.dev}`);
        console.log(`manifest.packagerOpts: ${String(manifest.packagerOpts)}`);
        console.log(`manifest.debuggerHost: ${manifest.debuggerHost}`);
        if ((manifest.packagerOpts.dev) || (__DEV__)) {
            const defaultPath = 'http://localhost:3000';
            if (manifest === undefined) {
                console.error(`Something is VERY broken - manifest is undefined - can't get local server url... Will try default (${defaultPath})...`);
                return defaultPath;
            }
            if (manifest.debuggerHost === undefined) {
                console.error(`Something is VERY broken - manifest.debuggerHost is undefined - can't get local server url... Will try default (${defaultPath})...`);
                return defaultPath;
            }
            const splitted = manifest.debuggerHost.split(`:`);
            const shifted = splitted.shift();
            if (shifted === undefined) {
                console.error(`Something is VERY broken - couldn't get the first part of the url by shifting it - can't get local server url... Will try default (${defaultPath})...`);
                return defaultPath;
            }
            const strWithPort = shifted.concat(`:3000`);
            if (strWithPort === undefined) {
                console.error(`Something is VERY broken - can't get local server url... Will try default (${defaultPath})...`);
                return defaultPath;
            }
            const final = `http://${strWithPort}`;
            console.log(`Using (dev) API base: ${final}`);
            return final;
        }
    }
    const prod = `https://covid-co2-tracker.herokuapp.com`;
    console.log(`Using (prod) API base: ${prod}`);
    return prod;
}

export const BASE_EXPO_URL = apiUrlInDevOrProd();

// //ALSO: https://stackoverflow.com/a/49198103/625687
// export const BASE_EXPO_URL = `http://${manifest?.debuggerHost?.split(':').shift()}:3000`;


export const LOGIN_URL_NATIVE = (BASE_EXPO_URL + LOGIN_URL);


export const USER_DEVICES_URL_NATIVE = (BASE_EXPO_URL + USER_DEVICES_URL);


export const EMAIL_URL_NATIVE = (BASE_EXPO_URL + EMAIL_URL);

export const USER_SETTINGS_URL_NATIVE = (BASE_EXPO_URL + USER_SETTINGS_URL);

export const REAL_TIME_UPLOAD_URL_NATIVE = (BASE_EXPO_URL + REAL_TIME_MEASUREMENT_URL);

export const COVID_CO2_TRACKER_DEVICES_URL = "https://covid-co2-tracker.herokuapp.com/devices";

export const COVID_CO2_TRACKER_PLACES_URL = "https://covid-co2-tracker.herokuapp.com/places";
