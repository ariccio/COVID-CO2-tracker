import React, {FunctionComponent, useEffect, useState, useRef} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {useLocation, Link} from 'react-router-dom';
import Button from 'react-bootstrap/Button';

import {Container, Row, Col} from 'react-bootstrap';

import {selectSelectedPlace, defaultGooglePlacesState, selectPlacesServiceStatus, selectMapsAPIKey, selectMapsAPIKeyErrorState, setMapsAPIKey, setMapsAPIKeyErrorState} from '../google/googleSlice';
import {getGoogleMapsJavascriptAPIKey} from '../../utils/GoogleAPIKeys';

import {GoogleMapsContainer} from '../google/GoogleMaps';

import {CreateNewMeasurementModal} from '../create/CreateMeasurement';

import {selectPlacesInfoFromDatabase, selectPlacesInfoErrors, SelectedPlaceDatabaseInfo, defaultPlaceInfo, selectPlaceExistsInDatabase} from '../places/placesSlice';

import {placesPath} from '../../paths/paths';

import {renderNewMeasurementButton} from './NewMeasurementButton';
import { MeasurementsByDropdown } from '../measurements/MeasurementsByDropdown';
import { YOUTUBE_VIDEO_INSTRUCTIONS_URL } from '../../utils/UrlPath';

const renderLinkToPlacesWithName = (place_id?: string, name?: string) => {
    if (place_id === undefined) {
        return (
            <>
                Missing place_id!
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
            {/* <a href={url}>
                <b>{name}</b>
            </a> */}
            <Link to={`${placesPath}/${place_id}`}>
                <b>See detailed info for {name}</b>
            </Link>
            <br/>
        </>
    );
}


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
                <b>{name} in Google Maps</b>
            </a>
            <br/>
        </>
    );
}

// const renderPlaceId = (place_id?: string) => {
//     if (place_id === undefined) {
//         return (
//             <>
//                 Missing place ID!
//                 <br/>
//             </>
//         );
//     }
//     return (
//         <>
//             current selected place_id: <i>{place_id}</i>
//             <br/>
//         </>
//     );
// }

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
            <>
                Google Places service status: {placesServiceStatus}
                <br/>
            </>
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

