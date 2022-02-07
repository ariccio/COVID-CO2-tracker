import React, {useEffect, useState} from 'react';
import { Link } from 'react-router-dom';
import {Button} from 'react-bootstrap';

import { useDispatch, useSelector } from 'react-redux';
import {selectUsername} from '../login/loginSlice';
import {DevicesTable} from '../devices/DevicesTable';
import {MeasurementsTable} from '../measurements/MeasurementsTable';
import {queryUserInfo} from '../../utils/QueryUserInfo';
import {UserInfoType, defaultUserInfo} from '../../utils/UserInfoTypes';

import {Errors, formatErrors} from '../../utils/ErrorObject';
import { selectUserInfoErrorState, selectUserInfoState, setUserInfoErrorState, setUserInfoState } from './profileSlice';
import { AppDispatch } from '../../app/store';
import { placesPath } from '../../paths/paths';
import { deleteRequestOptions } from '../../utils/DefaultRequestOptions';
import { fetchJSONWithChecks } from '../../utils/FetchHelpers';
import { USER_SETTINGS_URL } from '../../utils/UrlPath';

interface ProfileProps {

}

export const updateUserInfo = (dispatch: AppDispatch) => {
    //TODO: should be in redux?
    const userInfoPromise: Promise<UserInfoType> = queryUserInfo();
    userInfoPromise.then((userInfo) => {
        if (userInfo.errors !== undefined) {
            dispatch(setUserInfoErrorState(formatErrors(userInfo.errors)));
            return;
        }
        // console.log(userInfo);
        // debugger;
        dispatch(setUserInfoState(userInfo));
    }).catch((error) => {
        debugger;
        dispatch(setUserInfoErrorState(error.message));
    })

}

const maybeRenderMeasurements = (userInfo: UserInfoType) => {
    if (userInfo.user_info.measurements.data === undefined) {
        console.log("measurements array is null, this is a bug, and this is an ugly hack to work around it. (Profile.tsx)");
        return (
            <div>
                <br/>
                <span>No measurements by this user. Yet.</span>
            </div>
        )
    }

    return (
        <div>
            <MeasurementsTable measurements={userInfo.user_info.measurements.data} withDelete withDevice/>
        </div>
    )
}

function deleteSettingsRequestInit(): RequestInit {
    const defaultRequestOptions = deleteRequestOptions();
    // const newOptions = {
    //     ...defaultRequestOptions
    // }
    return defaultRequestOptions;
}

interface DeleteSettingsResponseType {
    errors?: Errors
}

const deleteSettings = () => {
    const init = deleteSettingsRequestInit();
    const deleteSettingsFailedCallback = async (awaitedResponse: Response): Promise<DeleteSettingsResponseType> => {
        console.error(`Failed to delete settings!`);
        return awaitedResponse.json();
    }
    const deleteSettingsSuccessCallback = async (awaitedResponse: Response): Promise<DeleteSettingsResponseType> => {
        console.error(`Sucessfully deleted settings!`);
        return awaitedResponse.json();
    }
    const result = fetchJSONWithChecks(USER_SETTINGS_URL, init, 200, true, deleteSettingsFailedCallback, deleteSettingsSuccessCallback) as Promise<DeleteSettingsResponseType>;
    return result;
}

const handleClearSettings = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>, setLoading: React.Dispatch<React.SetStateAction<boolean>>, setDeleteErrors: React.Dispatch<React.SetStateAction<string | null>>, dispatch: AppDispatch) => {
    event.stopPropagation();
    event.preventDefault();
    setLoading(true);
    setDeleteErrors(null);
    deleteSettings().then((response) => {
        setLoading(false);
        if (response.errors) {
            setDeleteErrors(formatErrors(response.errors));
            debugger;
            return;
        }
        updateUserInfo(dispatch);
    }).catch((error) => {
        setLoading(false);
        setDeleteErrors(String(error));
    })
}

const maybeDeleteErrors = (deleteErrors: string | null) => {
    if (deleteErrors === null) {
        return null;
    }
    if (deleteErrors === '') {
        return null;
    }
    return (
        <span>Errors deleting settings: {deleteErrors}</span>
    );
}

