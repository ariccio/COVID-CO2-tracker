import * as Sentry from "@sentry/browser"; // for manual error reporting.

import {useEffect, useState, useRef, Suspense, Dispatch, SetStateAction} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {useLocation, useNavigate, useParams} from 'react-router-dom';
import Button from 'react-bootstrap/Button';

import { useTranslation } from 'react-i18next';

import {Container, Row, Col} from 'react-bootstrap';

import {selectSelectedPlace, defaultGooglePlacesState, selectPlacesServiceStatus, selectMapsAaPeEyeKey, selectMapsAaaPeeEyeKeyErrorState, setMapsAaaPeeEyeKey, setMapsAaaPeeEyeKeyErrorState} from '../google/googleSlice';
import {getGoogleMapsJavascriptAaaaPeeEyeKey} from '../../utils/GoogleAPIKeys';

import {GoogleMapsContainer} from '../google/GoogleMaps';

import {CreateNewMeasurementModal} from '../create/CreateMeasurement';

import {selectPlacesInfoFromDatabase, selectPlacesInfoErrors, SelectedPlaceDatabaseInfo, selectPlaceExistsInDatabase} from '../places/placesSlice';

import {NewMeasurementButton} from './NewMeasurementButton';
import { GOOGLE_FORMS_SURVEY_URL, YOUTUBE_VIDEO_INSTRUCTIONS_URL } from '../../utils/UrlPath';
import { RenderFromDatabaseNoGoogleParam } from '../places/RenderPlaceFromDatabase';
import { RenderSelectedPlaceInfo } from '../places/RenderPlaceInfo';
import { AppStatsContainer } from '../stats/Stats';
import { updatePlacesInfoFromBackend } from "../../utils/QueryPlacesInfo";
import { updatePlacesServiceDetailsOnNewPlace } from "../google/googlePlacesServiceUtils";
import { HighestMeasurementsContainer } from "../stats/HighestMeasurements";




