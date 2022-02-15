import { userRequestOptions } from "./DefaultRequestOptions";
import { fetchJSONWithChecks } from "./FetchHelpers";
import { userSettingsResponseDataAsPlainSettings, userSettingsResponseToStrongType } from "./QuerySettingsTypes";
import { USER_SETTINGS_URL } from "./UrlPath";
import { UserSettings } from "./UserSettings";


const fetchSettingsSuccessCallback = async (awaitedResponse: Response): Promise<UserSettings | null> => {
    const response = await awaitedResponse.json();
  
    const rawUserSettings = userSettingsResponseToStrongType(response);
    const plainSettings = userSettingsResponseDataAsPlainSettings(rawUserSettings);
    return plainSettings;
  }
  
const fetchFailedCallback = async (awaitedResponse: Response): Promise<UserSettings> => {
    console.error("failed to fetch user settings");
    return awaitedResponse.json();
}

export async function queryUserSettings(): Promise<UserSettings | null> {
    const result = fetchJSONWithChecks(USER_SETTINGS_URL, userRequestOptions(), 200, false, fetchFailedCallback, fetchSettingsSuccessCallback) as Promise<UserSettings | null>;
    return result;
}