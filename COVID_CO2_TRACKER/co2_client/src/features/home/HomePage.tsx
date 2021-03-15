import React, {CSSProperties, FunctionComponent, useEffect, useState} from 'react';
import {useSelector} from 'react-redux';
import {Link, useLocation} from 'react-router-dom';
import {Button} from 'react-bootstrap';


import {selectSelectedPlace, defaultGooglePlacesState, selectPlacesServiceStatus} from '../google/googleSlice';
import {getGoogleMapsJavascriptAPIKey} from '../../utils/GoogleAPIKeys';

import {GoogleMapsContainer} from '../google/GoogleMaps';

import {CreateNewMeasurementModal} from '../create/CreateMeasurement';

import {selectPlacesInfoFromDatabase, selectPlacesInfoErrors, SelectedPlaceDatabaseInfo, defaultPlaceInfo, selectPlaceExistsInDatabase} from '../places/placesSlice';

import {MeasurementsTable} from '../measurements/MeasurementsTable';
import { current } from '@reduxjs/toolkit';

const renderLinkWithName = (url?: string, name?: string) => {
    if (url === undefined) {
        return (
            <>
                Missing url!
                <br/>
            </>
        );
    }
    if (name === undefined) {
        return (
            <>
                Missing name!
                <br/>
            </>
        );
    }
    return (
        <>
            <a href={url}>
                <b>{name}</b>
            </a>
            <br/>
        </>
    );
}

const renderPlaceId = (place_id?: string) => {
    if (place_id === undefined) {
        return (
            <>
                Missing place ID!
                <br/>
            </>
        );
    }
    return (
        <>
            current selected place_id: <i>{place_id}</i>
            <br/>
        </>
    );
}

const renderFormattedAddress = (formatted_address?: string) => {
    if (formatted_address === undefined) {
        return (
            <>
                Formatted address missing!
                <br/>
            </>
        );
    }
    return (
        <>
            address: <i>{formatted_address}</i>
            <br/>
        </>
    );
}

const renderTypes = (types?: Array<string>) => {
    if (types === undefined) {
        return (
            <>
                Missing types!
                <br/>
            </>
        );
    }
    return (
        <>
            types: <i>{types.join(', ')}</i>
            <br/>
        </>
    );
}

const renderVicinity = (vicinity?: string) => {
    if (vicinity === undefined) {
        return (
            <>
                Missing vicinity!
                <br/>
            </>
        );
    }
    return (
        <>
            currentPlace.vicinity <i>{vicinity}</i>
            <br/>
        </>
    );
}

const renderName = (name?: string) => {
    if (name === undefined) {
        return (
            <>
                Missing place name!
                <br/>
            </>
        );
    };
    return (
        <>
            currentPlace.name: <i>{name}</i>
            <br/>
        </>
    );
}

const renderPlacesServiceStatus = (placesServiceStatus: google.maps.places.PlacesServiceStatus) => {
    return (
        <>
            <div>
                Google Places service status: {placesServiceStatus}
                <br/>
            </div>
        </>
    );
}

const renderPlacesServiceStatusWithHighlight = (placesServiceStatus: google.maps.places.PlacesServiceStatus) => {
    if (placesServiceStatus !== google.maps.places.PlacesServiceStatus.OK) {
        return (
            <>
                <b><i><u>
                    {renderPlacesServiceStatus(placesServiceStatus)}
                </u></i></b>
            </>
        )
    }
    return (
        <>
            {renderPlacesServiceStatus(placesServiceStatus)}
        </>
    )
}

