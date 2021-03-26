import React, {useState, useEffect} from 'react';
import {useSelector, useDispatch} from 'react-redux';
import {Modal, Button, Form, Dropdown} from 'react-bootstrap';
// import {useLocation, useHistory} from 'react-router-dom'


import {selectSelectedDevice, selectSelectedDeviceSerialNumber, selectSelectedModelName, setSelectedDevice, setSelectedDeviceSerialNumber, setSelectedModel, setSelectedModelName} from '../deviceModels/deviceModelsSlice';
import {selectSelectedPlace} from '../google/googleSlice';
import { defaultDevicesInfo, queryUserDevices, UserDevicesInfo } from '../../utils/QueryUserInfo';
import { Errors, formatErrors } from '../../utils/ErrorObject';
import {selectPlaceExistsInDatabase} from '../places/placesSlice';
import {UserInfoDevice} from '../../utils/QueryDeviceInfo';


import {postRequestOptions} from '../../utils/DefaultRequestOptions';
import { fetchJSONWithChecks } from '../../utils/FetchHelpers';
import { API_URL } from '../../utils/UrlPath';
import { updatePlacesInfoFromBackend } from '../../utils/QueryPlacesInfo';
import { selectUsername } from '../login/loginSlice';

const ModalHeader = (props: {placeName: string}) =>
    <Modal.Header closeButton>
        <Modal.Title>Add a measurement for {props.placeName}</Modal.Title>
    </Modal.Header>

const ModalHeaderNotLoggedIn = () =>
    <Modal.Header closeButton>
        <Modal.Title>Not logged in. Please log in.</Modal.Title>
    </Modal.Header>


interface CreateNewMeasurementProps {
    showCreateNewMeasurement: boolean,
    setShowCreateNewMeasurement: React.Dispatch<React.SetStateAction<boolean>>
}

