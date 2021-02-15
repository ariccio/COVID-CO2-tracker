import React, {FunctionComponent, useEffect} from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {Redirect} from 'react-router-dom';
import NavItem from 'react-bootstrap/NavItem';
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
import NavDropdown from 'react-bootstrap/NavDropdown';

import { LinkContainer } from 'react-router-bootstrap';

import {Login, LoginFormType} from '../login/Login';
import {Logout} from '../login/Logout';

// import {HomePage} from '../home/HomePage';
import {selectUsername, setUsername} from '../login/loginSlice';

import {get_email} from '../../utils/Authentication';

type NavBarProps = {
}


const renderLoginSignup = (): JSX.Element => 
  <NavDropdown title={"Login/signup"} id="basic-nav-dropdown">
    <NavDropdown.Item>
      Login: <Login formType={LoginFormType.Login}/>
    </NavDropdown.Item>
    <NavDropdown.Item>
      Signup: <Login formType={LoginFormType.Signup}/>
    </NavDropdown.Item>
    
  </NavDropdown>

const loggedIn = (username: string) =>
  <NavDropdown title={`You're logged in as ${username}!`} id="basic-nav-dropdown">
    <NavDropdown.Item><Logout/></NavDropdown.Item>
  </NavDropdown>

function loginOrSignupMaybe(username: string): JSX.Element {
  if (username === '') {
    return renderLoginSignup();
  }
  else {
    return loggedIn(username);
  }
}


/*
      <Navbar>
        <Nav>
          <Navbar.Collapse className="justify-content-end" id="basic-navbar-nav">
          </Navbar.Collapse>
        </Nav>
      </Navbar>

*/
const UserNav: FunctionComponent<{username: string}> = (props: any) =>
    <Navbar expand="lg">
        <Navbar.Toggle aria-controls="basic-navbar-nav"/>
        <Navbar.Collapse className="justify-content-end" id="basic-navbar-nav">
            <Nav>
                <LinkContainer to='/home'>
                    <NavItem className='nav-item'>Home</NavItem>
                </LinkContainer>
                {loginOrSignupMaybe(props.username)}
                {/* <LinkContainer to='/logout'><NavItem className='nav-item'>Logout {props.username}</NavItem></LinkContainer> */}
                {/* <NavItem className='nav-item' pullRight>{props.username}</NavItem> */}
            </Nav>
        </Navbar.Collapse>
    </Navbar>


export const NavBar: FunctionComponent<NavBarProps> = (props: NavBarProps) => {
    const username = useSelector(selectUsername);
    const dispatch = useDispatch();
    useEffect(() => {
      const emailPromise = get_email();
      emailPromise.then(email => {
        if (email.errors === undefined){
          if (email.email === undefined) {
            alert("undefined response from server. Likely internal server error getting username!");
            debugger;
          }
          dispatch(setUsername(email.email));
        }
      })
    }, [dispatch]);
  
    console.log(`Current username: ${username}`)
    return <UserNav username={username}/>;
}
