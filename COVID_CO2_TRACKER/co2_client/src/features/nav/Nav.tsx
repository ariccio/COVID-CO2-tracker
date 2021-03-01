import React, {useEffect} from 'react';
import { useSelector, useDispatch } from 'react-redux';
// import {Link, Redirect} from 'react-router-dom';
import NavItem from 'react-bootstrap/NavItem';
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
import NavDropdown from 'react-bootstrap/NavDropdown';

import { LinkContainer } from 'react-router-bootstrap';

// import {Login, LoginFormType} from '../login/Login';
import {Logout} from '../login/Logout';
import {formatErrors} from '../../utils/ErrorObject';

import {manufacturersPath, homePath, devicesPath, profilePath, deviceModelsPath} from '../../paths/paths';

// import {HomePage} from '../home/HomePage';
import {selectUsername, setUsername} from '../login/loginSlice';

import {get_email} from '../../utils/Authentication';

type NavBarProps = {
}


const renderLoginSignup = (): JSX.Element => 
<>
    <LinkContainer to='login'>
        <NavItem className='nav-item'>Login</NavItem>                
    </LinkContainer>

    <LinkContainer to='signup'>
        <NavItem className='nav-item'>Signup</NavItem>                
    </LinkContainer>
</>


const loggedIn = (username: string) =>
  <NavDropdown title={`${username}!`} id="basic-nav-dropdown">
    <NavDropdown.Item>
        <LinkContainer to={profilePath}>
            <NavItem className='nav-item'>{username}'s profile</NavItem>
        </LinkContainer>
    </NavDropdown.Item>
    <NavDropdown.Item>
        <Logout/>
    </NavDropdown.Item>
  </NavDropdown>

function loginOrSignupMaybe(username: string): JSX.Element {
  if (username === '') {
    console.log("no username, rendering login/signup options")
    return renderLoginSignup();
  }
  console.log("logged in, rendering profile and logout")
  return loggedIn(username);
}


/*
      <Navbar>
        <Nav>
          <Navbar.Collapse className="justify-content-end" id="basic-navbar-nav">
          </Navbar.Collapse>
        </Nav>
      </Navbar>

*/

interface UserNavProps {
    username: string
}

// const profileIfLoggedIn = (username: string): JSX.Element => {
//     if (username === '') {
//         console.log("not logged in, not rendering profile tab");
//         return (<></>);
//     }

//     return (
//         <LinkContainer to='/profile'>
//             <NavItem className='nav-item'>{username}'s profile</NavItem>
//         </LinkContainer>
//     )
// }

const UserNav: React.FC<UserNavProps> = ({username}) =>
    <Navbar expand="sm" /*bg="dark" variant="dark"*/ >
        <Navbar.Toggle aria-controls="basic-navbar-nav"/>
        <Navbar.Collapse  id="basic-navbar-nav">
            <Nav justify={true} fill={false} variant="tabs" style={{display:"flex", flexDirection:"row", float: "left"}}>
                <LinkContainer to={homePath}>
                    <Nav.Link>Home</Nav.Link>
                </LinkContainer>
                <LinkContainer to={devicesPath}>
                    <Nav.Link>Devices</Nav.Link>
                </LinkContainer>
                <LinkContainer to={manufacturersPath}>
                    <Nav.Link>Manufacturers</Nav.Link>
                </LinkContainer>
                <LinkContainer to={deviceModelsPath}>
                    <Nav.Link>Models</Nav.Link>
                </LinkContainer>

            </Nav>
            <Nav className="container-fluid justify-content-end" variant="tabs" style={{display:"flex", flexDirection:"row", float: "right"}}>
                {/* {profileIfLoggedIn(username)} */}
                <Nav.Link href="https://github.com/ariccio/COVID-CO2-tracker">Github/sponsor</Nav.Link>
                {loginOrSignupMaybe(username)}
                {/* <LinkContainer to='/logout'><NavItem className='nav-item'>Logout {props.username}</NavItem></LinkContainer> */}
                {/* <NavItem className='nav-item' pullRight>{props.username}</NavItem> */}
            </Nav>
        </Navbar.Collapse>
    </Navbar>

const loadEmail = (dispatch: ReturnType<typeof useDispatch>) => {
  const emailPromise = get_email();
  emailPromise.then(email => {
    if (email === null) {
      console.warn('not logged in!');
      return;
    }
    if (email.errors === undefined){
      if (email.email === undefined) {
        alert("undefined response from server. Likely internal server error getting username!");
        debugger;
      }
      console.log("got email: ", email.email)
      dispatch(setUsername(email.email));
    }
    else {
      console.error('failed to get email!');
      console.error(formatErrors(email.errors))
    }
  }).catch((error) => {
    console.error(`Failed to get email from server! fetch itself failed with error ${error}`);
    alert(error.message);
    debugger;
    // throw error;
  })
}

export const NavBar: React.FC<NavBarProps> = (props: NavBarProps) => {
    const username = useSelector(selectUsername);
    const dispatch = useDispatch();
    useEffect(() => {loadEmail(dispatch)}, [dispatch]);
    // const setUsername_ 
    if (username !== '') {
      console.log(`Current username: ${username}`)
    }
    return <UserNav username={username}/>;
}
