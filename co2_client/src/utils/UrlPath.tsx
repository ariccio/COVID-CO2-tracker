
// TODO: move to paths/urls or paths/api_urls?
export const API_URL = "/api/v1";
export const API_V2_URL = "/api/v2";

export const YOUTUBE_VIDEO_INSTRUCTIONS_URL = "https://youtu.be/FhT3X9emqJk";
export const ABOUT_ME_ARICCIO_URL = "https://about.me/ariccio";

export const GOOGLE_FORMS_SURVEY_URL = "https://docs.google.com/forms/d/e/1FAIpQLScJQwuzLeyzYIMgS1Qy0-d3dM-_CM9qn87u5EFHwbzgdPLTJA/viewform?usp=sf_link";

const SHOW_MEASUREMENT_ACTION = '/measurement';
export const SHOW_MEASUREMENT_URL = (API_URL + SHOW_MEASUREMENT_ACTION);

const NEW_DEVICE_ACTION = '/device';
export const NEW_DEVICE_URL = (API_URL + NEW_DEVICE_ACTION);

const AUTH_ACTION = '/auth';
export const LOGIN_URL = API_URL + AUTH_ACTION;

const MY_DEVICES_SHOW_ACTION = '/my_devices';
export const USER_DEVICES_URL = (API_URL + MY_DEVICES_SHOW_ACTION);

const EMAIL_URL_ACTION = '/email';
export const EMAIL_URL = API_URL + EMAIL_URL_ACTION;

const USER_SETTINGS_ACTION = '/user_settings';
export const USER_SETTINGS_URL = API_URL + USER_SETTINGS_ACTION;


const PLACES_ACTION = `/places`;
export const CREATE_PLACE_PATH = (API_URL + PLACES_ACTION);

export const PLACES_BY_GOOGLE_PLACE_ID_ROUTE: string = '/places_by_google_place_id';

export const SHOW_PLACES_BY_GOOGLE_PLACE_ID_PATH = (API_URL + PLACES_BY_GOOGLE_PLACE_ID_ROUTE);

export const PLACES_BY_GOOGLE_PLACE_ID_EXISTS_ROUTE: string = '/places_by_google_place_id_exists';


export const PLACES_IN_BOUNDS: string = (API_URL + '/places_in_bounds');

const USERS_SHOW_ACTION = '/users/show'
export const SHOW_USER_URL = (API_URL + USERS_SHOW_ACTION);

const REAL_TIME_MEASUREMENT_ACTION = '/realtime_measurement';
export const REAL_TIME_MEASUREMENT_URL = (API_URL + REAL_TIME_MEASUREMENT_ACTION);


const BACKEND_CHATGPT_BASE_ACTION = '/open_ai_chat_gpt';
export const BACKEND_CHATGPT_SEND_CHAT_ACTION_URL = (API_URL + BACKEND_CHATGPT_BASE_ACTION);

