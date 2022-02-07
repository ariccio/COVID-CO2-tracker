import React, { useEffect, useState } from 'react';
import {Button, Spinner} from 'react-bootstrap';

import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '../../app/store';
import { postRequestOptions } from '../../utils/DefaultRequestOptions';
import { Errors, formatErrors } from '../../utils/ErrorObject';
import { fetchJSONWithChecks } from '../../utils/FetchHelpers';
import { USER_SETTINGS_URL } from '../../utils/UrlPath';
import { defaultUserInfo, UserSettings } from '../../utils/UserInfoTypes';
import { selectSelectedPlace } from '../google/googleSlice';
import { selectUsername } from '../login/loginSlice';
import { updateUserInfo } from '../profile/Profile';
import { selectUserInfoErrorState, selectUserInfoState, selectUserSettingsState } from '../profile/profileSlice';
import { selectSublocationSelectedLocationID } from '../sublocationsDropdown/sublocationSlice';

function sublocationSelected(sublocationID: number): boolean {
    if (sublocationID < 0) {
        return false;
    }
    return true;
}

interface NewOptionsResponseType {
    errors?: Errors
}

function newUserSettingsRequestInit(selectedSubLocation: number, place_id: string): RequestInit {
    if (selectedSubLocation === -1) {
        throw new Error("invariant, bug");
    }
    if (place_id === '') {
        throw new Error("invariant, bug");
    }
    const defaultRequestOptions = postRequestOptions();
    const newOptions = {
        ...defaultRequestOptions,
        body: JSON.stringify({
            user_settings: {
                realtime_upload_place_id: place_id,
                realtime_upload_sub_location_id: selectedSubLocation
            }
        })
    };
    return newOptions;
}

async function createSettings(selectedSubLocation: number, place_id: string): Promise<NewOptionsResponseType> {
    const init = newUserSettingsRequestInit(selectedSubLocation, place_id);
    const settingsFetchFailedCallback = async (awaitedResponse: Response): Promise<NewOptionsResponseType> => {
        console.error(`Failed to create settings! ${place_id}, ${selectedSubLocation}`);
        return awaitedResponse.json();
    }
    const settingsFetchSuceededCallback = async (awaitedResponse: Response): Promise<NewOptionsResponseType> => {
        console.log("TODO: strong type");
        return awaitedResponse.json();
    }

    const result = fetchJSONWithChecks(USER_SETTINGS_URL, init, 200, true, settingsFetchFailedCallback, settingsFetchSuceededCallback) as Promise<NewOptionsResponseType>;
    return result;
}

function sameSublocation(selectedSubLocation: number, realtime_upload_sub_location_id: number): boolean {
    if (realtime_upload_sub_location_id === selectedSubLocation) {
        return true;
    }
    return false;
}

const RealtimeUploadButtonIfSelectedPlace: React.FC<{selectedSubLocation: number, userInfoSettings: UserSettings | null}> = ({selectedSubLocation, userInfoSettings}) => {
    const [translate] = useTranslation();
    // debugger;
    if (userInfoSettings !== null) {
        if (userInfoSettings.realtime_upload_sub_location_id !== null) {
            console.log(`userInfoSettings.realtime_upload_sub_location_id: '${userInfoSettings.realtime_upload_sub_location_id}', selectedSubLocation: '${selectedSubLocation}'`);
            // console.log(`userInfoSettings.realtime_upload_place_id: ${userInfoSettings.realtime_upload_place_id}`)
            if (sameSublocation(selectedSubLocation, userInfoSettings.realtime_upload_sub_location_id)) {
                return (
                    <i>Already selected for realtime upload.</i>
                );
                debugger;
            }
        }
    }
    if (sublocationSelected(selectedSubLocation)) {
        return (
            <i><b>{translate("set-as-default-place-for-realtime-upload-client")}</b></i>
        );
    }
    return (
        <i>{translate("select-sublocation-to-set-as-default-for-realtime-upload")}</i>
    )
}

