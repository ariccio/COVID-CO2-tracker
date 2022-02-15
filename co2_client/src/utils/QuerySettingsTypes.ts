import { UserSettings } from "./UserSettings";


  /*
{:data=>
  {:id=>"6",
   :type=>:user_setting,
   :attributes=>
    {:realtime_upload_place=>
      #<Place:0x000000000dc7a828
       id: 22,
       google_place_id: "ChIJAbAvU8dYwokRwAvBDqWmDMo",
       last_fetched: Tue, 25 Jan 2022 22:25:15.667697000 UTC +00:00,
       created_at: Thu, 11 Mar 2021 02:41:38.899104000 UTC +00:00,
       updated_at: Tue, 25 Jan 2022 22:25:15.669135000 UTC +00:00,
       place_lat: 0.40770339e2,
       place_lng: -0.73953588e2>,
     :realtime_upload_sub_location=>
      #<SubLocation:0x000000000f6a5f40
       id: 18,
       description: "None",
       place_id: 22,
       created_at: Sun, 28 Mar 2021 00:41:23.623733000 UTC +00:00,
       updated_at: Sun, 28 Mar 2021 02:14:01.550823000 UTC +00:00>}}}


data:
  attributes:
    realtime_upload_place:
      created_at: "2021-03-11T02:41:38.899Z"
      google_place_id: "ChIJAbAvU8dYwokRwAvBDqWmDMo"
      id: 22
      last_fetched: "2022-01-25T22:25:15.667Z"
      place_lat: "40.770339"
      place_lng: "-73.953588"
      updated_at: "2022-01-25T22:25:15.669Z"
    realtime_upload_sub_location:
      created_at: "2021-03-28T00:41:23.623Z"
      description: "None"
      id: 18
      place_id: 22
      updated_at: "2021-03-28T02:14:01.550Z"
  id: "6"
  type: "user_setting"
  */


export interface UserSettingsResponseData {
    data: {
      id: number,
      // type: string,
      attributes: {
        realtime_upload_place: {
          google_place_id: string,
          id: number
          // ...
          created_at: unknown,
          last_fetched: unknown,
          updated_at: unknown,
          place_lat: number,
          place_lng: number
        },
        realtime_upload_sub_location: {
          id: number,
          description: string,
          // ...
          place_id: number,
          created_at: unknown,
          updated_at: unknown
        }
      }
    }
  };

export function userSettingsResponseToStrongType(responseMaybeUserSettings: any): null | UserSettingsResponseData {
    if (responseMaybeUserSettings === null) {
      debugger;
      throw new Error("Missing responseMaybeUserSettings!");
    }
    if (responseMaybeUserSettings === undefined) {
      debugger;
      throw new Error("Missing responseMaybeUserSettings!");
    }
    if (responseMaybeUserSettings.data === null) {
      // debugger;
      // throw new Error("Missing responseMaybeUserSettings.data!");
      console.log("User has no settings.");
      return (null);
    }
    if (responseMaybeUserSettings.data === undefined) {
      debugger;
      throw new Error("Missing responseMaybeUserSettings.data!");
    }
    if (responseMaybeUserSettings.data.id === null) {
      debugger;
      throw new Error("Missing responseMaybeUserSettings.data.id!");
    }
    if (responseMaybeUserSettings.data.id === undefined) {
      debugger;
      throw new Error("Missing responseMaybeUserSettings.data.id!");
    }
  
    if (responseMaybeUserSettings.data.attributes === null) {
      debugger;
      throw new Error("Missing responseMaybeUserSettings.data.attributes!");
    }
  
    if (responseMaybeUserSettings.data.attributes === undefined) {
      debugger;
      throw new Error("Missing responseMaybeUserSettings.data.attributes!");
    }
  
    if (responseMaybeUserSettings.data.attributes.realtime_upload_place === null) {
      debugger;
      throw new Error("Missing responseMaybeUserSettings.data.attributes.realtime_upload_place!");
    }
    if (responseMaybeUserSettings.data.attributes.realtime_upload_place === undefined) {
      debugger;
      throw new Error("Missing responseMaybeUserSettings.data.attributes.realtime_upload_place!");
    }
    if (responseMaybeUserSettings.data.attributes.realtime_upload_place.google_place_id === null) {
      debugger;
      throw new Error("Missing responseMaybeUserSettings.data.attributes.realtime_upload_place.google_place_id!");
    }
    if (responseMaybeUserSettings.data.attributes.realtime_upload_place.google_place_id === undefined) {
      debugger;
      throw new Error("Missing responseMaybeUserSettings.data.attributes.realtime_upload_place.google_place_id!");
    }
    if (responseMaybeUserSettings.data.attributes.realtime_upload_sub_location === null) {
      debugger;
      throw new Error("Missing responseMaybeUserSettings.data.attributes.realtime_upload_sub_location!");
    }
    if (responseMaybeUserSettings.data.attributes.realtime_upload_sub_location === undefined) {
      debugger;
      throw new Error("Missing responseMaybeUserSettings.data.attributes.realtime_upload_sub_location!");
    }
    if (responseMaybeUserSettings.data.attributes.realtime_upload_sub_location.id === null) {
      debugger;
      throw new Error("Missing responseMaybeUserSettings.data.attributes.id!");
    }
    if (responseMaybeUserSettings.data.attributes.realtime_upload_sub_location.id === undefined) {
      debugger;
      throw new Error("Missing responseMaybeUserSettings.data.attributes.id!");
    }
    if (responseMaybeUserSettings.data.attributes.realtime_upload_sub_location.description === null) {
      debugger;
      throw new Error("Missing responseMaybeUserSettings.data.attributes.id!");
    }
    if (responseMaybeUserSettings.data.attributes.realtime_upload_sub_location.description === undefined) {
      debugger;
      throw new Error("Missing responseMaybeUserSettings.data.attributes.id!");
    }
    return responseMaybeUserSettings;
}

export function userSettingsResponseDataAsPlainSettings(response: UserSettingsResponseData | null): UserSettings | null {
  if (response === null) {
    return null;
  }
  const plainSettings: UserSettings = {
      realtime_upload_place_id: response.data.attributes.realtime_upload_place.id,
      realtime_upload_sub_location_id: response.data.attributes.realtime_upload_sub_location.id,
      setting_place_google_place_id: response.data.attributes.realtime_upload_place.google_place_id,
      sublocation_description: response.data.attributes.realtime_upload_sub_location.description
  }
  // debugger;
  return plainSettings;
}