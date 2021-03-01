import React from 'react';
import { useDispatch } from 'react-redux';
// import {Redirect, Link} from 'react-router-dom';
import {setUsername} from '../login/loginSlice';
import {logout} from '../../utils/Authentication';

export const Logout = () => {
    const dispatch = useDispatch();

    const clickAction = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        const result = logout();
        result.then(result => {
            if (result.errors === undefined) {
                dispatch(setUsername(''));
            }
        }).catch((error) => {
            // alert(error)
            alert(`unable to log out, network error: ${error.message}`)
        })
    }

    return (
        <button onClick={clickAction}>
            Logout
        </button>
    )
}