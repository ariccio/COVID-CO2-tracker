import React, {useState, useEffect} from 'react';
import {useSelector, useDispatch} from 'react-redux';
import {Modal, Button, Form, Dropdown, ToggleButtonGroup, ToggleButton} from 'react-bootstrap';
import DatePicker from 'react-datepicker';
// import {useLocation, useHistory} from 'react-router-dom'

import "react-datepicker/dist/react-datepicker.css";


import {selectSelectedDevice, selectSelectedDeviceSerialNumber, selectSelectedModelName, setSelectedDevice, setSelectedDeviceSerialNumber, setSelectedModel, setSelectedModelName} from '../deviceModels/deviceModelsSlice';
import {selectSelectedPlace} from '../google/googleSlice';
import { defaultDevicesInfo, queryUserDevices, UserDevicesInfo } from '../../utils/QueryUserInfo';
import { Errors, formatErrors } from '../../utils/ErrorObject';
import {defaultPlaceInfo, SelectedPlaceDatabaseInfo, selectPlaceExistsInDatabase, selectPlacesInfoFromDatabase, SublocationMeasurements} from '../places/placesSlice';
import {UserInfoDevice} from '../../utils/QueryDeviceInfo';


import {postRequestOptions} from '../../utils/DefaultRequestOptions';
import { fetchJSONWithChecks } from '../../utils/FetchHelpers';
import { API_URL } from '../../utils/UrlPath';
import { updatePlacesInfoFromBackend } from '../../utils/QueryPlacesInfo';
import { selectUsername } from '../login/loginSlice';
import { SublocationsDropdown } from '../sublocationsDropdown/SublocationsDropdown';
import { selectSublocationSelectedLocationID, setSublocationSelectedLocationID } from '../sublocationsDropdown/sublocationSlice';
import { Link } from 'react-router-dom';
import { devicesPath } from '../../paths/paths';

enum ToggleButtonUserRadios {
    Now = 1,
    Custom
}

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
        // console.warn("user selected create new device, need to implement");
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
    if (userDevices.devices === undefined) {
        throw new Error(`userDevices.devices is undefined, this is a bug in CreateMeasurement.tsx! Selected device: ${selectedDevice}, selectedModelName: ${selectedModelName}, selectedDeviceSerialNumber: ${selectedDeviceSerialNumber}`);
    }
    return (
        <>
            <Dropdown onSelect={(eventKey: string | null, event: React.SyntheticEvent<unknown>) => selectDeviceDropdownHandler(eventKey, event, userDevices, dispatch)}>
                <Dropdown.Toggle variant="success" id="dropdown-basic">
                    {selectedDevice !== -1 ? `${selectedModelName} - ${selectedDeviceSerialNumber}` : "Select device:" }
                </Dropdown.Toggle>
                <Dropdown.Menu>
                    {devicesToDropdown(userDevices)}
                    <Dropdown.Item eventKey={"-1"} as={Link} to={devicesPath}>
                        + Create new device
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

const dateTimeIfCustom = (userTimeRadioValue: ToggleButtonUserRadios, dateTime: Date) => {
    if (userTimeRadioValue === ToggleButtonUserRadios.Now) {
        return undefined;
    }
    return {
        measurementtime: dateTime
    }
}

function newMeasurementRequestInit(selectedDevice: number, enteredCO2: string, placeId: string, enteredCrowding: string, enteredLocationDetails: string, selectedSubLocation: number, userTimeRadioValue: ToggleButtonUserRadios, dateTime: Date): RequestInit {
    if (selectedSubLocation === -1) {
        console.assert(enteredLocationDetails !== '');
        if (enteredLocationDetails === '') {
            throw new Error("invariant, bug");
        }
    }
    if (enteredLocationDetails === '') {
        console.assert(selectedSubLocation !== -1);
        if (selectedSubLocation === -1) {
            throw new Error("invariant, bug");
        }
    }
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
                location_where_inside_info: enteredLocationDetails,
                sub_location_id: selectedSubLocation,
                // measurementtime: new Date().toUTCString()
                ...dateTimeIfCustom(userTimeRadioValue, dateTime)
            }
        })
    };
    // debugger;
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