const renderMapsWhenLoaded = (mapsAaaPeeEyeKey: string, service: google.maps.places.PlacesService | null, setService: Dispatch<SetStateAction<google.maps.places.PlacesService | null>>) => {
    if (mapsAaaPeeEyeKey !== '') {
        return (
            <div>
                <Suspense fallback="google maps container loading translations...">
                    <GoogleMapsContainer definitely_not_an_apeeeye_key={mapsAaaPeeEyeKey} service={service} setService={setService}/>
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
        console.log(`No place selected yet.`);
        // debugger;
        return null;
    }
    if (selectedPlaceInfoFromDatabase.measurements_by_sublocation === undefined) {
        //Seen in sentry, was undefined.
        console.warn(`"selectedPlaceInfoFromDatabase.measurements_by_sublocation" === undefined. No measurements to fetch. Rest of object: ${JSON.stringify(selectedPlaceInfoFromDatabase)}`);
        }
    return (
        <div>
            <Suspense fallback="loading translations...">
                <RenderFromDatabaseNoGoogleParam selectedPlaceInfoFromDatabase={selectedPlaceInfoFromDatabase} selectedPlaceInfoErrors={selectedPlaceInfoErrors} selectedPlaceExistsInDatabase={selectedPlaceExistsInDatabase} currentPlace={currentPlace}/>
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

interface RenderPlaceProps {
    currentPlace: google.maps.places.PlaceResult, 
    location: ReturnType<typeof useLocation>, 
    setShowCreateNewMeasurement: React.Dispatch<React.SetStateAction<boolean>>, 
    showCreateNewMeasurement: boolean,
    selectedPlaceInfoFromDatabase: SelectedPlaceDatabaseInfo,
    selectedPlaceInfoFromDatabaseErrors: string,
    placesServiceStatus: google.maps.places.PlacesServiceStatus | null,
    selectedPlaceExistsInDatabase: boolean | null,
    localitySelectedWarningString: string
}

const RenderPlace: React.FC<RenderPlaceProps> = (props: RenderPlaceProps) => {
    // debugger;
    return (
        <div>
            <RenderSelectedPlaceInfo currentPlace={props.currentPlace} placesServiceStatus={props.placesServiceStatus}/>
            {maybeWarningString(props.localitySelectedWarningString)}
            <Suspense fallback="loading translation">
                <NewMeasurementButton currentPlace_place_id={props.currentPlace.place_id} location={props.location} setShowCreateNewMeasurement={props.setShowCreateNewMeasurement} showCreateNewMeasurement={props.showCreateNewMeasurement} currentPlace_name={props.currentPlace.name}/>
                
            </Suspense>
            <br/>
            <br/>
            {renderInfoFromDatabase(props.selectedPlaceInfoFromDatabase, props.selectedPlaceInfoFromDatabaseErrors, props.currentPlace, props.selectedPlaceExistsInDatabase)}
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

export const useLoadMapsApiKey = () => {
    const mapsAaaPeeEyeKey = useSelector(selectMapsAaPeEyeKey);
    // const mapsAaPeeEyeKeyErrorState = useSelector(selectMapsAaaPeeEyeKeyErrorState);
    const dispatch = useDispatch();

    useEffect(() => {
        if (mapsAaaPeeEyeKey !== '') {
            return;
        }
        getGoogleMapsJavascriptAaaaPeeEyeKey().then((key: string) => {
            dispatch(setMapsAaaPeeEyeKey(key));
        }).catch((error) => {
            Sentry.captureException(error);
            dispatch(setMapsAaaPeeEyeKeyErrorState(error.message));
        });
    }, [dispatch, mapsAaaPeeEyeKey]);

    return 

}

const HomePage = () => {
    
    // TODO: when navigating BACK to home page from place, pan map to that place.
    const location = useLocation();
    const dispatch = useDispatch();
    const [translate] = useTranslation();

    
    const [localitySelectedWarningString, setLocalitySelectedWarningString] = useState('');

    //Transparently uses placeResultWithTranslatedType
    const currentPlace = useSelector(selectSelectedPlace);
    const selectedPlaceInfoFromDatabase = useSelector(selectPlacesInfoFromDatabase);

    const mapsAaaPeeEyeKey = useSelector(selectMapsAaPeEyeKey);
    const mapsAaPeeEyeKeyErrorState = useSelector(selectMapsAaaPeeEyeKeyErrorState);

    const [service, setService] = useState(null as google.maps.places.PlacesService | null);

    const infoRef = useRef<HTMLDivElement | null>(null);

    const navigate = useNavigate();
    const {placeId} = useParams();
    const mapsApiHook = useLoadMapsApiKey();

    // useEffect(() => {
    //     if (placeId === undefined) {
    //         return;
    //     }
    // [])
    // useEffect(() => {
    //     if (mapsAaaPeeEyeKey !== '') {
    //         return;
    //     }
    //     getGoogleMapsJavascriptAaaaPeeEyeKey().then((key: string) => {
    //         dispatch(setMapsAaaPeeEyeKey(key));
    //     }).catch((error) => {
    //         Sentry.captureException(error);
    //         dispatch(setMapsAaaPeeEyeKeyErrorState(error.message));
    //     });
    // }, [dispatch, mapsAaaPeeEyeKey]);

    useEffect(() => {
        if ((currentPlace.types) && (currentPlace.types[0] === 'locality')) {
            const translatedString = translate("locality-selected-warning");
            setLocalitySelectedWarningString(translatedString);
        }
        else {
            setLocalitySelectedWarningString('');
        }
    }, [currentPlace.types, translate]);

    useEffect(() => {
        console.log(`placeId: ${placeId}`);
        console.log(`mapsAaaPeeEyeKey: ${mapsAaaPeeEyeKey}`);
        if (placeId === undefined) {
            return;
        }
        if (placeId === '') {
            return;
        }
        // debugger;
        updatePlacesServiceDetailsOnNewPlace(service, dispatch, placeId);
        updatePlacesInfoFromBackend(placeId, dispatch);
        
    }, [dispatch, placeId, mapsAaaPeeEyeKey, service]);


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
            <h3 id='welcome-header'>{translate('welcome-header')}</h3>
            <br/>
            <Button href={YOUTUBE_VIDEO_INSTRUCTIONS_URL}>{translate('Instruction video')}</Button>&nbsp;
            <Button href={GOOGLE_FORMS_SURVEY_URL}>{translate('survey-button-text')}</Button>
            <br/><br/><br/>
            <Container>
                <Row className="show-grid">
                    <Col md={6} xs={12}>
                        {renderMapsWhenLoaded(mapsAaaPeeEyeKey, service, setService)}
                        <br/>
                        {mapsAaPeeEyeKeyErrorState}
                        <br/><br/>
                    </Col>
                    <PlaceContainer infoRef={infoRef} location={location} localitySelectedWarningString={localitySelectedWarningString}/>
                </Row>
                <Row className="show-grid">
                    <Col md={6} xs={12}>
                        <Row className="show-grid">
                            <HighestMeasurementsContainer/>
                        </Row>
                        <Row className="show-grid">
                            <AppStatsContainer/>
                        </Row>
                    </Col>
                </Row>
            </Container>
        </div>
    );
}

export const HomePageContainer = () => {
    return (
        <div>
            <Suspense fallback="home page translations loading...">
                <HomePage/>
            </Suspense>
        </div>
    );
}

interface PlaceContainerProps {
    infoRef: React.MutableRefObject<HTMLDivElement | null>;
    location: ReturnType<typeof useLocation>;
    // setShowCreateNewMeasurement: React.Dispatch<React.SetStateAction<boolean>>;
    // showCreateNewMeasurement: boolean;
    localitySelectedWarningString: string;
}

const PlaceContainer: React.FC<PlaceContainerProps> = (props: PlaceContainerProps) => {
    const [showCreateNewMeasurement, setShowCreateNewMeasurement] = useState(false);
    const currentPlace = useSelector(selectSelectedPlace);
    const selectedPlaceInfoFromDatabase = useSelector(selectPlacesInfoFromDatabase);
    const selectedPlaceInfoFromDatabaseErrors = useSelector(selectPlacesInfoErrors);
    const placesServiceStatus = useSelector(selectPlacesServiceStatus);
    const selectedPlaceExistsInDatabase = useSelector(selectPlaceExistsInDatabase);
    return <Col md={6} xs={12} ref={props.infoRef}>
        <div>
            <RenderPlace currentPlace={currentPlace} location={props.location} setShowCreateNewMeasurement={setShowCreateNewMeasurement} showCreateNewMeasurement={showCreateNewMeasurement} selectedPlaceInfoFromDatabase={selectedPlaceInfoFromDatabase} selectedPlaceInfoFromDatabaseErrors={selectedPlaceInfoFromDatabaseErrors} placesServiceStatus={placesServiceStatus} selectedPlaceExistsInDatabase={selectedPlaceExistsInDatabase} localitySelectedWarningString={props.localitySelectedWarningString}/>
            <br />
            <br />
            <Suspense fallback="Loading translations...">
                {showCreateNewMeasurement ? <CreateNewMeasurementModal showCreateNewMeasurement={showCreateNewMeasurement} setShowCreateNewMeasurement={setShowCreateNewMeasurement} selectedPlace={currentPlace} selectedPlaceExistsInDatabase={selectedPlaceExistsInDatabase} placesInfoFromDatabase={selectedPlaceInfoFromDatabase}/> : null}
            </Suspense>
        </div>
    </Col>;
}
