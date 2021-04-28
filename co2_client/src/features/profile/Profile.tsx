import React, {useEffect} from 'react';

import { useDispatch, useSelector } from 'react-redux';
import {selectUsername} from '../login/loginSlice';
import {DevicesTable} from '../devices/DevicesTable';
import {MeasurementsTable} from '../measurements/MeasurementsTable';
import {queryUserInfo, UserInfoType, defaultUserInfo} from '../../utils/QueryUserInfo';

import {formatErrors} from '../../utils/ErrorObject';
import { selectUserInfoErrorState, selectUserInfoState, setUserInfoErrorState, setUserInfoState } from './profileSlice';

interface ProfileProps {

}

export const updateUserInfo = (dispatch: ReturnType<typeof useDispatch>) => {
    //TODO: should be in redux?
    const userInfoPromise: Promise<UserInfoType> = queryUserInfo();
    userInfoPromise.then((userInfo) => {
        if (userInfo.errors !== undefined) {
            dispatch(setUserInfoErrorState(formatErrors(userInfo.errors)));
        }
        console.log(userInfo);
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
            <>
                <br/>
                <span>No measurements by this user. Yet.</span>
            </>
        )
    }

    return (
        <>
            <MeasurementsTable measurements={userInfo.user_info.measurements.data} withDelete withDevice/>
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
                <h1>
                    Loading profile information...
                </h1>
            );
        }
        return (
            <>
                <p>
                    Not logged in!
                    {errorState}
                </p>
            </>
            
        )
    }
    //TODO: show device serial in measurements table here?
    return (
        <>
            <h1>
                {username}'s profile'
                
            </h1>
            Devices:
            <DevicesTable devices={userInfo.user_info.devices}/>
            Measurements:
            {maybeRenderMeasurements(userInfo)}
            {errorState}
        </>
    )
}