const devicesToDropdown = (userDevices: UserDevicesInfo) => {
    return userDevices.devices.map((value: UserInfoDevice, index: number) => {
        return (
            <Dropdown.Item eventKey={`${value.device_id}`} key={`${value.device_id}-${value.device_model_id}-${value.device_manufacturer_id}-eventKey-dropdown`}>
                {value.device_model} (#{value.serial})
            </Dropdown.Item>
        );
    })
}

function dropdownKeyToDeviceID(eventKey: string): number | null {
    if (eventKey === "-1") {
        return null;
    }
    return parseInt(eventKey);
}

const selectDeviceDropdownHandler = (eventKey: string | null, e: React.SyntheticEvent<unknown>, userDevices: UserDevicesInfo, dispatch: ReturnType<typeof useDispatch>) => {
    // debugger;
    console.assert(eventKey !== null);
    if (eventKey === null) {
        alert("TODO: I need to handle this. Event key null.");
        return;
    }
    if (eventKey === '-1') {
        console.warn("user selected create new device, need to implement");
        return;
    }
    const selected = dropdownKeyToDeviceID(eventKey);
    if (selected !== null) {
        const found = userDevices.devices.find((value: UserInfoDevice, index: number) => {
            if (value.device_id === selected) {
                return true;
            }
            return false;
        })
        if (found !== undefined) {
            dispatch(setSelectedDevice(found.device_id))
            dispatch(setSelectedDeviceSerialNumber(found.serial));
            dispatch(setSelectedModel(found.device_model_id));
            dispatch(setSelectedModelName(found.device_model));
            // dispatch(setSelected)
            return;
        }
        // alert("TODO: dispatch to the correct selected device and stuff");
        alert("missing device");
    }
}

const renderSelectDeviceDropdown = (userDevices: UserDevicesInfo, selectedDevice: number, selectedModelName: string, selectedDeviceSerialNumber: string, dispatch: ReturnType<typeof useDispatch>) => {

    return (
        <>
            <Dropdown onSelect={(eventKey: string | null, event: React.SyntheticEvent<unknown>) => selectDeviceDropdownHandler(eventKey, event, userDevices, dispatch)}>
                <Dropdown.Toggle variant="success" id="dropdown-basic">
                    {selectedDevice !== -1 ? `${selectedModelName} - ${selectedDeviceSerialNumber}` : "Select device:" }
                </Dropdown.Toggle>
                <Dropdown.Menu>
                    {devicesToDropdown(userDevices)}
                    <Dropdown.Item eventKey={"-1"}>
                        Create new device (notimpl)
                    </Dropdown.Item>
                </Dropdown.Menu>
            </Dropdown>
        </>

    );
}

const renderErrors = (errorState: string) => {
    if (errorState === '') {
        return null;
    }
    return (
        <div>
            Failed to query user devices: {errorState}
        </div>
    )
}

const hideHandler = (setShowCreateNewMeasurement: React.Dispatch<React.SetStateAction<boolean>>) => {
    setShowCreateNewMeasurement(false);
}

const onChangeCo2Event = (event: React.FormEvent<HTMLFormElement>, setEnteredCO2Text: React.Dispatch<React.SetStateAction<string>>) => {
    //TODO: this sucks.
    // event.target.value
    const text = (event.currentTarget.elements[0] as HTMLInputElement).value;
    setEnteredCO2Text(text);
}

const onChangeCrowdingEvent = (event: React.FormEvent<HTMLFormElement>, setEnteredCrowding: React.Dispatch<React.SetStateAction<string>>) => {
    //TODO: this sucks. 
    // debugger;
    const text = (event.currentTarget.elements[0] as HTMLInputElement).value;
    setEnteredCrowding(text);
}

const onChangeInnerLocationEvent = (event: React.FormEvent<HTMLFormElement>, setEnteredLocationDetails: React.Dispatch<React.SetStateAction<string>>) => {
    //TODO: this sucks. 
    const text = (event.currentTarget.elements[0] as HTMLInputElement).value;
    setEnteredLocationDetails(text);
}

const NEW_MEASUREMENT_URL = (API_URL + '/measurement');

function newMeasurementRequestInit(selectedDevice: number, enteredCO2: string, placeId: string, enteredCrowding: string, enteredLocationDetails: string): RequestInit {
    const defaultOptions = postRequestOptions();
    // debugger;
    const newOptions = {
        ...defaultOptions,
        body: JSON.stringify({
            measurement: {
                device_id: selectedDevice,
                co2ppm: enteredCO2,
                google_place_id: placeId,
                crowding: enteredCrowding,
                location_where_inside_info: enteredLocationDetails
                // measurementtime: new Date().toUTCString()
            }
        })
    };
    return newOptions;
}

interface NewMeasurmentResponseType {
    measurement_id: number,
    device_id: number,
    co2ppm: number,
    place_id: number,
    measurementtime: string,
    errors?: Errors

}

function newPlaceRequestInit(place_id: string): RequestInit {
    const defaultOptions = postRequestOptions();
    const newOptions = {
        ...defaultOptions,
        body: JSON.stringify({
            place: {
                google_place_id: place_id
            }
        })
    };
    return newOptions;
}

interface PlaceCreateResponseType {
    place_id: number,
    errors?: Errors
}

const CREATE_PATH = (API_URL + `/places`);


const createPlaceIfNotExist = (placeExistsInDatabase: boolean, place_id: string): Promise<PlaceCreateResponseType> | null => {
    if (placeExistsInDatabase) {
        // debugger;
        console.log("place exists, not creating...");
        return null;
    }
    // debugger;
    // const thisPlace = (CREATE_PATH + `/${place_id}`);
    const init = newPlaceRequestInit(place_id);
    const fetchFailedCallback = async (awaitedResponse: Response): Promise<PlaceCreateResponseType> => {
        console.error("Failed to create place!");
        return awaitedResponse.json();
    }
    const fetchSuccessCallback = async (awaitedResponse: Response): Promise<PlaceCreateResponseType> => {
        console.log("TODO: strong type");
        return awaitedResponse.json();
    }

    const result = fetchJSONWithChecks(CREATE_PATH, init, 201, true, fetchFailedCallback, fetchSuccessCallback ) as Promise<PlaceCreateResponseType>;
    return result;
}

const createMeasurementHandler = (selectedDevice: number, enteredCO2Text: string, place_id: string, setShowCreateNewMeasurement: React.Dispatch<React.SetStateAction<boolean>>, enteredCrowding: string, enteredLocationDetails: string) => {
    // debugger;
    const init = newMeasurementRequestInit(selectedDevice, enteredCO2Text, place_id, enteredCrowding, enteredLocationDetails);
    
    const fetchFailedCallback = async (awaitedResponse: Response): Promise<NewMeasurmentResponseType> => {
        console.error("failed to create measurement!");
        return awaitedResponse.json();
    }
    const fetchSuccessCallback = async (awaitedResponse: Response): Promise<NewMeasurmentResponseType> => {
        console.log("fetch to create measurement succeeded!");
        return awaitedResponse.json();
    }

    const result = fetchJSONWithChecks(NEW_MEASUREMENT_URL, init, 201, true, fetchFailedCallback, fetchSuccessCallback) as Promise<NewMeasurmentResponseType>;
    result.then((result) => {
        if (result.errors === undefined) {
            setShowCreateNewMeasurement(false);
            // debugger;
            console.log("new measurement successfully created. We currently throw the result away.");
            console.log("to use it, please remove this message.");
            console.log("here it is anyways:");
            console.log(result);
        }
        else {
            console.log("TODO: set form invalid.")
            debugger;
        }
    })
}

const submitHandler = (event: React.MouseEvent<HTMLElement, MouseEvent>, selectedDevice: number, enteredCO2Text: string, place_id: string, setShowCreateNewMeasurement: React.Dispatch<React.SetStateAction<boolean>>, placeExistsInDatabase: boolean, dispatch: ReturnType<typeof useDispatch>, setErrorState: React.Dispatch<React.SetStateAction<string>>, enteredCrowding: string, enteredLocationDetails: string) => {
    // debugger;

    const placeExistsPromiseOrNull = createPlaceIfNotExist(placeExistsInDatabase, place_id);
    if (placeExistsPromiseOrNull === null) {
        // debugger;
        createMeasurementHandler(selectedDevice, enteredCO2Text, place_id, setShowCreateNewMeasurement, enteredCrowding, enteredLocationDetails);
        updatePlacesInfoFromBackend(place_id, dispatch);
        return;
    }
    placeExistsPromiseOrNull.then((existsPromise) => {
        // debugger;
        createMeasurementHandler(selectedDevice, enteredCO2Text, place_id, setShowCreateNewMeasurement, enteredCrowding, enteredLocationDetails);
        updatePlacesInfoFromBackend(place_id, dispatch);
    }).catch((errors) => {
        //TODO: set errors state?
        // alert(errors.message);
        setErrorState(errors.message);
    });

}

function ignoreDefault(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    event.stopPropagation();
}

const renderFormIfReady = (selectedDevice: number, enteredCO2Text: string, setEnteredCO2Text: React.Dispatch<React.SetStateAction<string>>, place_id: string, setShowCreateNewMeasurement: React.Dispatch<React.SetStateAction<boolean>>, setEnteredCrowding: React.Dispatch<React.SetStateAction<string>>, placeName: string, setEnteredLocationDetails: React.Dispatch<React.SetStateAction<string>>) => {
    if (selectedDevice === -1) {
        return null;
    }
    return (
        <>
            <Form onChange={(event) => onChangeCo2Event(event, setEnteredCO2Text)} onSubmit={ignoreDefault}>
                <Form.Label>
                    CO2 level (ppm)
                </Form.Label>
                <Form.Control type="number" placeholder="400" min={0} max={80000} name={"co2ppm"}/>
            </Form>
            <Form onChange={(event) => onChangeCrowdingEvent(event, setEnteredCrowding)} onSubmit={ignoreDefault}>
                <Form.Label>
                    Crowding 1-5 (1 is empty, 5 full)
                </Form.Label>
                <Form.Control type="number" min={1} max={5} name={"crowding"}/>
            </Form>
            <Form onChange={(event) => onChangeInnerLocationEvent(event, setEnteredLocationDetails)} onSubmit={ignoreDefault}>
                <Form.Label>
                    Where inside {placeName} did you take the measurement?
                </Form.Label>
                <Form.Control type="text" name={"where"}/>
            </Form>
        </>
    )
}

export const CreateNewMeasurementModal: React.FC<CreateNewMeasurementProps> = (props: CreateNewMeasurementProps) => {
    const selectedPlace = useSelector(selectSelectedPlace);
    // const selectedModel = useSelector(selectSelectedModel);
    const selectedModelName = useSelector(selectSelectedModelName);
    const selectedDevice = useSelector(selectSelectedDevice);
    const selectedDeviceSerialNumber = useSelector(selectSelectedDeviceSerialNumber);
    const placeExistsInDatabase = useSelector(selectPlaceExistsInDatabase);
    const username = useSelector(selectUsername);
    
    // const selectedPlacesInfo = useSelector(selectPlacesInfoFromDatabase);
    // const selectedPlacesInfoErrors = useSelector(selectPlacesInfoErrors);

    const [userDevices, setUserDevices] = useState(defaultDevicesInfo);
    const [errorState, setErrorState] = useState('');

    const [enteredCO2Text, setEnteredCO2Text] = useState('');
    const [enteredCrowding, setEnteredCrowding] = useState('');
    const [enteredLocationDetails, setEnteredLocationDetails] = useState('');

    const placeName = selectedPlace.name;    
    const place_id = selectedPlace.place_id
    const dispatch = useDispatch();
    useEffect(() => {
        if (username === '') {
            setErrorState("Not logged in, must be logged in to create measurements!");
            return;
        }
        const userDeviceInfoPromise: Promise<UserDevicesInfo> = queryUserDevices();
        userDeviceInfoPromise.then((userDeviceInfo) => {
            if (userDeviceInfo.errors !== undefined) {
                setErrorState(formatErrors(userDeviceInfo.errors));
            }
            console.log(userDeviceInfo);
            setUserDevices(userDeviceInfo);
        }).catch((error) => {
            setErrorState(error.message);
        })
    }, [username])

    console.assert(place_id !== null);
    console.assert(place_id !== undefined);
    if (place_id === undefined) {
        debugger;
        return (null);
    }
    console.assert(placeName !== undefined);
    if (placeName === undefined) {
        debugger;
        return null;
    }
    console.assert(placeExistsInDatabase !== null);
    if (placeExistsInDatabase === null) {
        debugger;
        return null;
    }
    if (username === '') {
        console.log("not logged in to create measurement, rendering error modal.");
        return (
            <Modal onHide={() => hideHandler(props.setShowCreateNewMeasurement)} show={props.showCreateNewMeasurement}>
                <ModalHeaderNotLoggedIn/>
                <Modal.Body>
                    Not logged in.
                </Modal.Body>
            </Modal>
        );
    }
    return (
        <>
            <Modal show={props.showCreateNewMeasurement} onHide={() => hideHandler(props.setShowCreateNewMeasurement)}>
                <ModalHeader placeName={placeName}/>
                <Modal.Body>
                    {renderErrors(errorState)}
                    {renderSelectDeviceDropdown(userDevices, selectedDevice, selectedModelName, selectedDeviceSerialNumber, dispatch)}
                    {renderFormIfReady(selectedDevice, enteredCO2Text, setEnteredCO2Text, place_id, props.setShowCreateNewMeasurement, setEnteredCrowding, placeName, setEnteredLocationDetails)}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={(event) => hideHandler(props.setShowCreateNewMeasurement)}>
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={(event) => submitHandler(event, selectedDevice, enteredCO2Text, place_id, props.setShowCreateNewMeasurement, placeExistsInDatabase, dispatch, setErrorState, enteredCrowding, enteredLocationDetails)}>
                        Submit new measurement
                    </Button>
                </Modal.Footer>

            </Modal>

        </>
    )
}