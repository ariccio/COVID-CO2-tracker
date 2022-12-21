import {useEffect, useState} from 'react';
import { useSelector } from "react-redux";

import { selectJWT } from '../app/globalSlice';
import { selectUserName } from '../features/userInfo/userInfoSlice';
import { isLoggedIn } from './isLoggedIn';

export function useIsLoggedIn() {
    const jwt = useSelector(selectJWT);
    const userName = useSelector(selectUserName);
    const [loggedIn, setLoggedIn] = useState(false);

    useEffect(() => {
        if (jwt === null) {
            return;
        }
        if (userName === null) {
            return;
        }
        if (userName === undefined) {
            return;
        }
        setLoggedIn(isLoggedIn(jwt, userName))
    }, [jwt, userName]);

    return {loggedIn, jwt};
}

