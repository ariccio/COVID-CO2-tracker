import React, {useEffect, useState} from 'react';

import { useSelector } from 'react-redux';
import {selectUsername} from '../login/loginSlice';
import {DevicesTable} from '../devices/DevicesTable';
import {MeasurementsTable} from '../measurements/MeasurementsTable';
import {queryUserInfo, UserInfoType, defaultUserInfo} from '../../utils/QueryUserInfo';

interface ProfileProps {

}

export const Profile: React.FC<ProfileProps> = () => {
    // debugger;
    const username = useSelector(selectUsername);

    const [userInfo, setUserInfo] = useState(defaultUserInfo);
    useEffect(() => {
        const userInfoPromise: Promise<UserInfoType> = queryUserInfo();
        userInfoPromise.then((userInfo) => {
            console.log(userInfo);
            setUserInfo(userInfo)
        })
    }, [])

    //TODO: if userInfo.errors?

    return (
        <>
            <h1>
                {username}'s profile'
                
            </h1>
            Devices:
            <DevicesTable devices={userInfo.user_info.devices}/>
            Measurements:
            <MeasurementsTable measurements={userInfo.user_info.measurements}/>
        </>
    )
}