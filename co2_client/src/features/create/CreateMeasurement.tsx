import {useState, useEffect, Suspense, useRef} from 'react';
import {useSelector, useDispatch} from 'react-redux';
import {Modal, Button, Form, Dropdown, ToggleButtonGroup, ToggleButton, Spinner} from 'react-bootstrap';
import DatePicker from 'react-datepicker';

import * as Sentry from "@sentry/browser"; // for manual error reporting.

// import {useLocation, useHistory} from 'react-router-dom'

import { useTranslation } from 'react-i18next';

import "react-datepicker/dist/react-datepicker.css";


import {selectSelectedDevice, selectSelectedDeviceSerialNumber, selectSelectedModelName, setSelectedDevice, setSelectedDeviceSerialNumber, setSelectedModel, setSelectedModelName} from '../deviceModels/deviceModelsSlice';
import {placeResultWithTranslatedType} from '../google/googleSlice';
import { queryUserDevices } from '../../utils/QueryUserInfo';
import {UserInfoDevice} from '../../utils/DeviceInfoTypes';
import {defaultDevicesInfo, UserDevicesInfo } from '../../utils/UserInfoTypes';

import { Errors, ExtraErrorInformationActiveModelErrorInfo, formatErrors } from '../../utils/ErrorObject';
import {defaultPlaceInfo, SelectedPlaceDatabaseInfo, SublocationMeasurements} from '../places/placesSlice';
// import {} from '../../utils/QueryDeviceInfo';


import {postRequestOptions} from '../../utils/DefaultRequestOptions';
import { fetchJSONWithChecks } from '../../utils/FetchHelpers';
import { API_URL, CREATE_PLACE_PATH } from '../../utils/UrlPath';
import { updatePlacesInfoFromBackend } from '../../utils/QueryPlacesInfo';
import { selectUsername } from '../login/loginSlice';
import { SelectedSublocationForDropdownDisplay, SublocationsDropdown } from '../sublocationsDropdown/SublocationsDropdown';
import { selectSublocationSelectedLocationID, setSublocationSelectedLocationID } from '../sublocationsDropdown/sublocationSlice';
import { Link } from 'react-router-dom';
import { devicesCreateFromHome, devicesPath } from '../../paths/paths';
import { AppDispatch } from '../../app/store';
import { findSelected } from '../measurements/MeasurementsByDropdown';

enum ToggleButtonUserRadios {
    Now = 1,
    Custom
}

const ModalHeader = (props: {placeName: string}) => {
    const [translate] = useTranslation();
    return (
        <Modal.Header closeButton>
            <Modal.Title>{translate('Add a measurement for')} {props.placeName}</Modal.Title>
        </Modal.Header>
    );
}

const ModalHeaderNotLoggedIn = () => {
    const [translate] = useTranslation();
    return (
        <Modal.Header closeButton>
            <Modal.Title>{translate("not-logged-in-please")}</Modal.Title>
        </Modal.Header>
    );
}


interface CreateNewMeasurementProps {
    showCreateNewMeasurement: boolean,
    setShowCreateNewMeasurement: React.Dispatch<React.SetStateAction<boolean>>,
    selectedPlace: placeResultWithTranslatedType,
    selectedPlaceExistsInDatabase: boolean | null,
    placesInfoFromDatabase: SelectedPlaceDatabaseInfo
}

