import { userRequestOptions } from "./DefaultRequestOptions";
import { fetchJSONWithChecks } from "./FetchHelpers";
import { userSettingsResponseDataAsPlainSettings, userSettingsResponseToStrongType } from "./QuerySettingsTypes";
import { USER_SETTINGS_URL } from "./UrlPath";
import { UserSettings } from "./UserSettings";


const fetchSettingsSuccessCallback = async (awaitedResponse: Response): Promise<UserSettings> => {
    const response = await awaitedResponse.json();
  
    const plainSettings = userSettingsResponseDataAsPlainSettings(await userSettingsResponseToStrongType(response));
    return plainSettings;
  }
  
const fetchFailedCallback = async (awaitedResponse: Response): Promise<UserSettings> => {
    console.error("failed to fetch user settings");
    return awaitedResponse.json();
}

export async function queryUserSettings(): Promise<UserSettings> {
    const result = fetchJSONWithChecks(USER_SETTINGS_URL, userRequestOptions(), 200, true, fetchFailedCallback, fetchSettingsSuccessCallback) as Promise<UserSettings>;
    return result;
}