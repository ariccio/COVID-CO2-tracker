export interface UserSettings {
    realtime_upload_place_id?: number | null;
    realtime_upload_sub_location_id?: number | null;
    setting_place_google_place_id?: string | null;
    sublocation_description: string | null;
}


// export const defaultUserSettings: UserSettings = {
//     realtime_upload_place_id: null,
//     realtime_upload_sub_location_id: null,
//     setting_place_google_place_id: null,
//     sublocation_description: null
// };