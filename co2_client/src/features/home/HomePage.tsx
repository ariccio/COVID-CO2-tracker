import React, {FunctionComponent, useEffect, useState, useRef, Suspense} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {useLocation} from 'react-router-dom';
import Button from 'react-bootstrap/Button';

import { useTranslation } from 'react-i18next';

import {Container, Row, Col} from 'react-bootstrap';

import {selectSelectedPlace, defaultGooglePlacesState, selectPlacesServiceStatus, selectMapsAPIKey, selectMapsAPIKeyErrorState, setMapsAPIKey, setMapsAPIKeyErrorState} from '../google/googleSlice';
import {getGoogleMapsJavascriptAPIKey} from '../../utils/GoogleAPIKeys';

import {GoogleMapsContainer} from '../google/GoogleMaps';

import {CreateNewMeasurementModal} from '../create/CreateMeasurement';

import {selectPlacesInfoFromDatabase, selectPlacesInfoErrors, SelectedPlaceDatabaseInfo, selectPlaceExistsInDatabase} from '../places/placesSlice';

import {renderNewMeasurementButton} from './NewMeasurementButton';
import { YOUTUBE_VIDEO_INSTRUCTIONS_URL } from '../../utils/UrlPath';
import { RenderFromDatabaseNoGoogleParam } from '../places/RenderPlaceFromDatabase';
import { renderSelectedPlaceInfo } from '../places/RenderPlaceInfo';




const renderMapsWhenLoaded = (mapsAPIKey: string) => {
    if (mapsAPIKey !== '') {
        return (
            <>
                <Suspense fallback="google maps container loading translations...">
                    <GoogleMapsContainer api_key={mapsAPIKey}/>
                </Suspense>
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


const renderInfoFromDatabase = (selectedPlaceInfoFromDatabase: SelectedPlaceDatabaseInfo, selectedPlaceInfoErrors: string, currentPlace: google.maps.places.PlaceResult, selectedPlaceExistsInDatabase: boolean | null) => {
    if (currentPlace === defaultGooglePlacesState.selected) {
        //No place selected yet.
        return null;
    }
    return (
        <>
            <Suspense fallback="loading translations...">
                <RenderFromDatabaseNoGoogleParam selectedPlaceInfoFromDatabase={selectedPlaceInfoFromDatabase} selectedPlaceInfoErrors={selectedPlaceInfoErrors} selectedPlaceExistsInDatabase={selectedPlaceExistsInDatabase} />
            </Suspense>
        </>
    )
}

const renderPlace = (currentPlace: google.maps.places.PlaceResult, location: ReturnType<typeof useLocation>, setShowCreateNewMeasurement: React.Dispatch<React.SetStateAction<boolean>>, showCreateNewMeasurement: boolean, selectedPlaceInfoFromDatabase: SelectedPlaceDatabaseInfo, selectedPlaceInfoErrors: string, placesServiceStatus: google.maps.places.PlacesServiceStatus | null, selectedPlaceExistsInDatabase: boolean | null) => {
    // debugger;
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

const HomePage: FunctionComponent<{}> = (props: any) => {
    // const [mapsAPIKey, setMapsAPIKey] = useState("");
    // const [errorState, setErrorState] = useState("");
    // TODO: when navigating BACK to home page from place, pan map to that place.
    const location = useLocation();
    const dispatch = useDispatch();
    const [translate] = useTranslation();

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
            <h3>{translate('welcome-header')}</h3>
            <br/>
            <Button href={YOUTUBE_VIDEO_INSTRUCTIONS_URL}>{translate('Instruction video')}</Button>
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

export const HomePageContainer = () => {
    return (
        <>
            <Suspense fallback="home page translations loading...">
                <HomePage/>
            </Suspense>
        </>
    )

}