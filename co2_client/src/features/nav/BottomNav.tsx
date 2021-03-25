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
            <Navbar fixed="bottom">
                <Nav className="mr-auto">
                    <b>
                        <u>
                            <i>
                                <Nav.Link href="https://raw.githubusercontent.com/ariccio/COVID-CO2-tracker/main/privacy_policy.txt">Privacy Policy</Nav.Link>
                                <Nav.Link href="https://raw.githubusercontent.com/ariccio/COVID-CO2-tracker/main/terms_of_use.txt">Terms of Use</Nav.Link>
                            </i>
                        </u>
                    </b>
                </Nav>
            </Navbar>
        </>
    );
}