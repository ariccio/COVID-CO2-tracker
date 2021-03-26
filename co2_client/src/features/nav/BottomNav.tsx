import React, {useEffect} from 'react';
import NavItem from 'react-bootstrap/NavItem';
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';


interface BottomNavProps {

}


// https://www.internetlegalattorney.com/website-privacy-policy-laws/
// "The text link should be written in capital letters equal to or greater in size than the surrounding text
// or in contrasting type, font, or color to the surrounding text,
// or set off from the surrounding text somehow with symbols or other marks that call attention to the language” (i.e. “PRIVACY POLICY”)""
//
export const BottomNav: React.FC<BottomNavProps> = (props: BottomNavProps) => {
    return (
        <>
            <Navbar>
                <Nav className="container-fluid justify-content-end mr-auto" variant="tabs" style={{display:"flex", flexDirection:"row", float: "right"}}>
                    <Nav.Link href="https://raw.githubusercontent.com/ariccio/COVID-CO2-tracker/main/privacy_policy.txt"><b><u><i>Privacy Policy</i></u></b></Nav.Link>
                    <Nav.Link href="https://raw.githubusercontent.com/ariccio/COVID-CO2-tracker/main/terms_of_use.txt"><b><u><i>Terms of Use</i></u></b></Nav.Link>
                </Nav>
            </Navbar>
        </>
    );
}