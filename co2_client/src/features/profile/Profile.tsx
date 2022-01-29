import React, {useEffect} from 'react';

import { useDispatch, useSelector } from 'react-redux';
import {selectUsername} from '../login/loginSlice';
import {DevicesTable} from '../devices/DevicesTable';
import {MeasurementsTable} from '../measurements/MeasurementsTable';
import {queryUserInfo} from '../../utils/QueryUserInfo';
import {UserInfoType, defaultUserInfo} from '../../utils/UserInfoTypes';

import {formatErrors} from '../../utils/ErrorObject';
import { selectUserInfoErrorState, selectUserInfoState, setUserInfoErrorState, setUserInfoState } from './profileSlice';
import { AppDispatch } from '../../app/store';

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
                {username}'s profile'
                
            </h1>
            Devices:
            <DevicesTable devices={userInfo.user_info.devices}/>
            Measurements:
            {maybeRenderMeasurements(userInfo)}
            {errorState}
        </div>
    )
}