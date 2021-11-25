import React from 'react';
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
import Card from 'react-bootstrap/Card';
import { ABOUT_ME_ARICCIO_URL, YOUTUBE_VIDEO_INSTRUCTIONS_URL } from '../../utils/UrlPath';
import { LinkContainer } from 'react-router-bootstrap';
import { moreInfoPath } from '../../paths/paths';


// https://www.internetlegalattorney.com/website-privacy-policy-laws/
// "The text link should be written in capital letters equal to or greater in size than the surrounding text
// or in contrasting type, font, or color to the surrounding text,
// or set off from the surrounding text somehow with symbols or other marks that call attention to the language” (i.e. “PRIVACY POLICY”)""
//
export const BottomNav: React.FC<{}> = () => {
    const aboutText = "This app provides a way for people to upload CO2 measurements tied to places where they were taken, and for users to view the measurements taken by others. CO2 is a fairly good proxy for indoor air quality, and indor COVID risk. By measuring CO2 indoors, we can estimate how much indoor air has already been exhaled by others, and thus, guess how much of it may contain COVID aerosols.";
    return (
        <>
            <br/>
            <br/>
            <br/>
                <Card className="container-fluid justify-content-start mr-auto" style={{width: '30rem', display: "flex", flexDirection: "column"}}>
                    <Card.Title>
                        About:
                    </Card.Title>
                    <Card.Text style={{fontStyle: 'italic'}}>
                        <LinkContainer to={moreInfoPath}>
                            <Nav.Link>
                                {aboutText}
                            </Nav.Link>

                        </LinkContainer>
                    </Card.Text>
                </Card>
                
                <br/>
                
                
            <Navbar>
                <Nav className="container-fluid justify-content-start mr-auto" variant="tabs" style={{display: "flex", flexDirection: "row", float: "left"}}>
                    <Nav.Link href={YOUTUBE_VIDEO_INSTRUCTIONS_URL}><b><u><i>Instruction video</i></u></b></Nav.Link>
                    <Nav.Link href={ABOUT_ME_ARICCIO_URL}><b><u><i>about me/questions</i></u></b></Nav.Link>
                </Nav>
                <Nav className="container-fluid justify-content-end mr-auto" variant="tabs" style={{display:"flex", flexDirection:"row", float: "right"}}>
                    <Nav.Link href="./privacy_policy.txt"><b><u><i>Privacy Policy</i></u></b></Nav.Link>
                    <Nav.Link href="./terms_of_use.txt"><b><u><i>Terms of Use</i></u></b></Nav.Link>
                </Nav>
            </Navbar>
        </>
    );
}