const renderSelectedPlaceInfo = (currentPlace: google.maps.places.PlaceResult, placesServiceStatus: google.maps.places.PlacesServiceStatus | null) => {
    if (currentPlace === defaultGooglePlacesState.selected) {
        return null;
        // return (
        //     <>
        //         No place selected.
        //     </>
        // );
    }
    if (placesServiceStatus === null) {
        return (
            <>
                Places service still loading response, null status...
            </>
        )
    }
    return (
        <>
            {renderPlacesServiceStatusWithHighlight(placesServiceStatus)}
            {renderLinkWithName(currentPlace.url, currentPlace.name)}
            {renderPlaceId(currentPlace.place_id)}
            {renderFormattedAddress(currentPlace.formatted_address)}
            {/* {currentPlace.icon ? `currentPlace.icon: ${currentPlace.icon}` : null} 
            {currentPlace.icon ? <img src={currentPlace.icon} alt={`google supplied icon for ${currentPlace.name}`}/> : null}
            <br/> */}
            {renderTypes(currentPlace.types)}
            {renderVicinity(currentPlace.vicinity)}
            {renderName(currentPlace.name)}
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


const renderInfoFromDatabase = (selectedPlaceInfoFromDatabase: SelectedPlaceDatabaseInfo, selectedPlaceInfoErrors: string, currentPlace: google.maps.places.PlaceResult, selectedPlaceExistsInDatabase: boolean | null) => {
    if (currentPlace === defaultGooglePlacesState.selected) {
        //No place selected yet.
        return null;
    }
    if (selectedPlaceInfoErrors !== '') {
        return (
            <>
                <div>
                    Failed to fetch measurement info from the database! {selectedPlaceInfoErrors}
                </div>
            </>
        )
    }
    if (selectedPlaceInfoFromDatabase.measurements === null) {
        if (selectedPlaceExistsInDatabase === null) {
            return (
                <>
                    Querying database to see if we already know about this place...
                </>
            )
        }
        if (selectedPlaceExistsInDatabase === false) {
            return (
                <div>
                    No measurements uploaded for this place yet.
                </div>
            )    
        }
        return (
            <>
                <br/>
                Loading place info from database...
                <br/>
            </>
        );
    }
    console.assert(selectedPlaceExistsInDatabase !== null);
    console.assert(selectedPlaceExistsInDatabase !== false);
    if (selectedPlaceInfoFromDatabase.measurements === undefined) {
        console.assert(selectedPlaceInfoFromDatabase === defaultPlaceInfo);
        debugger;
    }
    //TODO: need strong type in updatePlacesInfoFromBackend, else this can be undefined!
    if (selectedPlaceInfoFromDatabase.measurements.length === 0) {
        // debugger;
        return (
            <div>
                Zero measurements recorded for this place.
            </div>
        )
    }
    return (
        <>
            <MeasurementsTable measurements={selectedPlaceInfoFromDatabase.measurements}/>
        </>
    )
}

const renderPlace = (currentPlace: google.maps.places.PlaceResult, location: ReturnType<typeof useLocation>, setShowCreateNewMeasurement: React.Dispatch<React.SetStateAction<boolean>>, showCreateNewMeasurement: boolean, selectedPlaceInfoFromDatabase: SelectedPlaceDatabaseInfo, selectedPlaceInfoErrors: string, placesServiceStatus: google.maps.places.PlacesServiceStatus | null, selectedPlaceExistsInDatabase: boolean | null) => {
    return (
        <>
            {renderSelectedPlaceInfo(currentPlace, placesServiceStatus)}
            {renderNewMeasurementButton(currentPlace, location, setShowCreateNewMeasurement, showCreateNewMeasurement)}
            <br/>
            <br/>
            {renderInfoFromDatabase(selectedPlaceInfoFromDatabase, selectedPlaceInfoErrors, currentPlace, selectedPlaceExistsInDatabase)}
            <br/>
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
    const selectedPlaceInfoFromDatabaseErrors = useSelector(selectPlacesInfoErrors);
    const selectedPlaceExistsInDatabase = useSelector(selectPlaceExistsInDatabase);
    const placesServiceStatus = useSelector(selectPlacesServiceStatus);

    useEffect(() => {
        getGoogleMapsJavascriptAPIKey().then((key: string) => {
            setMapsAPIKey(key)
        }).catch((error) => {
            setErrorState(error.message);
        });
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
    //TODO: google maps goes to default (wrong) center on selecting different location

    if (mapsAPIKey === '') {
        return (
            <>
                <h3>Welcome!</h3>
                <br/>
                Loading maps API key...
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
                    {renderPlace(currentPlace, location, setShowCreateNewMeasurement, showCreateNewMeasurement, selectedPlaceInfoFromDatabase, selectedPlaceInfoFromDatabaseErrors, placesServiceStatus, selectedPlaceExistsInDatabase)}
                    <br/>
                    <br/>
                    {showCreateNewMeasurement ? <CreateNewMeasurementModal showCreateNewMeasurement={showCreateNewMeasurement} setShowCreateNewMeasurement={setShowCreateNewMeasurement}/> : null}
                </div>
            </div>
        </>
    )
}