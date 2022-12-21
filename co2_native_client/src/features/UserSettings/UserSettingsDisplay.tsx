import { useState } from 'react';
import { Linking, Text } from 'react-native';
import { useSelector } from "react-redux";
import * as Sentry from 'sentry-expo';

import { unknownNativeErrorTryFormat } from '../../utils/FormatUnknownNativeError';
// import { defaultUserSettings } from "../../../../co2_client/src/utils/UserSettings";
import { MaybeIfValue } from "../../utils/RenderValues";
import { COVID_CO2_TRACKER_PLACES_URL } from '../../utils/UrlPaths';
import { useIsLoggedIn } from '../../utils/UseLoggedIn';
import { useOpenableLink, IfNotOpenable } from '../Links/OpenLink';
import { selectUserSettings, selectUserSettingsErrors } from "../userInfo/userInfoSlice"

async function openCO2TrackerPlacePage(setNativeErrors: React.Dispatch<React.SetStateAction<string | null>>, url: string) {
    console.log(`Opening ${url}...`)
    try {
        Linking.openURL(url);
    }
    catch (exception) {
        setNativeErrors(`Error opening web console: ${unknownNativeErrorTryFormat(exception)}`)
        Sentry.Native.captureException(exception);
    }
}


const LinkIfValue = (props: {setting_place_google_place_id?: string | null | undefined}) => {
    const [nativeErrors, setNativeErrors] = useState(null as (string | null));
    const placesUrl = (COVID_CO2_TRACKER_PLACES_URL + '/' + props.setting_place_google_place_id);
    const {openable} = useOpenableLink(placesUrl, setNativeErrors);

    if (!props.setting_place_google_place_id) {
        return null;
    }

    return (
        <>
            <IfNotOpenable openable={openable} url={placesUrl}/>
            <MaybeIfValue text="Native errors from link: " value={nativeErrors}/>
            <Text onLongPress={() => openCO2TrackerPlacePage(setNativeErrors, placesUrl)} onPress={() => openCO2TrackerPlacePage(setNativeErrors, placesUrl)}>Uploading place: {props.setting_place_google_place_id}</Text>
        </>
    )
}

// eslint-disable-next-line @typescript-eslint/ban-types
export const UserSettingsMaybeDisplay: React.FC<{}> = () => {
    const userSettings = useSelector(selectUserSettings);
    const userSettingsErrors = useSelector(selectUserSettingsErrors);

    const {loggedIn} = useIsLoggedIn();

    if (userSettings === undefined) {
        if (!loggedIn) {
            return null;
        }
        return (
            <>
                <Text>Loading user settings...</Text>
                <MaybeIfValue text="User settings errors: " value={userSettingsErrors}/>            
            </>
        )
    }
    if (userSettings === null) {
        return (
            <>
                <Text>User has not created settings.</Text>
                <MaybeIfValue text="User settings errors: " value={userSettingsErrors}/>            
            </>
        )
    }
    return (
        <>
            <MaybeIfValue text="User settings errors: " value={userSettingsErrors}/>
            <LinkIfValue setting_place_google_place_id={userSettings?.setting_place_google_place_id}/>
            <MaybeIfValue text="sublocation description: '" value={userSettings?.sublocation_description} suffix="'"/>
        </>
    )
}