const createMeasurementHandler = (selectedDevice: number, enteredCO2Text: string, place_id: string, setShowCreateNewMeasurement: React.Dispatch<React.SetStateAction<boolean>>, enteredCrowding: string, enteredLocationDetails: string, selectedSubLocation: number, userTimeRadioValue: ToggleButtonUserRadios, dateTime: Date) => {
    // debugger;
    const init = newMeasurementRequestInit(selectedDevice, enteredCO2Text, place_id, enteredCrowding, enteredLocationDetails, selectedSubLocation, userTimeRadioValue, dateTime);
    
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

const submitHandler = (event: React.MouseEvent<HTMLElement, MouseEvent>, selectedDevice: number, enteredCO2Text: string, place_id: string, setShowCreateNewMeasurement: React.Dispatch<React.SetStateAction<boolean>>, placeExistsInDatabase: boolean, dispatch: ReturnType<typeof useDispatch>, setErrorState: React.Dispatch<React.SetStateAction<string>>, enteredCrowding: string, enteredLocationDetails: string, selectedSubLocation: number, userTimeRadioValue: ToggleButtonUserRadios, dateTime: Date) => {
    // debugger;
    //TODO: Disable button on click while waiting for response

    const placeExistsPromiseOrNull = createPlaceIfNotExist(placeExistsInDatabase, place_id);
    if (placeExistsPromiseOrNull === null) {
        // debugger;
        createMeasurementHandler(selectedDevice, enteredCO2Text, place_id, setShowCreateNewMeasurement, enteredCrowding, enteredLocationDetails, selectedSubLocation, userTimeRadioValue, dateTime);
        updatePlacesInfoFromBackend(place_id, dispatch);
        return;
    }
    placeExistsPromiseOrNull.then((existsPromise) => {
        // debugger;
        createMeasurementHandler(selectedDevice, enteredCO2Text, place_id, setShowCreateNewMeasurement, enteredCrowding, enteredLocationDetails, selectedSubLocation, userTimeRadioValue, dateTime);
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

const renderInnerLocationFormIfNewLocation = (setEnteredLocationDetails: React.Dispatch<React.SetStateAction<string>>, placeName: string, selected: SublocationMeasurements | null) => {
    if (selected === null) {
        return (
            <>
                <Form onChange={(event) => onChangeInnerLocationEvent(event, setEnteredLocationDetails)} onSubmit={ignoreDefault}>
                    <Form.Label>
                        Where inside {placeName} did you take the measurement?
                    </Form.Label>
                    <Form.Control type="text" name={"where"}/>
                </Form>
            </>
        )
    }
    return null;
}

function measurementsOrEmpty(placesInfoFromDatabase: SelectedPlaceDatabaseInfo): Array<SublocationMeasurements> {
    if (placesInfoFromDatabase === defaultPlaceInfo) {
        return Array<SublocationMeasurements>();
    }
    return placesInfoFromDatabase.measurements_by_sublocation;
}

const maybeMeasurementNote = (enteredCO2Text: string) => {
    const parsed = parseInt(enteredCO2Text);
    if (isNaN(parsed)) {
        if (enteredCO2Text.length !== 0) {
            console.warn(`Unable to parse entered CO2 text ('${enteredCO2Text}') into number`);
        }
    }
    if (parsed < 400) {
        return (
            <>
                That's a low measurement. Confirm that your meter reads near 400ppm when you're outside and away from sources of CO2.
                <br/>
                <br/>
            </>
        )
    }
    if (parsed > 2000) {
        return (
            <>
                That's a very high measurement! Confirm that your meter reads near 400ppm when you're outside and away from sources of CO2.
                <br/>
                <br/>
            </>
        )
    };
    return null;
}

function datePickerChangeHandler(setDateTime: React.Dispatch<React.SetStateAction<Date>>, setDatePickerError: React.Dispatch<React.SetStateAction<string | null>>, date: Date | [Date, Date] | /* for selectsRange */ null,
    _event: React.SyntheticEvent<any> | undefined): void {
        if(date === null) {
            return;
        }
        if(Array.isArray(date)) {
            console.error(`date (${date.toString()}) is an array type. This is a bug.`);
            debugger;
            setDatePickerError(`date (${date.toString()}) is an array type. This is a bug. Please report it.`);
            return;
        }
        // console.log(typeof [Date, Date])
        setDateTime(date);
    }

const maybeRenderTimeInput = (userTimeRadioValue: ToggleButtonUserRadios, dateTime: Date, setDateTime: React.Dispatch<React.SetStateAction<Date>>, datePickerError: string | null, setDatePickerError: React.Dispatch<React.SetStateAction<string | null>>) => {
    if (userTimeRadioValue === ToggleButtonUserRadios.Now) {
        return null;
    }
    if (datePickerError !== null) {
        return (
            <>
                Error in date picker component: {datePickerError}
            </>
        )
    }
    return (
        <>
            <DatePicker selected={dateTime} onChange={(date, event) => datePickerChangeHandler(setDateTime, setDatePickerError, date, event)} timeInputLabel={"measurement time"} showTimeInput inline/>
        </>
    )
}

const renderFormIfReady = (selectedDevice: number, setEnteredCO2Text: React.Dispatch<React.SetStateAction<string>>, place_id: string, setEnteredCrowding: React.Dispatch<React.SetStateAction<string>>, placeName: string, setEnteredLocationDetails: React.Dispatch<React.SetStateAction<string>>, placesInfoFromDatabase: SelectedPlaceDatabaseInfo, selected: SublocationMeasurements | null, enteredCO2Text: string, userTimeRadioValue: ToggleButtonUserRadios, setUserTimeRadioValue: React.Dispatch<React.SetStateAction<ToggleButtonUserRadios>>, dateTime: Date, setDateTime: React.Dispatch<React.SetStateAction<Date>>, datePickerError: string | null, setDatePickerError: React.Dispatch<React.SetStateAction<string | null>>) => {
    if (selectedDevice === -1) {
        return null;
    }
    const measurementsOrEmptyArray = measurementsOrEmpty(placesInfoFromDatabase);
    // debugger;

    return (
        <>
            <Form onChange={(event) => onChangeCo2Event(event, setEnteredCO2Text)} onSubmit={ignoreDefault}>
                <Form.Label>
                    CO2 level (ppm)
                </Form.Label>
                <Form.Control type="number" placeholder="400" min={0} max={80000} name={"co2ppm"}/> {maybeMeasurementNote(enteredCO2Text)}
            </Form>
            <label className="form-label">
            Measurement time: &nbsp;&nbsp;&nbsp;
            </label>
            <ToggleButtonGroup type="radio" name="user time choice" value={userTimeRadioValue} onChange={setUserTimeRadioValue}>
                <ToggleButton value={ToggleButtonUserRadios.Now}>Now</ToggleButton>
                <ToggleButton value={ToggleButtonUserRadios.Custom}>Custom</ToggleButton>
            </ToggleButtonGroup>
            <br/>
            {maybeRenderTimeInput(userTimeRadioValue, dateTime, setDateTime, datePickerError, setDatePickerError)}
            <Form onChange={(event) => onChangeCrowdingEvent(event, setEnteredCrowding)} onSubmit={ignoreDefault}>
                <Form.Label>
                    Crowding 1-5 (1 is empty, 5 full)
                </Form.Label>
                <Form.Control type="number" min={1} max={5} name={"crowding"}/>
            </Form>
            <SublocationsDropdown selected={selected} measurements_by_sublocation={measurementsOrEmptyArray} nothingSelectedText={"New inner location"} nothingSelectedItem={nothingSelectedItem()}/>
            {renderInnerLocationFormIfNewLocation(setEnteredLocationDetails, placeName, selected)}
        </>
    )
}

const renderNotLoggedIn = (showCreateNewMeasurement: boolean, setShowCreateNewMeasurement: React.Dispatch<React.SetStateAction<boolean>>) => {
    console.log("not logged in to create measurement, rendering error modal.");
    return (
        <Modal onHide={() => hideHandler(setShowCreateNewMeasurement)} show={showCreateNewMeasurement}>
            <ModalHeaderNotLoggedIn/>
            <Modal.Body>
                Not logged in.
            </Modal.Body>
        </Modal>
    );
}


const nothingSelectedItem = () => {
    return (
        <>
            <Dropdown.Item eventKey={'-1'}>
                New sublocation
            </Dropdown.Item>
        </>
    )
}

const findSelected = (measurements_by_sublocation: Array<SublocationMeasurements>, selectedSubLocation: number): SublocationMeasurements | null => {
    const selected_ = measurements_by_sublocation.find((value) => {
        // debugger;
        return (value.sub_location_id === selectedSubLocation);
    })
    if (selected_ === undefined) {
        // console.log("not in measurements_by_sublocations");
        // debugger;
        return null;
    }
    // debugger;
    return selected_;
}

/*
Note to self, on selecting datetime pickers:
    These both seem good:
        https://www.npmjs.com/package/react-datetime-picker
        https://www.npmjs.com/package/react-datepicker

    I do not like this one:
        https://demo.mobiscroll.com/react/datetime/date-time-picker#


*/

export const CreateNewMeasurementModal: React.FC<CreateNewMeasurementProps> = (props: CreateNewMeasurementProps) => {
    const selectedPlace = useSelector(selectSelectedPlace);
    // const selectedModel = useSelector(selectSelectedModel);
    const selectedModelName = useSelector(selectSelectedModelName);
    const selectedDevice = useSelector(selectSelectedDevice);
    const selectedDeviceSerialNumber = useSelector(selectSelectedDeviceSerialNumber);
    const placeExistsInDatabase = useSelector(selectPlaceExistsInDatabase);
    const placesInfoFromDatabase = useSelector(selectPlacesInfoFromDatabase);
    const username = useSelector(selectUsername);

    const selectedSubLocation = useSelector(selectSublocationSelectedLocationID);

    // const selectedPlacesInfo = useSelector(selectPlacesInfoFromDatabase);
    // const selectedPlacesInfoErrors = useSelector(selectPlacesInfoErrors);

    const [userDevices, setUserDevices] = useState(defaultDevicesInfo);
    const [errorState, setErrorState] = useState('');

    const [enteredCO2Text, setEnteredCO2Text] = useState('');
    const [enteredCrowding, setEnteredCrowding] = useState('');
    const [enteredLocationDetails, setEnteredLocationDetails] = useState('');

    const [userTimeRadioValue, setUserTimeRadioValue] = useState(ToggleButtonUserRadios.Now);

    const [dateTime, setDateTime] = useState(new Date());

    const [datePickerError, setDatePickerError] = useState(null as string | null);

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
                console.warn(formatErrors(userDeviceInfo.errors));
                setErrorState(formatErrors(userDeviceInfo.errors));
            }
            console.table(userDeviceInfo.devices);
            setUserDevices(userDeviceInfo);
        }).catch((error) => {
            console.warn(error);
            console.warn(error.message);
            setErrorState(error.message);
        })
    }, [username])

    useEffect(() => {
        if (selectedSubLocation === -1) {
            // console.log(placesInfoFromDatabase.measurements_by_sublocation);
            if (placesInfoFromDatabase === defaultPlaceInfo) {
                console.log("stil loading place info?");
                return;
            }
            if (placesInfoFromDatabase.measurements_by_sublocation.length > 0) {
                // debugger;
                dispatch(setSublocationSelectedLocationID(placesInfoFromDatabase.measurements_by_sublocation[0].sub_location_id));
            }
            // debugger;
        }

    // Running this hook whenever selectedSubLocation changed would defeat the purpose, and never let users add new sublocations.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dispatch, placesInfoFromDatabase]);

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
    // console.assert(placeExistsInDatabase !== null);
    if (placeExistsInDatabase === null) {
        console.warn("placeExistsInDatabase not loaded yet?")
        // debugger;
        return null;
    }
    if (username === '') {
        return renderNotLoggedIn(props.showCreateNewMeasurement, props.setShowCreateNewMeasurement);
    }
    // debugger;
    if (placesInfoFromDatabase === defaultPlaceInfo) {
        dispatch(setSublocationSelectedLocationID(-1))
    }
    const selected = findSelected(placesInfoFromDatabase.measurements_by_sublocation, selectedSubLocation);
    return (
        <>
            <Modal show={props.showCreateNewMeasurement} onHide={() => hideHandler(props.setShowCreateNewMeasurement)}>
                <ModalHeader placeName={placeName}/>
                <Modal.Body>
                    {renderErrors(errorState)}
                    {renderSelectDeviceDropdown(userDevices, selectedDevice, selectedModelName, selectedDeviceSerialNumber, dispatch)}
                    {renderFormIfReady(selectedDevice, setEnteredCO2Text, place_id, setEnteredCrowding, placeName, setEnteredLocationDetails, placesInfoFromDatabase, selected, enteredCO2Text, userTimeRadioValue, setUserTimeRadioValue, dateTime, setDateTime, datePickerError, setDatePickerError)}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={(event) => hideHandler(props.setShowCreateNewMeasurement)}>
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={(event) => submitHandler(event, selectedDevice, enteredCO2Text, place_id, props.setShowCreateNewMeasurement, placeExistsInDatabase, dispatch, setErrorState, enteredCrowding, enteredLocationDetails, selectedSubLocation, userTimeRadioValue, dateTime)}>
                        Submit new measurement
                    </Button>
                </Modal.Footer>

            </Modal>

        </>
    )
}