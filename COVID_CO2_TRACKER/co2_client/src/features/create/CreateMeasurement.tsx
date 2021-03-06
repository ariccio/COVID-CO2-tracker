import React, {useState, useEffect} from 'react';
import {useSelector, useDispatch} from 'react-redux';
import {Modal, Button, Form, Dropdown} from 'react-bootstrap';
import {useLocation, useHistory} from 'react-router-dom'


import {selectSelectedDevice, selectSelectedDeviceSerialNumber, selectSelectedModel, selectSelectedModelName, setSelectedDevice, setSelectedDeviceSerialNumber, setSelectedModel, setSelectedModelName} from '../deviceModels/deviceModelsSlice';
import {selectSelectedPlace} from '../google/googleSlice';
import { defaultDevicesInfo, queryUserDevices, queryUserInfo, UserDevicesInfo } from '../../utils/QueryUserInfo';
import { formatErrors } from '../../utils/ErrorObject';
import {selectPlacesInfoFromDatabase, selectPlacesInfoErrors} from '../places/placesSlice';
import {UserInfoDevice} from '../../utils/QueryDeviceInfo';

const ModalHeader = (props: {placeName: string}) =>
    <Modal.Header closeButton>
        <Modal.Title>Add a measurement for {props.placeName}</Modal.Title>
    </Modal.Header>


interface CreateNewMeasurementProps {
    showCreateNewMeasurement: boolean,
    setShowCreateNewMeasurement: React.Dispatch<React.SetStateAction<boolean>>
}

const devicesToDropdown = (userDevices: UserDevicesInfo) => {
    return userDevices.devices.map((value: UserInfoDevice, index: number) => {
        return (
            <Dropdown.Item eventKey={`${value.device_id}`} key={`${value.device_id}-${value.device_model_id}-${value.device_manufacturer_id}-eventKey-dropdown`}>
                {value.device_model} - {value.device_model}
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

const renderFormIfReady = (selectedDevice: number) => {
    if (selectedDevice === -1) {
        return null;
    }
    return (
        <>
            <Form>
                <Form.Label>
                    CO2 level (ppm)
                </Form.Label>
                <Form.Control type="text" placeholder="400"/>
            </Form>
        </>
    )
}

export const CreateNewMeasurementModal: React.FC<CreateNewMeasurementProps> = (props: CreateNewMeasurementProps) => {
    const selectedPlace = useSelector(selectSelectedPlace);
    const selectedModel = useSelector(selectSelectedModel);
    const selectedModelName = useSelector(selectSelectedModelName);
    const selectedDevice = useSelector(selectSelectedDevice);
    const selectedDeviceSerialNumber = useSelector(selectSelectedDeviceSerialNumber);

    const selectedPlacesInfo = useSelector(selectPlacesInfoFromDatabase);
    const selectedPlacesInfoErrors = useSelector(selectPlacesInfoErrors);

    const [userDevices, setUserDevices] = useState(defaultDevicesInfo);
    const [errorState, setErrorState] = useState('');

    const placeName = selectedPlace.name;

    const dispatch = useDispatch();
    useEffect(() => {
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
    }, [])


    return (
        <>
            <Modal show={props.showCreateNewMeasurement} onHide={() => hideHandler(props.setShowCreateNewMeasurement)}>
                <ModalHeader placeName={placeName}/>
                <Modal.Body>
                    {renderErrors(errorState)}
                    {renderSelectDeviceDropdown(userDevices, selectedDevice, selectedModelName, selectedDeviceSerialNumber, dispatch)}
                    {renderFormIfReady(selectedDevice)}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={(event) => hideHandler(props.setShowCreateNewMeasurement)}>
                        Cancel
                    </Button>
                    <Button variant="primary">
                        Submit new measurement
                    </Button>
                </Modal.Footer>

            </Modal>

        </>
    )
}