import React, { SetStateAction, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
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
        })
    }

    return (
        <button onClick={clickAction}>
            Logout
        </button>
    )
}