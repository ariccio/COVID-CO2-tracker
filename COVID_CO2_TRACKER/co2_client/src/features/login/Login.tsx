import React, { SetStateAction, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
// import {Redirect, Link} from 'react-router-dom';

import {Form, Button} from 'react-bootstrap';

import {setUsername} from './loginSlice';

import {login, LoginResponse, signup, SignupResponse} from '../../utils/Authentication';
import { assert } from 'console';


export enum LoginFormType {
    Login,
    Signup
}


//In COVID_CO2_TRACKER\co2_client\node_modules\react-bootstrap\esm\FormControl.d.ts:
// declare type FormControlElement = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
type eventChangeType = (event: React.ChangeEvent<HTMLInputElement>) => void;
type formSubmitType = (event: React.FormEvent<HTMLFormElement>) => void;


const onSubmitLoginForm = async (email: string, password: string,
    setInvalid: React.Dispatch<React.SetStateAction<boolean>>, dispatch: any) => {
        debugger;
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
        debugger;
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
    <Form.Group controlId="formBasicEmail">
        <Form.Label>Email</Form.Label>
        <Form.Control type="email" value={email} onChange={emailChange}/>
    </Form.Group>
    // <input
    //     name="email"
    //     type="text"
    //     placeholder="email"
    //     value={email}
    //     onChange={emailChange}
    // />

const passwordField = (password: string, passwordChange: eventChangeType) =>
    <Form.Group controlId="formBasicPassword">
        <Form.Label>Password</Form.Label>
        <Form.Control value={password} type="password" onChange={passwordChange}/>
    </Form.Group>
    // <input
    //     name="password"
    //     type="password"
    //     value={password}
    //     onChange={passwordChange}
    // />


const formWithLink = (password: string, setPassword: eventChangeType, email: string, setEmail: eventChangeType, onSubmitEvent: formSubmitType, formType: LoginFormType) =>
    <Form onSubmit={onSubmitEvent}>
        {inputField(email, setEmail)}
        {passwordField(password, setPassword)}
        <Button type="submit">{formType === LoginFormType.Login ? "Login" : "Signup"}</Button>
        {/* <Link to='/signup'>Sign up</Link> */}
    </Form>

export interface LoginProps {
    formType: LoginFormType
} 


//Honestly I should just define this as a bound function that with the prop as a default.
export const Login = ({formType}: LoginProps) => {
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [invalid, setInvalid] = useState(false);
    const dispatch = useDispatch();
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
    return (
        <>
            {invalid ? "try again!" : null}
            {formWithLink(password, setPasswordEvent, email, setEmailEvent, onSubmitEvent, formType)}
        </>
    );
}