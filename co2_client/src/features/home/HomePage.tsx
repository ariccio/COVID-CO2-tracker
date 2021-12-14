import React, {FunctionComponent, useEffect, useState, useRef, Suspense} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {useLocation} from 'react-router-dom';
import Button from 'react-bootstrap/Button';

import { useTranslation } from 'react-i18next';

import {Container, Row, Col} from 'react-bootstrap';

import {selectSelectedPlace, defaultGooglePlacesState, selectPlacesServiceStatus, selectMapsAaPeEyeKey, selectMapsAaaPeeEyeKeyErrorState, setMapsAaaPeeEyeKey, setMapsAaaPeeEyeKeyErrorState} from '../google/googleSlice';
import {getGoogleMapsJavascriptAaaaPeeEyeKey} from '../../utils/GoogleAPIKeys';

import {GoogleMapsContainer} from '../google/GoogleMaps';

import {CreateNewMeasurementModal} from '../create/CreateMeasurement';

import {selectPlacesInfoFromDatabase, selectPlacesInfoErrors, SelectedPlaceDatabaseInfo, selectPlaceExistsInDatabase} from '../places/placesSlice';

import {NewMeasurementButton} from './NewMeasurementButton';
import { YOUTUBE_VIDEO_INSTRUCTIONS_URL } from '../../utils/UrlPath';
import { RenderFromDatabaseNoGoogleParam } from '../places/RenderPlaceFromDatabase';
import { RenderSelectedPlaceInfo } from '../places/RenderPlaceInfo';
import { AppStatsContainer } from '../stats/Stats';




