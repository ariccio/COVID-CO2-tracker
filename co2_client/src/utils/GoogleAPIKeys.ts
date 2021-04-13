import {API_URL} from './UrlPath';
import {formatErrors} from './ErrorObject';
import {fetchJSONWithChecks} from './FetchHelpers';

const GET_API_KEY_URL = API_URL + '/keys';
const MAPS_JAVASCRIPT_API_KEY = GET_API_KEY_URL + `/${"MAPS_JAVASCRIPT_API_KEY"}`
const LOGIN_CLIENT_API_KEY_URL = (GET_API_KEY_URL + '/GOOGLE_LOGIN_CLIENT_ID');

const includeCreds: RequestCredentials = "include";

export function apiKeyRequestOptions(): RequestInit {
  const requestOptions = {
      method: 'get',
      credentials: includeCreds, //for httpOnly cookie
      headers: {
          'Content-Type': 'application/json'
      },
  }
  return requestOptions;
}


export async function getGoogleMapsJavascriptAPIKey(): Promise<string> {
  const requestOptions = apiKeyRequestOptions();

  const fetchFailedCallback = async (awaitedResponse: Response): Promise<string> => {
    console.error("couldn't get google maps API key!");
    debugger;
    const jsonResponse = (await awaitedResponse.clone().json());
    console.log(jsonResponse.clone());
    throw new Error(formatErrors(jsonResponse.errors));
  }
  const fetchSuccessCallback = async (awaitedResponse: Response): Promise<string> => {
    // console.log("got google maps api key");
    return (await awaitedResponse.json()).key;
  }

  // debugger;
  const result = fetchJSONWithChecks(MAPS_JAVASCRIPT_API_KEY, requestOptions, 200, false, fetchFailedCallback, fetchSuccessCallback) as Promise<string>;
  return result;
}

export async function getGoogleLoginClientAPIKey(): Promise<string> {
  const requestOptions = apiKeyRequestOptions();
  const fetchFailedCallback = async (awaitedResponse: Response): Promise<string> => {
    console.error("failed to get the api key needed for google auth!");
    debugger;
    const jsonResponse = (await awaitedResponse.clone().json());
    throw new Error(formatErrors(jsonResponse.errors));
  }

  const fetchSuccessCallback = async (awaitedResponse: Response): Promise<string> => {
    return (await awaitedResponse.json()).key;
  }

  const result = fetchJSONWithChecks(LOGIN_CLIENT_API_KEY_URL, requestOptions, 200, true, fetchFailedCallback, fetchSuccessCallback) as Promise<string>;
  return result;
}