const Settings: React.FC<{userInfo: UserInfoType}> = ({userInfo}) => {
    const [deleteErrors, setDeleteErrors] = useState(null as (string | null));
    const [loading, setLoading] = useState(false);
    const dispatch = useDispatch();

    // if (userInfo === defaultUserInfo) {
    //     console.log("user info loading...");
    //     return null;
    // }
    if (userInfo.user_info.settings === null) {
        console.log("No user settings?");
        return (
            <span>User has not created settings yet.</span>
        );
    }
    if (userInfo.user_info.settings === undefined) {
        debugger;
        console.log("No user settings?");
        return (
            <span>User has not created settings yet.</span>
        );
    }

    if (userInfo.user_info.settings.realtime_upload_place_id === null) {
        return (
            <span>You have not set a default place for realtime upload.</span>
        );
    }
    if (userInfo.user_info.settings.realtime_upload_place_id === undefined) {
        // debugger;
        return (
            <span>You have not set a default place for realtime upload.</span>
        );
    }
    if (userInfo.user_info.settings.realtime_upload_sub_location_id === null) {
        return (
            <span>You have not set a default sublocation for upload.</span>
        );
    }
    if (userInfo.user_info.settings.realtime_upload_sub_location_id === undefined) {
        debugger;
        return (
            <span>You have not set a default sublocation for upload.</span>
        );
    }

    if (userInfo.user_info.settings.setting_place_google_place_id === null) {
        debugger;
    }
    // debugger;
    // if (userInfo.user_info.settings.realtime_upload_place_id === '') {
    //     return (
    //         <span>The place you have specified for realtime upload is empty. Please try again.</span>
    //     );
    // }
    // if (userInfo.user_info.settings.realtime_upload_sub_location_id === '') {
    //     return (
    //         <span>The sublocation you have specified for realtime upload is empty. Please try again.</span>
    //     );
    // }
    return (
        <>
            <span>You're currently uploading to this place: <Link to={`${placesPath}/${userInfo.user_info.settings.setting_place_google_place_id}`}>{userInfo.user_info.settings.setting_place_google_place_id}</Link></span><br/>
            <Button variant="secondary" onClick={(event) => handleClearSettings(event, setLoading, setDeleteErrors, dispatch)}>
                Clear upload settings
            </Button><br/>
            {maybeDeleteErrors(deleteErrors)}
        </>
    )
}

export const Profile: React.FC<ProfileProps> = () => {
    // debugger;
    const username = useSelector(selectUsername);

    // const [userInfo, setUserInfo] = useState(defaultUserInfo);
    const userInfo = useSelector(selectUserInfoState);
    const errorState = useSelector(selectUserInfoErrorState);
    const dispatch = useDispatch();

    // const [errorState, setErrorState] = useState('');
    useEffect(() => {
        updateUserInfo(dispatch);
    }, [dispatch])

    //TODO: if userInfo.errors?
    if (userInfo === defaultUserInfo) {
        if (errorState === '') {
            return (
                <div>
                    <h1>
                        Loading profile information...
                    </h1>
                </div>
            );
        }
        return (
            <div>
                <p>
                    Not logged in!
                    {errorState}
                </p>
            </div>
            
        )
    }
    // Something is undefined in prod. What is it?
    if (userInfo === undefined) {
        throw new Error("userInfo is undefined! This is a bug in Profile.tsx.");
    }
    if (userInfo.user_info === undefined) {
        throw new Error("userInfo.user_info is undefined! This is a bug in Profile.tsx.");
    }
    if (userInfo.user_info.devices === undefined) {
        throw new Error("userInfo.user_info.devices is undefined! This is a bug in Profile.tsx.");
    }
    //TODO: show device serial in measurements table here?
    return (
        <div>
            <h1>
                {username}'s profile
                
            </h1>
            <Settings userInfo={userInfo}/><br/>
            Devices:
            <DevicesTable devices={userInfo.user_info.devices}/>
            Measurements:
            {maybeRenderMeasurements(userInfo)}
            {errorState}
        </div>
    )
}