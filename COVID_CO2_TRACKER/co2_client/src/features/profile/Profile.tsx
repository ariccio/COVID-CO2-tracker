import React from 'react';

import { useSelector, useDispatch } from 'react-redux';

import {selectUsername} from '../login/loginSlice';

interface ProfileProps {

}

export const Profile: React.FC<ProfileProps> = () => {
    const username = useSelector(selectUsername);

    return (
        <h1>
            {username}'s profile'
        </h1>
    )
}