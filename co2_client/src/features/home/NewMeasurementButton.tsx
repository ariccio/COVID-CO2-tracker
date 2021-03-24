import React from 'react';
import {Button} from 'react-bootstrap';
import {useLocation} from 'react-router-dom';
// Ok, so some profiling in dev mode shows that loading the Button from react-bootstrap in HomePage takes up to 18ms. Let's pull that component out here. It doesn't need to be in the home folder.

const clickHandler = (event: React.MouseEvent<HTMLElement, MouseEvent>, setShowCreateNewMeasurement: React.Dispatch<React.SetStateAction<boolean>>, showCreateNewMeasurement: boolean) => {
    event.stopPropagation();
    event.preventDefault();
    setShowCreateNewMeasurement(!showCreateNewMeasurement);
}


export const renderNewMeasurementButton = (currentPlace: google.maps.places.PlaceResult, location: ReturnType<typeof useLocation>, setShowCreateNewMeasurement: React.Dispatch<React.SetStateAction<boolean>>, showCreateNewMeasurement: boolean) => {
    if (!currentPlace.place_id) {
        console.log('not rendering button to add measurement.');
        return null;
    }
    return (
        <>
            <Button variant="primary" onClick={(event) => clickHandler(event, setShowCreateNewMeasurement, showCreateNewMeasurement)}>
                <b>Upload a new measurement for <i>{currentPlace.name}</i></b>
            </Button>
            {/* <Link to={{pathname:`/places/???/createmeasurement`, state: {background: location}}} className="btn btn-primary">
                
            </Link> */}
        </>
    )
}
