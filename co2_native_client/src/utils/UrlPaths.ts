import Constants from 'expo-constants';


import {LOGIN_URL, USER_DEVICES_URL} from '../../../co2_client/src/utils/UrlPath';

const {manifest} = Constants;


//ALSO: https://stackoverflow.com/a/49198103/625687
export const BASE_EXPO_URL = `http://${manifest?.debuggerHost?.split(':').shift()}:3000`;


export const LOGIN_URL_NATIVE = (BASE_EXPO_URL + LOGIN_URL);


export const USER_DEVICES_URL_NATIVE = (BASE_EXPO_URL + USER_DEVICES_URL);
