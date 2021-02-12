import React, { SetStateAction, useState } from 'react';
// import { useSelector, useDispatch } from 'react-redux';
// import {Redirect, Link} from 'react-router-dom';


import {login, LoginResponse} from '../../utils/Authentication';


type eventChangeType = (event: React.ChangeEvent<HTMLInputElement>) => void;
type formSubmitType = (e: React.FormEvent<HTMLFormElement>) => void;

const onSubmit = async (email: string, password: string) => {
    const response: LoginResponse | null = await login(email, password);
    if (response === null) {
        console.log("hmm.")
        debugger;
        throw new Error("development")
        // return;
    }
    //this.props.loginUser(response.email, response.email, response.jwt)
    console.log(response.email, response);
    debugger;
    return;
    // <Redirect to='/'/>
    // alert("TODO: redirect here. For now please refresh.")
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

export const Login = () => {
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const setPasswordEvent = (event: React.ChangeEvent<HTMLInputElement>) => {
        setPassword(event.target.value);
    };
    const setEmailEvent = (event: React.ChangeEvent<HTMLInputElement>) => {
        setEmail(event.target.value);
    };
    const onSubmitEvent = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        onSubmit(email, password);
    }
    return (
        <>
            {formWithLink(password, setPasswordEvent, email, setEmailEvent, onSubmitEvent)}
        </>
    );
}