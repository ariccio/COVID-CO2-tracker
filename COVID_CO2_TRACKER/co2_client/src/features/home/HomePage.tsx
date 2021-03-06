import React, {CSSProperties, FunctionComponent, useEffect, useState} from 'react';
import {useSelector} from 'react-redux';
import {Link, useLocation} from 'react-router-dom';
import {Button} from 'react-bootstrap';


import {selectSelectedPlace} from '../google/googleSlice';
import {getGoogleMapsJavascriptAPIKey} from '../../utils/GoogleAPIKeys';

import {GoogleMapsContainer} from '../google/GoogleMaps';

import {CreateNewMeasurementModal} from '../create/CreateMeasurement';

import {selectPlacesInfoFromDatabase, selectPlacesInfoErrors, SelectedPlaceDatabaseInfo} from '../places/placesSlice';

import {MeasurementsTable} from '../measurements/MeasurementsTable';

const renderSelectedPlaceInfo = (currentPlace: google.maps.places.PlaceResult) => {
    return (
        <>
            {(currentPlace.url && currentPlace.name ) ? (<><a href={currentPlace.url}><b>{currentPlace.name}</b></a></>) : null}
            <br/>
            {currentPlace.place_id ? <> current selected place_id: <i>{currentPlace.place_id}</i></> : null}
            <br/>
            {currentPlace.formatted_address ? <> address: <i>{currentPlace.formatted_address}</i></> : null}
            <br/>
            {/* {currentPlace.icon ? `currentPlace.icon: ${currentPlace.icon}` : null} 
            {currentPlace.icon ? <img src={currentPlace.icon} alt={`google supplied icon for ${currentPlace.name}`}/> : null}
            <br/> */}
            {currentPlace.types ? <> currentPlace.types <i>{currentPlace.types.join(', ')}</i> </> : null}
            <br/>
            {currentPlace.vicinity ? <> currentPlace.vicinity <i>{currentPlace.vicinity}</i> </>: null}
            <br/>
            {currentPlace.name ? <> currentPlace.name: <i>{currentPlace.name}</i> </> : null}
            <br/>

        </>
    )
}

const renderMapsWhenLoaded = (mapsAPIKey: string) => {
    if (mapsAPIKey !== '') {
        return (
            <>
                <GoogleMapsContainer api_key={mapsAPIKey}/>
            </>
        )
    }
    return (
        <>
            Loading google maps API key...
        </>
    );
}

const mapsDivStyle: CSSProperties = {
    display: "flex",
    alignItems: "left",
    justifyContent: "left"
}

const clickHandler = (event: React.MouseEvent<HTMLElement, MouseEvent>, setShowCreateNewMeasurement: React.Dispatch<React.SetStateAction<boolean>>, showCreateNewMeasurement: boolean) => {
    event.stopPropagation();
    event.preventDefault();
    setShowCreateNewMeasurement(!showCreateNewMeasurement);
}

const renderNewMeasurementButton = (currentPlace: google.maps.places.PlaceResult, location: ReturnType<typeof useLocation>, setShowCreateNewMeasurement: React.Dispatch<React.SetStateAction<boolean>>, showCreateNewMeasurement: boolean) => {
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


const renderInfoFromDatabase = (selectedPlaceInfoFromDatabase: SelectedPlaceDatabaseInfo, selectedPlaceInfoErrors: string) => {
    if (selectedPlaceInfoErrors !== '') {
        return (
            <>
                <div>
                    Failed to fetch measurement info from the database! {selectedPlaceInfoErrors}
                </div>
            </>
        )
    }
    if (selectedPlaceInfoFromDatabase.measurements.length === 0) {
        return null;
    }
    return (
        <>
            <MeasurementsTable measurements={selectedPlaceInfoFromDatabase.measurements}/>
        </>
    )
}

const renderPlace = (currentPlace: google.maps.places.PlaceResult, location: ReturnType<typeof useLocation>, setShowCreateNewMeasurement: React.Dispatch<React.SetStateAction<boolean>>, showCreateNewMeasurement: boolean, selectedPlaceInfoFromDatabase: SelectedPlaceDatabaseInfo, selectedPlaceInfoErrors: string) => {
    return (
        <>
            {renderSelectedPlaceInfo(currentPlace)}
            {renderNewMeasurementButton(currentPlace, location, setShowCreateNewMeasurement, showCreateNewMeasurement)}
            {renderInfoFromDatabase(selectedPlaceInfoFromDatabase, selectedPlaceInfoErrors)}
        </>
    );
}

export const HomePage: FunctionComponent<{}> = (props: any) => {
    const [mapsAPIKey, setMapsAPIKey] = useState("");
    const [errorState, setErrorState] = useState("");
    const currentPlace = useSelector(selectSelectedPlace);
    const [showCreateNewMeasurement, setShowCreateNewMeasurement] = useState(false);
    const location = useLocation();
    const selectedPlaceInfoFromDatabase = useSelector(selectPlacesInfoFromDatabase);
    const selectedPlaceInfoErrors = useSelector(selectPlacesInfoErrors);


    useEffect(() => {
        getGoogleMapsJavascriptAPIKey().then((key: string) => setMapsAPIKey(key)).catch((error) => {
            // debugger;
            setErrorState(error.message);
        })
    }, []);
  
    if (errorState !== '') {
        return (
            <>
                Error loading maps API key!
                <br/>
                {errorState}
            </>
        );
    }

    return (
        <>
            <h3>Welcome!</h3>
            <br/>
            <div style={mapsDivStyle}>
                <div>
                    {renderMapsWhenLoaded(mapsAPIKey)}

                </div>
                <br/>
                {errorState}
                <div style={{justifyContent: 'right'}}>
                    {renderPlace(currentPlace, location, setShowCreateNewMeasurement, showCreateNewMeasurement, selectedPlaceInfoFromDatabase, selectedPlaceInfoErrors)}
                    {showCreateNewMeasurement ? <CreateNewMeasurementModal showCreateNewMeasurement={showCreateNewMeasurement} setShowCreateNewMeasurement={setShowCreateNewMeasurement}/> : null}
                </div>
            </div>
        </>
    )
}