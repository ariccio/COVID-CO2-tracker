import { useSelector } from "react-redux";
import { MaybeIfValue } from "../../utils/RenderValues";
import { selectUserSettings, selectUserSettingsErrors } from "../userInfo/userInfoSlice"


// eslint-disable-next-line @typescript-eslint/ban-types
export const UserSettingsMaybeDisplay: React.FC<{}> = () => {
    const userSettings = useSelector(selectUserSettings);
    const uesrSettingsErrors = useSelector(selectUserSettingsErrors);

    return (
        <>
            <MaybeIfValue text="User settings errors: " value={uesrSettingsErrors}/>
            <MaybeIfValue text="Uploading place: " value={userSettings?.setting_place_google_place_id}/>
            <MaybeIfValue text="sublocation description: '" value={userSettings?.sublocation_description} suffix="'"/>
        </>
    )
}