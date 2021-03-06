import React, {useEffect, useState} from 'react';

import { useSelector } from 'react-redux';
import {selectUsername} from '../login/loginSlice';
import {DevicesTable} from '../devices/DevicesTable';
import {MeasurementsTable} from '../measurements/MeasurementsTable';
import {queryUserInfo, UserInfoType, defaultUserInfo} from '../../utils/QueryUserInfo';

import {formatErrors} from '../../utils/ErrorObject';

interface ProfileProps {

}

export const Profile: React.FC<ProfileProps> = () => {
    // debugger;
    const username = useSelector(selectUsername);

    const [userInfo, setUserInfo] = useState(defaultUserInfo);
    const [errorState, setErrorState] = useState('');
    useEffect(() => {
        //TODO: should be in redux
        const userInfoPromise: Promise<UserInfoType> = queryUserInfo();
        userInfoPromise.then((userInfo) => {
            if (userInfo.errors !== undefined) {
                setErrorState(formatErrors(userInfo.errors));
            }
            console.log(userInfo);
            // debugger;
            setUserInfo(userInfo);
        }).catch((error) => {
            setErrorState(error.message);
        })
    }, [])

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
    return (
        <>
            <h1>
                {username}'s profile'
                
            </h1>
            Devices:
            <DevicesTable devices={userInfo.user_info.devices}/>
            Measurements:
            <MeasurementsTable measurements={userInfo.user_info.measurements}/>
            {errorState}
        </>
    )
}