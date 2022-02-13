import {API_URL} from './UrlPath';
import {formatErrors} from './ErrorObject';
import {fetchJSONWithChecks} from './FetchHelpers';

const GET_AAAPEEEYE_KEY_URL = API_URL + '/keys';
const MAPS_JAVASCRIPT_AAPEEEYE_KEY = GET_AAAPEEEYE_KEY_URL + `/${"MAPS_JAVASCRIPT_API_KEY"}`
const LOGIN_CLIENT_AAAPEEEYE_KEY_URL = (GET_AAAPEEEYE_KEY_URL + '/GOOGLE_LOGIN_CLIENT_ID');

const includeCreds: RequestCredentials = "include";

export function aapeeyeKeyRequestOptions(): RequestInit {
  const requestOptions = {
      method: 'get',
      credentials: includeCreds, //for httpOnly cookie
      headers: {
          'Content-Type': 'application/json'
      },
  }
  return requestOptions;
}


export async function getGoogleMapsJavascriptAaaaPeeEyeKey(): Promise<string> {
  const requestOptions = aapeeyeKeyRequestOptions();

  const fetchFailedCallback = async (awaitedResponse: Response): Promise<string> => {
    console.error("couldn't get google maps key!");
    debugger;
    const jsonResponse = (await awaitedResponse.clone().json());
    console.error(`API key fetch failed. Response: ${JSON.stringify(jsonResponse.clone())}`);
    console.warn("TODO: Throwing here is the WRONG action.");
    throw new Error(`API key fetch failed: ${formatErrors(jsonResponse.errors)}`);
  }
  const fetchSuccessCallback = async (awaitedResponse: Response): Promise<string> => {
    return (await awaitedResponse.json()).key;
  }

  // debugger;
  const result = fetchJSONWithChecks(MAPS_JAVASCRIPT_AAPEEEYE_KEY, requestOptions, 200, false, fetchFailedCallback, fetchSuccessCallback) as Promise<string>;
  return result;
}

export async function getGoogleLoginClientAaaPeeeEyeKey(): Promise<string> {
  const requestOptions = aapeeyeKeyRequestOptions();
  const fetchFailedCallback = async (awaitedResponse: Response): Promise<string> => {
    console.error("failed to get the key needed for google auth!");
    debugger;
    const jsonResponse = (await awaitedResponse.clone().json());
    console.warn("TODO: Throwing here is the WRONG action.");
    throw new Error(`Login client key fetch failed: ${formatErrors(jsonResponse.errors)}`);
  }

  const fetchSuccessCallback = async (awaitedResponse: Response): Promise<string> => {
    return (await awaitedResponse.json()).key;
  }

  const result = fetchJSONWithChecks(LOGIN_CLIENT_AAAPEEEYE_KEY_URL, requestOptions, 200, true, fetchFailedCallback, fetchSuccessCallback) as Promise<string>;
  return result;
}
