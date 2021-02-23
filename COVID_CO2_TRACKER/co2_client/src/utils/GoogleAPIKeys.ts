import {API_URL} from './UrlPath';
import {formatErrors, ErrorObjectType} from './ErrorObject';


const GET_API_KEY_URL = API_URL + '/keys';
const PLACES_SCRIPT_URL_API_KEY = GET_API_KEY_URL + `/${"PLACES_SCRIPT_URL_API_KEY"}`
const MAPS_JAVASCRIPT_API_KEY = GET_API_KEY_URL + `/${"MAPS_JAVASCRIPT_API_KEY"}`


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

// interface APIKeyResponseType {
//   key: string;
//   errors?: Array<ErrorObjectType>;
// }

export async function getGooglePlacesScriptAPIKey(): Promise<string> {
  const requestOptions = apiKeyRequestOptions();
  const rawFetchResponse: Promise<Response> = fetch(PLACES_SCRIPT_URL_API_KEY, requestOptions);
  const jsonResponse: Promise<any> = (await rawFetchResponse).json();
  const response = await jsonResponse;
  if (response.errors !== undefined) {
    if (response.status !== 200) {
      console.warn(`server returned a response with a status field (${response.status}), and it wasn't a 200 (OK) status.`);
    }
    console.error("couldn't get google places API key!");
    console.error(formatErrors(response.errors));
    debugger;
  }
  console.assert(response.key !== undefined);
  console.assert(response.key !== null);
  console.assert(response.key !== '');
  return response.key;
}


export async function getGoogleMapsJavascriptAPIKey(): Promise<string> {
  const requestOptions = apiKeyRequestOptions();
  const rawFetchResponse: Promise<Response> = fetch(MAPS_JAVASCRIPT_API_KEY, requestOptions);
  const jsonResponse: Promise<any> = (await rawFetchResponse).json();
  const response = await jsonResponse;
  if (response.errors !== undefined) {
    if (response.status !== 200) {
      console.warn(`server returned a response with a status field (${response.status}), and it wasn't a 200 (OK) status.`);
    }
    console.error("couldn't get google maps API key!");
    console.error(formatErrors(response.errors));
    debugger;
  }
  console.assert(response.key !== undefined);
  console.assert(response.key !== null);
  console.assert(response.key !== '');
  return response.key;

}