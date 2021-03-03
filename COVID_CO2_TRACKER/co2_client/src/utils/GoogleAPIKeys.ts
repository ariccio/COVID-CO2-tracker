import {API_URL} from './UrlPath';
import {formatErrors} from './ErrorObject';
import {fetchJSONWithChecks} from './FetchHelpers';

const GET_API_KEY_URL = API_URL + '/keys';
// const PLACES_SCRIPT_URL_API_KEY = GET_API_KEY_URL + `/${"PLACES_SCRIPT_URL_API_KEY"}`
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

// export async function getGooglePlacesScriptAPIKey(): Promise<string> {
//   console.error("this isn't even used?")
//   const requestOptions = apiKeyRequestOptions();
//   const rawFetchResponse: Promise<Response> = fetch(PLACES_SCRIPT_URL_API_KEY, requestOptions);
//   const awaitedResponse = await rawFetchResponse;
//   const jsonResponse: Promise<any> = awaitedResponse.json();
//   const response = await jsonResponse;
//   if (fetchFailed(awaitedResponse, response, 200, false)) {
//     console.error("couldn't get google places API key!");
//     debugger;
//     return '';
//   }
//   console.assert(response.key !== undefined);
//   console.assert(response.key !== null);
//   console.assert(response.key !== '');
//   return response.key;
// }


export async function getGoogleMapsJavascriptAPIKey(): Promise<string> {
  const requestOptions = apiKeyRequestOptions();

  const fetchFailedCallback = async (awaitedResponse: Response): Promise<string> => {
    console.error("couldn't get google maps API key!");
    debugger;
    const jsonResponse = (await awaitedResponse.json());
    console.log(jsonResponse);
    throw new Error(formatErrors(jsonResponse.errors));
  }
  const fetchSuccessCallback = async (awaitedResponse: Response): Promise<string> => {
    console.log("got google maps api key");
    return (await awaitedResponse.json()).key;
  }

  // debugger;
  const result = fetchJSONWithChecks(MAPS_JAVASCRIPT_API_KEY, requestOptions, 200, false, fetchFailedCallback, fetchSuccessCallback) as Promise<string>;
  return result;
  // try {
  //   const rawFetchResponse: Promise<Response> = fetch(MAPS_JAVASCRIPT_API_KEY, requestOptions);
  //   const awaitedResponse = await rawFetchResponse;
  //   // const jsonResponse: Promise<any> = awaitedResponse.json();
  //   // const parsedJSONResponse = await jsonResponse;
  //   if (fetchFailed(awaitedResponse, 200, false)) {
  //     console.error("couldn't get google maps API key!");
  //     throw new Error(formatErrors((await awaitedResponse.json()).errors));
  //     // debugger;
  //   }
  //   // console.assert(parsedJSONResponse.key !== undefined);
  //   // console.assert(parsedJSONResponse.key !== null);
  //   // console.assert(parsedJSONResponse.key !== '');
  //   return (await awaitedResponse.json()).key;
  // }
  // catch (error) {
  //   fetchFilter(error);
  // }

}