const handleButtonClick = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>, selectedSubLocation: number, place_id: string, setCreateErrors: React.Dispatch<React.SetStateAction<string | null>>, setLoading: React.Dispatch<React.SetStateAction<boolean>>, dispatch: AppDispatch) => {
    // debugger;
    event.stopPropagation();
    event.preventDefault();
    setLoading(true);
    debugger;
    createSettings(selectedSubLocation, place_id).then((result) => {
        // debugger;
        setLoading(false);
        if (result.errors) {
            setCreateErrors(formatErrors(result.errors));
            debugger;
        }
        else {
            console.log("sucesfully set upload settings?");
        }
    }).catch((error) => {
        debugger;
        setLoading(false);
        setCreateErrors(String(error));
    }).then(() => {
        return updateUserInfo(dispatch);
    }).catch((error) => {
        setCreateErrors(String(error));
    })
}


const MaybeCreateErrors: React.FC<{createErrors: string | null}> = ({createErrors}) => {
    if (createErrors === null) {
        return null;
    }
    if (createErrors === '') {
        return null;
    }
    return (
        <span>Error creating user settings: {createErrors}</span>
    )
}

function shouldDisableButton(selectedSubLocation: number, loading: boolean, place_id: string, realtime_upload_sub_location_id?: number| null ): boolean {
    if (!sublocationSelected(selectedSubLocation)) {
        return true;
    }
    if (realtime_upload_sub_location_id) {
        if (sameSublocation(selectedSubLocation, realtime_upload_sub_location_id)) {
            return true;
        }
    }
    if (loading) {
        return true;
    }
    return false;
}

const SpinnerOrSet: React.FC<{selectedSubLocation: number, loading: boolean, userInfoSettings: UserSettings | null}> = ({selectedSubLocation, loading, userInfoSettings}) => {
    const [translate] = useTranslation();
    if (loading) {
        return (
            <Spinner animation="border" role="status">
                <span className="visually-hidden">
                    {translate('submitting-measurement')}
                </span>
            </Spinner>
        );
    }
    return (
        <RealtimeUploadButtonIfSelectedPlace selectedSubLocation={selectedSubLocation} userInfoSettings={userInfoSettings}/>
    )
}

const MaybeUserInfoErrors: React.FC<{userInfoErrors: string}> = ({userInfoErrors}) => {
    if (userInfoErrors !== '') {
        <span>Realtime upload settings <i>might</i> not be available. Errors: {userInfoErrors}</span>
    }
    return null;
}

const ChoosePlaceWithUserInfo: React.FC<{place_id: string, userInfoSettings: UserSettings | null}> = ({place_id, userInfoSettings}) => {
    const selectedSubLocation = useSelector(selectSublocationSelectedLocationID);
    const dispatch = useDispatch();
    const [createErrors, setCreateErrors] = useState(null as (string | null));
    const [loading, setLoading] = useState(false);


    return (
        <>
            <Button variant="primary" disabled={shouldDisableButton(selectedSubLocation, loading, place_id, userInfoSettings?.realtime_upload_sub_location_id)} onClick={(event) => handleButtonClick(event, selectedSubLocation, place_id, setCreateErrors, setLoading, dispatch)}>
                <SpinnerOrSet selectedSubLocation={selectedSubLocation} loading={loading} userInfoSettings={userInfoSettings}/>
                {/* <RealtimeUploadButtonIfSelectedPlace selectedSubLocation={selectedSubLocation} /> */}
            </Button>
            <br/>
            <MaybeCreateErrors createErrors={createErrors}/><br/>
        </>
    );
}

export const ChoosePlaceAsDefault: React.FC<{place_id?: string | undefined}> = ({place_id}) => {
    // const userInfoSettings = useSelector(selectUserSettingsState);
    const userInfo = useSelector(selectUserInfoState);
    const userInfoErrors = useSelector(selectUserInfoErrorState);
    const userName = useSelector(selectUsername);
    // const currentPlace = useSelector(selectSelectedPlace);
    const dispatch = useDispatch();
    
    useEffect(() => {
        if (userInfo === defaultUserInfo) {
            updateUserInfo(dispatch);
        }
    }, [userInfo]);


    if (place_id === undefined) {
        return null;
    }
    if (place_id === null) {
        debugger;
        return null;
    }
    if (place_id === '') {
        debugger;
        return null;
    }
    if (userName === '') {
        return null;
    }
    // debugger;

    if (userInfo === defaultUserInfo) {
        return (
            <span>Loading user info...</span>
        );
    }

    return (
        <>
            <MaybeUserInfoErrors userInfoErrors={userInfoErrors}/><br/>
            <ChoosePlaceWithUserInfo place_id={place_id} userInfoSettings={userInfo.user_info.settings}/>
        </>
    )

}