const devicesToDropdown = (userDevices: UserDevicesInfo) => {
    return userDevices.devices.map((value: UserInfoDevice) => {
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

const selectDeviceDropdownHandler = (eventKey: string | null, e: React.SyntheticEvent<unknown>, userDevices: UserDevicesInfo, dispatch: AppDispatch) => {
    // debugger;
    console.assert(eventKey !== null);
    if (eventKey === null) {
        alert("TODO: I need to handle this. Event key null.");
        Sentry.captureMessage("TODO: I need to handle this. Event key null.");
        return;
    }
    if (eventKey === '-1') {
        // console.warn("user selected create new device, need to implement");
        return;
    }
    const selected = dropdownKeyToDeviceID(eventKey);
    if (selected !== null) {
        const found = userDevices.devices.find((value: UserInfoDevice) => {
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

const loadingDevicesDropdownString = (userDevices: UserDevicesInfo) => {
    if (userDevices === defaultDevicesInfo) {
        return "loading-user-devices";
    }
    return "Create new device";
}

const loadingDevicesDropdownTitleString = (userDevices: UserDevicesInfo, translate: any) => {
    if (userDevices === defaultDevicesInfo) {
        return translate("loading-user-devices");
    }
    return "Select device:";

}

const SelectDeviceDropdown = (props: {userDevices: UserDevicesInfo, selectedDevice: number, selectedModelName: string, selectedDeviceSerialNumber: string}) => {
    const dispatch = useDispatch();
    const [translate] = useTranslation();
    // const [devicesStatus, setDevicesStatus] = useState("");

    if (props.userDevices.devices === undefined) {
        throw new Error(`userDevices.devices is undefined, this is a bug in CreateMeasurement.tsx! Selected device: ${props.selectedDevice}, selectedModelName: ${props.selectedModelName}, selectedDeviceSerialNumber: ${props.selectedDeviceSerialNumber}`);
    }

    if (props.userDevices.devices.length === 0) {
        console.log("no devices, probably loading...");
    }

    const loadingOrCreateString = loadingDevicesDropdownString(props.userDevices);
    const loadingOrSelectString = loadingDevicesDropdownTitleString(props.userDevices, translate);
    // "no-devices-yet-loading": "No devices, yet. Loading..."
    // useEffect(() => {
    //     if (props.userDevices === defaultDevicesInfo) {
    //         setDevicesStatus(translate("no-devices-yet-loading"))
    //     }
    // }, [props.userDevices, translate]);

    return (
        <div>
            <Dropdown onSelect={(eventKey: string | null, event: React.SyntheticEvent<unknown>) => selectDeviceDropdownHandler(eventKey, event, props.userDevices, dispatch)}>
                <Dropdown.Toggle variant="success" id="dropdown-basic">
                    <span>
                        {props.selectedDevice !== -1 ? `${props.selectedModelName} - ${props.selectedDeviceSerialNumber}` :  loadingOrSelectString}
                    </span>
                </Dropdown.Toggle>
                <Dropdown.Menu>
                    {devicesToDropdown(props.userDevices)}
                    <Dropdown.Item eventKey={"-1"} as={Link} to={devicesPath + `/${devicesCreateFromHome}`}>
                        <span>
                            + {translate(loadingOrCreateString)}
                        </span>
                    </Dropdown.Item>
                </Dropdown.Menu>
            </Dropdown>
        </div>

    );
}

const renderErrors = (errorState: string) => {
    if (errorState === '') {
        return null;
    }
    return (
        <div>
            errors encountered: {errorState}
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

    const result = fetchJSONWithChecks(CREATE_PLACE_PATH, init, 201, true, fetchFailedCallback, fetchSuccessCallback ) as Promise<PlaceCreateResponseType>;
    return result;
}

const createMeasurementHandler = (selectedDevice: number, enteredCO2Text: string, place_id: string, setShowCreateNewMeasurement: React.Dispatch<React.SetStateAction<boolean>>, enteredCrowding: string, enteredLocationDetails: string, selectedSubLocation: number, userTimeRadioValue: ToggleButtonUserRadios, dateTime: Date, setShowSubmit: React.Dispatch<React.SetStateAction<boolean>>, setSubmitting: React.Dispatch<React.SetStateAction<boolean>>, setInvalidField: React.Dispatch<React.SetStateAction<string[]>>, dispatch: AppDispatch) => {
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
            setSubmitting(false);
            setShowCreateNewMeasurement(false);
            // debugger;
            console.log("new measurement successfully created. We currently throw the result away.");
            console.log("to use it, please remove this message.");
            console.log("here it is anyways:");
            console.log(result);
            dispatch(setSublocationSelectedLocationID(selectedSubLocation));
            return;
        }
        if (result.errors.length > 0) {
            if (result.errors[0].other_information !== undefined) {
                const oi = result.errors[0].other_information as any;
                if (oi.active_model_error_info !== undefined) {
                    const ame = oi.active_model_error_info as ExtraErrorInformationActiveModelErrorInfo;
                    setInvalidField([ame.attribute]);
                    debugger;
                }
            }
        }
        // console.log("TODO: set form invalid.");
        setShowSubmit(true);
        setSubmitting(false);
        
        // debugger;
    })
}

function checkLocationSelectedValid(setInvalidField: React.Dispatch<React.SetStateAction<string[]>>, enteredLocationDetails: string, selectedSubLocation: number, invalidField: string[]): boolean {
    if (selectedSubLocation === -1) {
        console.assert(enteredLocationDetails !== '');
        if (enteredLocationDetails === '') {
            // setInvalidField([INNER_LOCATION_FIELD_ID, ...invalidField]);
            return false;

        }
    }
    if (enteredLocationDetails === '') {
        console.assert(selectedSubLocation !== -1);
        if (selectedSubLocation === -1) {
            // setInvalidField([INNER_LOCATION_FIELD_ID, ...invalidField])
            return false;
        }
    }

    return true;
}

function checkEnteredCo2Text(enteredCO2Text: string, setInvalidField: React.Dispatch<React.SetStateAction<string[]>>, invalidField: string[]): boolean {
    if (enteredCO2Text.length === 0) {
        // setInvalidField([CO2_FIELD_ID, ...invalidField]);
        return false;
    }

    const parsedCO2 = parseInt(enteredCO2Text, 10);
    if (Number.isNaN(parsedCO2)) {
        // setInvalidField([CO2_FIELD_ID, ...invalidField]);
        return false;
    }
    if (parsedCO2 < 350) {
        // setInvalidField([CO2_FIELD_ID, ...invalidField]);
        return false;
    }
    if (parsedCO2 > 30_000) {
        // setInvalidField([CO2_FIELD_ID, ...invalidField]);
        return false;

    }

    debugger;
    return true;
}


function checkEnteredCrowding(enteredCrowding: string, setInvalidField: React.Dispatch<React.SetStateAction<string[]>>, invalidField: string[]): boolean {
    if (enteredCrowding.length === 0) {
        // setInvalidField([CROWDING_FIELD_ID, ...invalidField]);
        return false;
    }

    const parsedCrowding = parseInt(enteredCrowding, 10);
    if (Number.isNaN(parsedCrowding)) {
        // setInvalidField([CROWDING_FIELD_ID, ...invalidField]);
        return false;        
    }
    if (parsedCrowding < 1) {
        // setInvalidField([CROWDING_FIELD_ID, ...invalidField]);
        return false;
    }
    if (parsedCrowding > 5) {
        // setInvalidField([CROWDING_FIELD_ID, ...invalidField]);
        return false;
    }
    return true;
}


function checkFields(setInvalidField: React.Dispatch<React.SetStateAction<string[]>>, invalidField: string[], enteredLocationDetails: string, selectedSubLocation: number, setErrorState: React.Dispatch<React.SetStateAction<string>>, enteredCO2Text: string, enteredCrowding: string): boolean {
    const invalidFields = [];
    const selectedLocationDetailsValid = checkLocationSelectedValid(setInvalidField, enteredLocationDetails, selectedSubLocation, invalidField);

    if (!selectedLocationDetailsValid) {
        setErrorState("You must enter the name of a new location OR choose one from the dropdown.");
        invalidFields.push(INNER_LOCATION_FIELD_ID);
    }


    const enteredCO2Valid = checkEnteredCo2Text(enteredCO2Text, setInvalidField, invalidField);
    if (!enteredCO2Valid) {
        setErrorState("You must enter a reasonable CO2 measurement.");
        invalidFields.push(CO2_FIELD_ID);
        // return;
    }

    const enteredCrowdingValid = checkEnteredCrowding(enteredCrowding, setInvalidField, invalidField);
    if (!enteredCrowdingValid) {
        setErrorState("You must enter a valid number for crowding.");
        invalidFields.push(CROWDING_FIELD_ID);
    }

    if ((!selectedLocationDetailsValid) || (!enteredCO2Valid) || (!enteredCrowdingValid)) {
        setInvalidField(invalidFields);
        return false;
    }


    return true;
}

const submitHandler = (event: React.MouseEvent<HTMLElement, MouseEvent>, selectedDevice: number, enteredCO2Text: string, place_id: string, setShowCreateNewMeasurement: React.Dispatch<React.SetStateAction<boolean>>, placeExistsInDatabase: boolean, dispatch: AppDispatch, setErrorState: React.Dispatch<React.SetStateAction<string>>, enteredCrowding: string, enteredLocationDetails: string, selectedSubLocation: number, userTimeRadioValue: ToggleButtonUserRadios, dateTime: Date, setShowSubmit: React.Dispatch<React.SetStateAction<boolean>>, setSubmitting: React.Dispatch<React.SetStateAction<boolean>>, setInvalidField: React.Dispatch<React.SetStateAction<string[]>>, invalidField: string[]) => {
    
    
    const fieldsValid = checkFields(setInvalidField, invalidField, enteredLocationDetails, selectedSubLocation, setErrorState, enteredCO2Text, enteredCrowding);
    if (!fieldsValid) {
        return;
    }


    setShowSubmit(false);
    setSubmitting(true);
    debugger;
    const placeExistsPromiseOrNull = createPlaceIfNotExist(placeExistsInDatabase, place_id);
    if (placeExistsPromiseOrNull === null) {
        // debugger;
        createMeasurementHandler(selectedDevice, enteredCO2Text, place_id, setShowCreateNewMeasurement, enteredCrowding, enteredLocationDetails, selectedSubLocation, userTimeRadioValue, dateTime, setShowSubmit, setSubmitting, setInvalidField, dispatch);
        updatePlacesInfoFromBackend(place_id, dispatch);
        return;
    }
    placeExistsPromiseOrNull.then((existsPromise) => {
        // debugger;
        if (existsPromise.errors !== undefined) {
            console.log("user may have clicked twice. TODO: debounce.")
            setErrorState(formatErrors(existsPromise.errors));
            return;
        }
        createMeasurementHandler(selectedDevice, enteredCO2Text, place_id, setShowCreateNewMeasurement, enteredCrowding, enteredLocationDetails, selectedSubLocation, userTimeRadioValue, dateTime, setShowSubmit, setSubmitting,  setInvalidField, dispatch);
        updatePlacesInfoFromBackend(place_id, dispatch);
    }).catch((errors) => {
        setErrorState(errors.message);
        setShowSubmit(true);
        setSubmitting(false);
    });

}

function ignoreDefault(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    event.stopPropagation();
}

const INNER_LOCATION_FIELD_ID = "location_where_inside_info";
const CO2_FIELD_ID = 'co2ppm';

const CROWDING_FIELD_ID = "crowding";

const InnerLocationFormIfNewLocation = (props: {setEnteredLocationDetails: React.Dispatch<React.SetStateAction<string>>, placeName: string, selected: SelectedSublocationForDropdownDisplay  | null, invalidField: string[]}) => {
    const [translate] = useTranslation();
    if (props.selected === null) {
        return (
            <div>
                <Form onChange={(event) => onChangeInnerLocationEvent(event, props.setEnteredLocationDetails)} onSubmit={ignoreDefault}>
                    <Form.Label>
                        <span>
                            {translate("Where inside")} {props.placeName} {translate("did you take the measurement?")}
                        </span>
                    </Form.Label>
                    <Form.Control type="text" name={INNER_LOCATION_FIELD_ID} isInvalid={props.invalidField.includes(INNER_LOCATION_FIELD_ID)}/>
                </Form>
            </div>
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

const MaybeMeasurementNote = (props: {enteredCO2Text: string}) => {
    const parsed = parseInt(props.enteredCO2Text);
    const [translate] = useTranslation();
    if (isNaN(parsed)) {
        if (props.enteredCO2Text.length !== 0) {
            console.warn(`Unable to parse entered CO2 text ('${props.enteredCO2Text}') into number`);
        }
    }
    if (parsed < 400) {
        return (
            <span>
                {translate("low-measurement-message")}
                <br/>
                <br/>
            </span>
        )
    }
    if (parsed > 2000) {
        return (
            <span>
                {translate("high-measurement-message")}
                <br/>
                <br/>
            </span>
        );
    }
    return null;
}

function datePickerChangeHandler(setDateTime: React.Dispatch<React.SetStateAction<Date>>, setDatePickerError: React.Dispatch<React.SetStateAction<string | null>>, date: Date | [Date | null, Date | null] | null,
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
            <span>
                Error in date picker component: {datePickerError}
            </span>
        )
    }
    return (
        <span>
            <DatePicker selected={dateTime} onChange={(date, event) => datePickerChangeHandler(setDateTime, setDatePickerError, date, event)} timeInputLabel={"measurement time"} showTimeInput inline/>
        </span>
    )
}

const DefaultNothingSelectedItem = () => {
    return (
        <Suspense fallback="Loading translations...">
            <NothingSelectedItem/>
        </Suspense>
    );
}

const RenderFormIfReady = (props: {
    selectedDevice: number,
    setEnteredCO2Text: React.Dispatch<React.SetStateAction<string>>,
    place_id: string,
    setEnteredCrowding: React.Dispatch<React.SetStateAction<string>>,
    placeName: string,
    setEnteredLocationDetails: React.Dispatch<React.SetStateAction<string>>,
    placesInfoFromDatabase: SelectedPlaceDatabaseInfo,
    selected: SelectedSublocationForDropdownDisplay | null,
    enteredCO2Text: string,
    userTimeRadioValue: ToggleButtonUserRadios,
    setUserTimeRadioValue: React.Dispatch<React.SetStateAction<ToggleButtonUserRadios>>,
    dateTime: Date,
    setDateTime: React.Dispatch<React.SetStateAction<Date>>,
    datePickerError: string | null,
    setDatePickerError: React.Dispatch<React.SetStateAction<string | null>>,
    invalidField: string[],
    setSelectedSubLocationIDModalOnly: React.Dispatch<React.SetStateAction<number>>
} ) => {
    const [translate] = useTranslation();
    if (props.selectedDevice === -1) {
        return null;
    }
    const measurementsOrEmptyArray = measurementsOrEmpty(props.placesInfoFromDatabase);

    return (
        <div>
            <Form onChange={(event) => onChangeCo2Event(event, props.setEnteredCO2Text)} onSubmit={ignoreDefault}>
                <Form.Label>
                    <span>
                        {translate("co2-level")}
                    </span>
                </Form.Label>
                <Form.Control type="number" placeholder="400" min={350} max={15000} name={CO2_FIELD_ID} isInvalid={props.invalidField.includes(CO2_FIELD_ID)} id={CO2_FIELD_ID}/> <Suspense fallback="Loading translations..."><MaybeMeasurementNote enteredCO2Text={props.enteredCO2Text} /></Suspense>
            </Form>
            <label className="form-label">
                <span>
                    {translate("Measurement time")}: &nbsp;&nbsp;&nbsp;
                </span>
            </label>
            <ToggleButtonGroup type="radio" name="user time choice" value={props.userTimeRadioValue} onChange={(value) => {props.setUserTimeRadioValue(value)}}>
                <ToggleButton id="tag-datetime-user-radio-btn-now" value={ToggleButtonUserRadios.Now}>{translate("Now")}</ToggleButton>
                <ToggleButton id="tag-datetime-user-radio-btn-custom" value={ToggleButtonUserRadios.Custom}>{translate("Other Date/Time")}</ToggleButton>
            </ToggleButtonGroup>
            <br/>
            {maybeRenderTimeInput(props.userTimeRadioValue, props.dateTime, props.setDateTime, props.datePickerError, props.setDatePickerError)}
            <Form onChange={(event) => onChangeCrowdingEvent(event, props.setEnteredCrowding)} onSubmit={ignoreDefault}>
                <Form.Label>
                    <span>
                        {translate("crowding-level")}
                    </span>
                </Form.Label>
                <Form.Control type="number" min={1} max={5} name={CROWDING_FIELD_ID} isInvalid={props.invalidField.includes(CROWDING_FIELD_ID)}/>
            </Form>
            <SublocationsDropdown selectedSublocationDisplayData={props.selected} measurements_by_sublocation={measurementsOrEmptyArray} nothingSelectedText={"New inner location"} nothingSelectedItem={<DefaultNothingSelectedItem/>} setGlobal={false} setSelectedSubLocationIDModalOnly={props.setSelectedSubLocationIDModalOnly}/>
            <Suspense fallback="Loading translations...">
                <InnerLocationFormIfNewLocation setEnteredLocationDetails={props.setEnteredLocationDetails} placeName={props.placeName} selected={props.selected} invalidField={props.invalidField}/>
            </Suspense>
        </div>
    )
}

const NotLoggedIn = (props: {showCreateNewMeasurement: boolean, setShowCreateNewMeasurement: React.Dispatch<React.SetStateAction<boolean>>}) => {
    console.log("not logged in to create measurement, rendering error modal.");
    const [translate] = useTranslation();
    return (
        <Modal onHide={() => hideHandler(props.setShowCreateNewMeasurement)} show={props.showCreateNewMeasurement}>
            <Suspense fallback="Loading translations...">
                <ModalHeaderNotLoggedIn/>
            </Suspense>
            <Modal.Body>
                <span>
                    {translate("not-logged-in-please")}
                </span>
            </Modal.Body>
        </Modal>
    );
}


const NothingSelectedItem = () => {
    const [translate] = useTranslation();
    return (
        <div>
            <Dropdown.Item eventKey={'-1'}>
                <span>
                    {translate("New sublocation")}
                </span>
            </Dropdown.Item>
        </div>
    )
}

// const findSelected = (measurements_by_sublocation: Array<SublocationMeasurements>, selectedSubLocation: number): SublocationMeasurements | null => {
//     const selected_ = measurements_by_sublocation.find((value) => {
//         // debugger;
//         return (value.sub_location_id === selectedSubLocation);
//     })
//     if (selected_ === undefined) {
//         // console.log("not in measurements_by_sublocations");
//         // debugger;
//         return null;
//     }
//     // debugger;
//     return selected_;
// }

/*
Note to self, on selecting datetime pickers:
    These both seem good:
        https://www.npmjs.com/package/react-datetime-picker
        https://www.npmjs.com/package/react-datepicker

    I do not like this one:
        https://demo.mobiscroll.com/react/datetime/date-time-picker#


*/

//TODO: extract logic
const submitOrSpinning = (submitting: boolean, translate: any) => {
    if (!submitting) {
        return (
            <div>
                <span>
                    {translate("Submit new measurement")}
                </span>
            </div>
        )
    }
    return (
        <div>
            <Spinner animation="border" role="status">
                  <span className="visually-hidden">
                      {translate('submitting-measurement')}
                  </span>
            </Spinner>
        </div>
    )
}

export const CreateNewMeasurementModal: React.FC<CreateNewMeasurementProps> = (props: CreateNewMeasurementProps) => {
    const [translate] = useTranslation();

    const username = useSelector(selectUsername);

    // const selectedPlace = useSelector(selectSelectedPlace);
    // const selectedModel = useSelector(selectSelectedModel);
    const selectedModelName = useSelector(selectSelectedModelName);
    const selectedDevice = useSelector(selectSelectedDevice);
    const selectedDeviceSerialNumber = useSelector(selectSelectedDeviceSerialNumber);
    // const placeExistsInDatabase = useSelector(selectPlaceExistsInDatabase);
    // const placesInfoFromDatabase = useSelector(selectPlacesInfoFromDatabase);

    const selectedSubLocationID_ = useSelector(selectSublocationSelectedLocationID);
    
    const [selectedSubLocationIDModalOnly, setSelectedSubLocationIDModalOnly] = useState(selectedSubLocationID_);
    const [userDevices, setUserDevices] = useState(defaultDevicesInfo);
    const [errorState, setErrorState] = useState('');
    const [invalidField, setInvalidField] = useState([] as (string[]));
    const [enteredCO2Text, setEnteredCO2Text] = useState('');
    const [enteredCrowding, setEnteredCrowding] = useState('');
    const [enteredLocationDetails, setEnteredLocationDetails] = useState('');

    const [userTimeRadioValue, setUserTimeRadioValue] = useState(ToggleButtonUserRadios.Now);

    const [dateTime, setDateTime] = useState(new Date());

    const [datePickerError, setDatePickerError] = useState(null as string | null);
    const [showSubmit, setShowSubmit] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const placesInfoFromDatabase = props.placesInfoFromDatabase;
    const {measurements_by_sublocation} = placesInfoFromDatabase;

    const [selected, setSelected] = useState(findSelected(measurements_by_sublocation, selectedSubLocationID_));
    // const selected = findSelected(measurements_by_sublocation, selectedSubLocation);


    // const placeName = selectedPlace.name;    
    
    const dispatch = useDispatch();

    const selectedPlaceExistsInDatabase = props.selectedPlaceExistsInDatabase;
    const dialogRef = useRef<(HTMLDivElement) | null>(null);

    useEffect(() => {
        if (!dialogRef) {
            return;
        }
        if (dialogRef.current === null) {
            return;
        }
        if (!(props.showCreateNewMeasurement)) {
            return;
        }
        dialogRef.current.scrollIntoView();
    }, [props.showCreateNewMeasurement])

    

    useEffect(() => {
        const selected_ = findSelected(measurements_by_sublocation, selectedSubLocationIDModalOnly);
        setSelected(selected_);
    }, [measurements_by_sublocation, selectedSubLocationIDModalOnly])


    useEffect(() => {

        //TODO: 4/2/2022: The fuck is this so crazy?
        if (username === '') {
            setErrorState("Not logged in, must be logged in to create measurements!");
            return;
        }
        const userDeviceInfoPromise: Promise<UserDevicesInfo> = queryUserDevices();
        userDeviceInfoPromise.then((userDeviceInfo) => {
            if (userDeviceInfo.errors !== undefined) {
                console.warn(`userDevice info (in create new measurement) errors: ${formatErrors(userDeviceInfo.errors)}`);
                setErrorState(formatErrors(userDeviceInfo.errors));
                const formatted = formatErrors(userDeviceInfo.errors);

                // Some users are seeing weird errors in safari in spanish. Force report them.
                if (formatted.includes("webkit")) {
                    Sentry.captureMessage(formatted);
                }
                setUserDevices(defaultDevicesInfo);
                return;
            }
            console.table(userDeviceInfo.devices);
            setUserDevices(userDeviceInfo);
            if (userDeviceInfo.last_device_id === null) {
                console.warn("No known last used device?");
                return;
            }
            // debugger;
            const found = userDeviceInfo.devices.find((device) => device.device_id === userDeviceInfo.last_device_id);
            if (found) {
                dispatch(setSelectedDevice(found.device_id));
                dispatch(setSelectedDeviceSerialNumber(found.serial));
                dispatch(setSelectedModelName(found.device_model));
                dispatch(setSelectedModel(found.device_model_id));
                // debugger;
            }
            else {
                console.warn("Last device not found in known user devices!");
                debugger;
            }
        }).catch((error) => {
            console.warn(error);
            console.warn(error.message);
            setErrorState(error.message);
            // Some users are seeing weird errors in safari in spanish. Force report them.
            if (error.message.includes("webkit")) {
                Sentry.captureException(error);
            }
            setUserDevices(defaultDevicesInfo);
        })
    }, [username, dispatch])

    useEffect(() => {
        if (selectedSubLocationIDModalOnly === -1) {
            if (placesInfoFromDatabase === defaultPlaceInfo) {
                console.log("stil loading place info?");
                return;
            }
            if (measurements_by_sublocation.length > 0) {
                // debugger;
                setSelectedSubLocationIDModalOnly(measurements_by_sublocation[0].sub_location_id);
            }
            // debugger;
        }
    // TODO: 3/31/2022: Refactor so not ridiculous.
    // Running this hook whenever selectedSubLocation changed would defeat the purpose, and never let users add new sublocations.
    
    }, [dispatch, placesInfoFromDatabase]);



    // useEffect(() => {
    // }, []);

    const {place_id} = props.selectedPlace;
    console.assert(place_id !== null);
    console.assert(place_id !== undefined);
    if (place_id === undefined) {
        debugger;
        return (null);
    }
    console.assert(props.selectedPlace.name !== undefined);
    if (props.selectedPlace.name === undefined) {
        debugger;
        return null;
    }
    // console.assert(placeExistsInDatabase !== null);
    if (selectedPlaceExistsInDatabase === null) {
        console.warn("placeExistsInDatabase not loaded yet?")
        // debugger;
        return null;
    }
    if (username === '') {
        return (
            <div>
                <Suspense fallback="loading translations...">
                    <NotLoggedIn showCreateNewMeasurement={props.showCreateNewMeasurement} setShowCreateNewMeasurement={props.setShowCreateNewMeasurement} />
                </Suspense>
            </div>
        );
    }
    // debugger;
    if (placesInfoFromDatabase === defaultPlaceInfo) {
        dispatch(setSublocationSelectedLocationID(-1))
    }
    
    return (
        <div>
            <Modal show={props.showCreateNewMeasurement} onHide={() => hideHandler(props.setShowCreateNewMeasurement)}>
                <Suspense fallback="Loading translations...">
                    <ModalHeader placeName={props.selectedPlace.name}/>
                </Suspense>
                <Modal.Body  ref={dialogRef}>
                    <span>
                        {renderErrors(errorState)}
                    </span>
                    <Suspense fallback="Loading translations...">
                        <SelectDeviceDropdown userDevices={userDevices} selectedDevice={selectedDevice} selectedModelName={selectedModelName} selectedDeviceSerialNumber={selectedDeviceSerialNumber}/>
                    </Suspense>
                    <Suspense fallback="Loading translations...">
                        <RenderFormIfReady selectedDevice={selectedDevice} setEnteredCO2Text={setEnteredCO2Text} place_id={place_id} setEnteredCrowding={setEnteredCrowding} placeName={props.selectedPlace.name} setEnteredLocationDetails={setEnteredLocationDetails} placesInfoFromDatabase={placesInfoFromDatabase} selected={selected} enteredCO2Text={enteredCO2Text} userTimeRadioValue={userTimeRadioValue} setUserTimeRadioValue={setUserTimeRadioValue} dateTime={dateTime} setDateTime={setDateTime} datePickerError={datePickerError} setDatePickerError={setDatePickerError} invalidField={invalidField} setSelectedSubLocationIDModalOnly={setSelectedSubLocationIDModalOnly}/>
                    </Suspense>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" /*TODO: maybe disable here too?*/ onClick={(event) => hideHandler(props.setShowCreateNewMeasurement)}>
                        <span>
                            {translate('Cancel')}
                        </span>
                    </Button>
                    <Button variant="primary" disabled={!showSubmit} onClick={(event) => {
                            // setShowSubmit(!showSubmit);
                            submitHandler(event, selectedDevice, enteredCO2Text, place_id, props.setShowCreateNewMeasurement, selectedPlaceExistsInDatabase, dispatch, setErrorState, enteredCrowding, enteredLocationDetails, selectedSubLocationIDModalOnly, userTimeRadioValue, dateTime, setShowSubmit, setSubmitting, setInvalidField, invalidField);
                        }}>
                        {submitOrSpinning(submitting, translate)}
                    </Button>
                </Modal.Footer>

            </Modal>

        </div>
    )
}