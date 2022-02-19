import { Text } from 'react-native';
import { useSelector } from "react-redux";

// import { defaultUserSettings } from "../../../../co2_client/src/utils/UserSettings";
import { MaybeIfValue } from "../../utils/RenderValues";
import { selectUserSettings, selectUserSettingsErrors } from "../userInfo/userInfoSlice"


// eslint-disable-next-line @typescript-eslint/ban-types
export const UserSettingsMaybeDisplay: React.FC<{}> = () => {
    const userSettings = useSelector(selectUserSettings);
    const userSettingsErrors = useSelector(selectUserSettingsErrors);

    if (userSettings === undefined) {
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
            <MaybeIfValue text="Uploading place: " value={userSettings?.setting_place_google_place_id}/>
            <MaybeIfValue text="sublocation description: '" value={userSettings?.sublocation_description} suffix="'"/>
        </>
    )
}