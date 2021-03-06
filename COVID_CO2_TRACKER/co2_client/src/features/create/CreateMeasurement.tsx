import React, {useState, useEffect} from 'react';
import {useSelector, useDispatch} from 'react-redux';
import {Modal, Button, Form, Dropdown} from 'react-bootstrap';
import {useLocation, useHistory} from 'react-router-dom'


import {selectSelectedDevice, selectSelectedDeviceSerialNumber, selectSelectedModel, selectSelectedModelName, setSelectedModel, setSelectedModelName} from '../deviceModels/deviceModelsSlice';
import {selectSelectedPlace} from '../google/googleSlice';
import { defaultDevicesInfo, queryUserDevices, queryUserInfo, UserDevicesInfo } from '../../utils/QueryUserInfo';
import { formatErrors } from '../../utils/ErrorObject';
import {selectPlacesInfoFromDatabase, selectPlacesInfoErrors} from '../places/placesSlice';


const ModalHeader = (props: {placeName: string}) =>
    <Modal.Header closeButton>
        <Modal.Title>Add a measurement for {props.placeName}</Modal.Title>
    </Modal.Header>


interface CreateNewMeasurementProps {
    showCreateNewMeasurement: boolean,
    setShowCreateNewMeasurement: React.Dispatch<React.SetStateAction<boolean>>
}

const renderSelectDeviceDropdown = () => {

    return (
        <>

        </>

    );
}

const renderErrors = (errorState: string) => {
    if (errorState === '') {
        return null;
    }
    return (
        <div>
            {errorState}
        </div>
    )
}

const hideHandler = (setShowCreateNewMeasurement: React.Dispatch<React.SetStateAction<boolean>>) => {
    setShowCreateNewMeasurement(false);
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
    })


    return (
        <>
            <Modal show={props.showCreateNewMeasurement} onHide={() => hideHandler(props.setShowCreateNewMeasurement)}>
                <ModalHeader placeName={placeName}/>
                <Modal.Body>
                    {renderErrors(errorState)}
                    {renderSelectDeviceDropdown()}
                </Modal.Body>
            </Modal>

        </>
    )
}