const renderMapsWhenLoaded = (mapsAaaPeeEyeKey: string) => {
    if (mapsAaaPeeEyeKey !== '') {
        return (
            <div>
                <Suspense fallback="google maps container loading translations...">
                    <GoogleMapsContainer definitely_not_an_apeeeye_key={mapsAaaPeeEyeKey}/>
                </Suspense>
            </div>
        )
    }
    return (
        <div>
            <span>
                Loading google maps key...
            </span>
        </div>
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
    if (selectedPlaceInfoFromDatabase.measurements_by_sublocation === undefined) {
            //Seen in sentry, was undefined.
            console.warn(`"selectedPlaceInfoFromDatabase.measurements_by_sublocation" === undefined. No measurements to fetch. Rest of object: ${JSON.stringify(selectedPlaceInfoFromDatabase)}`);
        }
    return (
        <div>
            <Suspense fallback="loading translations...">
                <RenderFromDatabaseNoGoogleParam selectedPlaceInfoFromDatabase={selectedPlaceInfoFromDatabase} selectedPlaceInfoErrors={selectedPlaceInfoErrors} selectedPlaceExistsInDatabase={selectedPlaceExistsInDatabase} />
            </Suspense>
        </div>
    )
}

const maybeWarningString = (localitySelectedWarningString: string) => {
    if (localitySelectedWarningString === '') {
        return (<div></div>);
    }
    return (
        <div>
            <br/>
            <br/>
            <b>
                <i>
                    <u>
                        {localitySelectedWarningString}
                    </u>
                </i>
            </b>
            <br/>
            <br/>
            <br/>
            <br/>
        </div>
    );
}

const renderPlace = (currentPlace: google.maps.places.PlaceResult, location: ReturnType<typeof useLocation>, setShowCreateNewMeasurement: React.Dispatch<React.SetStateAction<boolean>>, showCreateNewMeasurement: boolean, selectedPlaceInfoFromDatabase: SelectedPlaceDatabaseInfo, selectedPlaceInfoErrors: string, placesServiceStatus: google.maps.places.PlacesServiceStatus | null, selectedPlaceExistsInDatabase: boolean | null, localitySelectedWarningString: string) => {
    // debugger;
    return (
        <div>
            <RenderSelectedPlaceInfo currentPlace={currentPlace} placesServiceStatus={placesServiceStatus}/>
            {maybeWarningString(localitySelectedWarningString)}
            <Suspense fallback="loading translation">
                <NewMeasurementButton currentPlace={currentPlace} location={location} setShowCreateNewMeasurement={setShowCreateNewMeasurement} showCreateNewMeasurement={showCreateNewMeasurement} />
            </Suspense>
            <br/>
            <br/>
            {renderInfoFromDatabase(selectedPlaceInfoFromDatabase, selectedPlaceInfoErrors, currentPlace, selectedPlaceExistsInDatabase)}
            <br/>
        </div>
    );
}

function renderError(mapsAaPeeEyeKeyErrorState: string) {
    return (
        <div>
            <span>
                Error loading maps key!
            </span>
            <br />
            <span>
                {mapsAaPeeEyeKeyErrorState}
            </span>
        </div>
    );
}

function renderWelcomeLoading() {
    return (
        <div>
            <h3>Welcome to the COVID CO2 Tracker!</h3>
            <br />
            Loading maps key...
        </div>
    );
}

const HomePage: FunctionComponent<{}> = (props: any) => {
    // TODO: when navigating BACK to home page from place, pan map to that place.
    const location = useLocation();
    const dispatch = useDispatch();
    const [translate] = useTranslation();

    const [showCreateNewMeasurement, setShowCreateNewMeasurement] = useState(false);
    const [localitySelectedWarningString, setLocalitySelectedWarningString] = useState('');

    //Transparently uses placeResultWithTranslatedType
    const currentPlace = useSelector(selectSelectedPlace);
    const selectedPlaceInfoFromDatabase = useSelector(selectPlacesInfoFromDatabase);
    const selectedPlaceInfoFromDatabaseErrors = useSelector(selectPlacesInfoErrors);
    const selectedPlaceExistsInDatabase = useSelector(selectPlaceExistsInDatabase);
    const placesServiceStatus = useSelector(selectPlacesServiceStatus);
    const mapsAaaPeeEyeKey = useSelector(selectMapsAaPeEyeKey);
    const mapsAaPeeEyeKeyErrorState = useSelector(selectMapsAaaPeeEyeKeyErrorState);

    const infoRef = useRef<HTMLDivElement | null>(null);
    useEffect(() => {
        if (mapsAaaPeeEyeKey !== '') {
            return;
        }
        getGoogleMapsJavascriptAaaaPeeEyeKey().then((key: string) => {
            dispatch(setMapsAaaPeeEyeKey(key));
        }).catch((error) => {
            dispatch(setMapsAaaPeeEyeKeyErrorState(error.message));
        });
    }, [dispatch, mapsAaaPeeEyeKey]);

    useEffect(() => {
        if ((currentPlace.types) && (currentPlace.types[0] === 'locality')) {
            setLocalitySelectedWarningString(translate("locality-selected-warning"))
        }
        else {
            setLocalitySelectedWarningString('');
        }
    }, [currentPlace.types, translate]);

    useEffect(() => {
        if (infoRef && infoRef.current) {
            infoRef.current.scrollIntoView({behavior: "smooth"});
        }
    }, [selectedPlaceInfoFromDatabase])
  
    if (mapsAaPeeEyeKeyErrorState !== '') {
        return renderError(mapsAaPeeEyeKeyErrorState);
    }
    //TODO: google maps goes to default (wrong) center on selecting different location

    if (mapsAaaPeeEyeKey === '') {
        return renderWelcomeLoading();     
    }

    return (
        <div>
            <h3>{translate('welcome-header')}</h3>
            <br/>
            <Button href={YOUTUBE_VIDEO_INSTRUCTIONS_URL}>{translate('Instruction video')}</Button>
            <br/>
            <br/>
            <br/>
            <Container>
                <Row className="show-grid">
                    <Col md={6} xs={12}>
                        {renderMapsWhenLoaded(mapsAaaPeeEyeKey)}
                        <br/>
                        {mapsAaPeeEyeKeyErrorState}
                        <br/>
                        <br/>
                    </Col>
                    <Col md={6} xs={12} ref={infoRef}>
                        <div>
                            {renderPlace(currentPlace, location, setShowCreateNewMeasurement, showCreateNewMeasurement, selectedPlaceInfoFromDatabase, selectedPlaceInfoFromDatabaseErrors, placesServiceStatus, selectedPlaceExistsInDatabase, localitySelectedWarningString)}
                            <br/>
                            <br/>
                            <Suspense fallback="Loading translations...">
                                {showCreateNewMeasurement ? <CreateNewMeasurementModal showCreateNewMeasurement={showCreateNewMeasurement} setShowCreateNewMeasurement={setShowCreateNewMeasurement}/> : null}
                            </Suspense>
                        </div>
                    </Col>
                </Row>
                <Row className="show-grid">
                    <Col md={6} xs={12}>
                            <AppStatsContainer/>
                    </Col>
                </Row>

            </Container>
        </div>
    )
}

export const HomePageContainer = () => {
    return (
        <div>
            <Suspense fallback="home page translations loading...">
                <HomePage/>
            </Suspense>
        </div>
    )

}