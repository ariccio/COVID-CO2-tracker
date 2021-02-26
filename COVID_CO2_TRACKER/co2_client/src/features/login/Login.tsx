import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {Redirect} from 'react-router-dom';
import {setUsername, selectUsername} from './loginSlice';

import {login, LoginResponse, signup, SignupResponse} from '../../utils/Authentication';
import {profilePath} from '../../paths/paths';

export enum LoginFormType {
    Login,
    Signup
}


type eventChangeType = (event: React.ChangeEvent<HTMLInputElement>) => void;
type formSubmitType = (event: React.FormEvent<HTMLFormElement>) => void;


const onSubmitLoginForm = async (email: string, password: string,
    setInvalid: React.Dispatch<React.SetStateAction<boolean>>, dispatch: any) => {
        const response: LoginResponse | null = await login(email, password);
        if (response === null) {
            console.log("hmm.")
            // debugger;
            setInvalid(true);
            return;
        }
        //this.props.loginUser(response.email, response.email, response.jwt)
        dispatch(setUsername(response.email));
        // debugger;
        return;
        // <Redirect to='/'/>
        // alert("TODO: redirect here. For now please refresh.")
    }

const onSubmitSignupForm = async (email: string, password: string,
    setInvalid: React.Dispatch<React.SetStateAction<boolean>>, dispatch: any) => {
        const response: SignupResponse | null = await signup(email, password);
        if (response === null) {
            console.log("hmm.")
            // debugger;
            setInvalid(true);
            return;
        }
        //this.props.loginUser(response.email, response.email, response.jwt)
        dispatch(setUsername(response.email));
        // debugger;
        return;
        // <Redirect to='/'/>
        // alert("TODO: redirect here. For now please refresh.")

    }

const onSubmit = async (email: string, password: string,
    setInvalid: React.Dispatch<React.SetStateAction<boolean>>, dispatch: any, typeOfInstance: LoginFormType) => {    
    if (typeOfInstance === LoginFormType.Login) {
        return onSubmitLoginForm(email, password, setInvalid, dispatch);
    }
    console.assert(typeOfInstance === LoginFormType.Signup);
    return onSubmitSignupForm(email, password, setInvalid, dispatch);
} 

const inputField = (email: string, emailChange: eventChangeType) =>
    <input
        name="email"
        type="text"
        placeholder="email"
        value={email}
        onChange={emailChange}
    />

const passwordField = (password: string, passwordChange: eventChangeType) => 
    <input
        name="password"
        type="password"
        value={password}
        onChange={passwordChange}
    />


const formWithLink = (password: string, setPassword: eventChangeType, email: string, setEmail: eventChangeType, onSubmitEvent: formSubmitType) =>
    <>
    <form onSubmit={onSubmitEvent}>
        {inputField(email, setEmail)}
        {passwordField(password, setPassword)}
        <button type="submit">Login</button>
    </form>
    {/* <Link to='/signup'>Sign up</Link> */}
    </>

export interface LoginProps {
    formType: LoginFormType
} 

export const Login = ({formType}: LoginProps) => {
    console.log("TODO: use bootstrap form. Even has a feedback option for the errors!")
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [invalid, setInvalid] = useState(false);
    const dispatch = useDispatch();
    const username = useSelector(selectUsername);
    const setPasswordEvent = (event: React.ChangeEvent<HTMLInputElement>) => {
        setPassword(event.target.value);
    };
    const setEmailEvent = (event: React.ChangeEvent<HTMLInputElement>) => {
        setEmail(event.target.value);
    };
    const onSubmitEvent = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        onSubmit(email, password, setInvalid, dispatch, formType);
    }
    // debugger;
    if (username !== '') {
        return <Redirect to={profilePath}/>
    }
    return (
        <>
            {invalid ? "try again!" : null}
            {formWithLink(password, setPasswordEvent, email, setEmailEvent, onSubmitEvent)}
        </>
    );
}

export const LoginComponent = () =>
  <>
    Login: <Login formType={LoginFormType.Login}/>
  </>

export const SignupComponent = () =>
    <>
        Signup: <Login formType={LoginFormType.Signup}/>
    </>