export const renderSelectedPlaceInfo = (currentPlace: google.maps.places.PlaceResult, placesServiceStatus: google.maps.places.PlacesServiceStatus | null) => {
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
            {renderLinkToPlacesWithName(currentPlace.place_id, currentPlace.name)}
            {/* {renderPlaceId(currentPlace.place_id)} */}
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

// const mapsDivStyle: CSSProperties = {
//     display: "flex",
//     alignItems: "left",
//     justifyContent: "left"
// }



// TODO: exporting from here is REALLY sloppy. Fix later.
export const renderFromDatabaseNoGoogleParam = (selectedPlaceInfoFromDatabase: SelectedPlaceDatabaseInfo, selectedPlaceInfoErrors: string, selectedPlaceExistsInDatabase: boolean | null) => {
    if (selectedPlaceInfoErrors !== '') {
        return (
            <>
                <div>
                    Failed to fetch measurement info from the database! {selectedPlaceInfoErrors}
                </div>
            </>
        )
    }
    if (selectedPlaceInfoFromDatabase === defaultPlaceInfo) {
        // console.assert(selectedPlaceInfoFromDatabase.measurements === null);
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
    if (selectedPlaceInfoFromDatabase.measurements_by_sublocation === undefined) {
        console.assert(selectedPlaceInfoFromDatabase === defaultPlaceInfo);
        console.error("invalid state, maybe internal server error.");
        debugger;
        if ((selectedPlaceInfoFromDatabase as any).error !== undefined) {
            return (
                <>
                    {(selectedPlaceInfoFromDatabase as any).error}
                </>
            )
        }
        return null;
    }
    //TODO: need strong type in updatePlacesInfoFromBackend, else this can be undefined!
    if (selectedPlaceInfoFromDatabase.measurements_by_sublocation.length === 0) {
        // debugger;
        return (
            <div>
                Zero measurements recorded for this place.
            </div>
        )
    }
    // debugger;
    return (
        <>
            <MeasurementsByDropdown selectedPlaceInfoFromDatabase={selectedPlaceInfoFromDatabase}/>
            
        </>
    )

}


const renderInfoFromDatabase = (selectedPlaceInfoFromDatabase: SelectedPlaceDatabaseInfo, selectedPlaceInfoErrors: string, currentPlace: google.maps.places.PlaceResult, selectedPlaceExistsInDatabase: boolean | null) => {
    if (currentPlace === defaultGooglePlacesState.selected) {
        //No place selected yet.
        return null;
    }
    return renderFromDatabaseNoGoogleParam(selectedPlaceInfoFromDatabase, selectedPlaceInfoErrors, selectedPlaceExistsInDatabase);
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

function renderError(mapsAPIKeyErrorState: string) {
    return (
        <>
            Error loading maps API key!
            <br />
            {mapsAPIKeyErrorState}
        </>
    );
}

function renderWelcomeLoading() {
    return (
        <>
            <h3>Welcome to the COVID CO2 Tracker!</h3>
            <br />
            Loading maps API key...
        </>
    );
}

export const HomePage: FunctionComponent<{}> = (props: any) => {
    // const [mapsAPIKey, setMapsAPIKey] = useState("");
    // const [errorState, setErrorState] = useState("");
    // TODO: when navigating BACK to home page from place, pan map to that place.
    const location = useLocation();
    const dispatch = useDispatch();

    const [showCreateNewMeasurement, setShowCreateNewMeasurement] = useState(false);

    //Transparently uses placeResultWithTranslatedType
    const currentPlace = useSelector(selectSelectedPlace);
    const selectedPlaceInfoFromDatabase = useSelector(selectPlacesInfoFromDatabase);
    const selectedPlaceInfoFromDatabaseErrors = useSelector(selectPlacesInfoErrors);
    const selectedPlaceExistsInDatabase = useSelector(selectPlaceExistsInDatabase);
    const placesServiceStatus = useSelector(selectPlacesServiceStatus);
    const mapsAPIKey = useSelector(selectMapsAPIKey);
    const mapsAPIKeyErrorState = useSelector(selectMapsAPIKeyErrorState);

    const infoRef = useRef<HTMLDivElement | null>(null);
    useEffect(() => {
        if (mapsAPIKey !== '') {
            return;
        }
        getGoogleMapsJavascriptAPIKey().then((key: string) => {
            dispatch(setMapsAPIKey(key));
        }).catch((error) => {
            dispatch(setMapsAPIKeyErrorState(error.message));
        });
    }, [dispatch, mapsAPIKey]);

    useEffect(() => {
        if (infoRef && infoRef.current) {
            infoRef.current.scrollIntoView({behavior: "smooth"});
        }
    }, [selectedPlaceInfoFromDatabase])
  
    if (mapsAPIKeyErrorState !== '') {
        return renderError(mapsAPIKeyErrorState);
    }
    //TODO: google maps goes to default (wrong) center on selecting different location

    if (mapsAPIKey === '') {
        return renderWelcomeLoading();     
    }

    return (
        <>
            <h3>Welcome to the COVID CO2 Tracker!</h3>
            <br/>
            <Button href={YOUTUBE_VIDEO_INSTRUCTIONS_URL}>Instruction video</Button>
            <br/>
            <br/>
            <br/>
            <Container>
                <Row className="show-grid">
                    <Col md={6} xs={12}>
                        {renderMapsWhenLoaded(mapsAPIKey)}
                        <br/>
                        {mapsAPIKeyErrorState}
                        <br/>
                        <br/>
                    </Col>
                    <Col md={6} xs={12} ref={infoRef}>
                        <div>
                            {renderPlace(currentPlace, location, setShowCreateNewMeasurement, showCreateNewMeasurement, selectedPlaceInfoFromDatabase, selectedPlaceInfoFromDatabaseErrors, placesServiceStatus, selectedPlaceExistsInDatabase)}
                            <br/>
                            <br/>
                            {showCreateNewMeasurement ? <CreateNewMeasurementModal showCreateNewMeasurement={showCreateNewMeasurement} setShowCreateNewMeasurement={setShowCreateNewMeasurement}/> : null}
                        </div>
                    </Col>

                </Row>

            </Container>
        </>
    )
}

