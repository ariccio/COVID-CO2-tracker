import React from 'react';
import {useSelector, useDispatch} from 'react-redux';
import {Modal, Button, Form} from 'react-bootstrap';
import {useLocation, useHistory} from 'react-router-dom';
import {setEnteredDeviceSerialNumberText, selectEnteredDeviceSerialNumberText} from './creationSlice';
import {selectSelectedModel, selectSelectedModelName, setSelectedModelName, setSelectedModel, setSelectedDevice, setSelectedDeviceSerialNumber} from '../deviceModels/deviceModelsSlice';
import { ErrorObjectType, formatErrors } from '../../utils/ErrorObject';
import { API_URL } from '../../utils/UrlPath';
import { postRequestOptions } from '../../utils/DefaultRequestOptions';
import { fetchJSONWithChecks } from '../../utils/FetchHelpers';


interface NewDeviceResponse {
    serial: string,
    model_id: number,
    user_id: number,
    device_id: number,
    errors?: Array<ErrorObjectType>
}

const NEW_DEVICE_URL = (API_URL + '/device');

function newDeviceRequestInit(newDeviceSerialNumber: string, deviceModelID: number): RequestInit {
    const defaultOptions = postRequestOptions();
    const newOptions = {
        ...defaultOptions,
        body: JSON.stringify({
            device: {
                serial: newDeviceSerialNumber,
                model_id: deviceModelID
            }
        })
    };
    return newOptions;
}

const ModalHeader = (modelName: string) =>
    <Modal.Header closeButton>
        <Modal.Title>Enter serial number of your {modelName}</Modal.Title>
    </Modal.Header>


export interface CreateMyDeviceInstanceProps {
    showAddDeviceInstance: boolean,
    setShowAddDeviceInstance: React.Dispatch<React.SetStateAction<boolean>>
}

async function createNewDevice(newDeviceSerialNumber: string, deviceModelID: number): Promise<NewDeviceResponse> {
    const ri = newDeviceRequestInit(newDeviceSerialNumber, deviceModelID);

    const fetchFailedCallback = async (awaitedResponse: Response): Promise<NewDeviceResponse> => {
        console.error("failed to add a new device!");
        return awaitedResponse.json();
    }

    const fetchSuccessCallback = async (awaitedResponse: Response): Promise<NewDeviceResponse> => {
        return awaitedResponse.json();
    }
    // instead of alert, we need to handle this in the modal.
    const result = fetchJSONWithChecks(NEW_DEVICE_URL, ri, 201, true, fetchFailedCallback, fetchSuccessCallback) as Promise<NewDeviceResponse>;
    return result;
}

const submitHandler = (enteredDeviceSerialNumberText: string, setShowAddDeviceInstance: React.Dispatch<React.SetStateAction<boolean>>, history: ReturnType<typeof useHistory>, selectedModel: number, dispatch: ReturnType<typeof useDispatch>, location: ReturnType<typeof useLocation>) => {
    const result = createNewDevice(enteredDeviceSerialNumberText, selectedModel);
    result.then((response) => {
        if (response.errors !== undefined) {
            alert(formatErrors(response.errors));
            return;
        }

        console.assert(response.model_id === selectedModel);
        dispatch(setSelectedDevice(response.device_id));
        dispatch(setSelectedDeviceSerialNumber(response.serial));
        setShowAddDeviceInstance(false);
        if (location.pathname.endsWith('create')) {
            history.goBack();
        }
    })
}

const onChangeEvent = (event: React.FormEvent<HTMLFormElement>, dispatch: any) => {
    const text = (event.currentTarget.elements[0] as HTMLInputElement).value;
    dispatch(setEnteredDeviceSerialNumberText(text));
}

const onSubmitEvent = (event: React.FormEvent<HTMLFormElement>, enteredDeviceSerialNumberText: string, setShowAddDeviceInstance: React.Dispatch<React.SetStateAction<boolean>>, history: ReturnType<typeof useHistory>, selectedModel: number, dispatch: ReturnType<typeof useDispatch>, location: ReturnType<typeof useLocation>) => {
    event.stopPropagation();
    event.preventDefault();
    //submitH();
    submitHandler(enteredDeviceSerialNumberText, setShowAddDeviceInstance, history, selectedModel, dispatch, location);
}

const cancelHandler = (event: React.MouseEvent<HTMLElement, MouseEvent>, setShowAddDeviceInstance: React.Dispatch<React.SetStateAction<boolean>>, history: ReturnType<typeof useHistory>) => {
    setShowAddDeviceInstance(false);
    history.goBack();
}

const submit = (event: React.MouseEvent<HTMLElement, MouseEvent>, enteredDeviceSerialNumberText: string, setShowAddDeviceInstance: React.Dispatch<React.SetStateAction<boolean>>, history: ReturnType<typeof useHistory>, selectedModel: number, dispatch: ReturnType<typeof useDispatch>, location: ReturnType<typeof useLocation>) => {
    event.stopPropagation();
    event.preventDefault();
    submitHandler(enteredDeviceSerialNumberText, setShowAddDeviceInstance, history, selectedModel, dispatch, location);
}

export const CreateMyDeviceInstance: React.FC<CreateMyDeviceInstanceProps> = (props: CreateMyDeviceInstanceProps) => {
    const selectedModel = useSelector(selectSelectedModel);
    const selectedModelName = useSelector(selectSelectedModelName);
    const enteredDeviceSerialNumberText = useSelector(selectEnteredDeviceSerialNumberText);

    const history = useHistory();
    const dispatch = useDispatch();
    const location = useLocation();

    //TODO: this is not how you do nested routes.
    if (location.pathname.endsWith('create')) {
        props.setShowAddDeviceInstance(true);
    }

    if (selectedModel === -1) {
        props.setShowAddDeviceInstance(false);
        if (location.pathname.endsWith('create')) {
            alert("select a model first!");
            history.goBack();
        }
        return null;
    }

    return (
        <>
            <Modal show={props.showAddDeviceInstance} onHide={() => {dispatch(setSelectedModel(-1)); dispatch(setSelectedModelName(''));}}>
                {ModalHeader(selectedModelName)}
                <Modal.Body>
                    <Form noValidate onChange={(event) => onChangeEvent(event, dispatch)} onSubmit={(event) => onSubmitEvent(event, enteredDeviceSerialNumberText, props.setShowAddDeviceInstance, history, selectedModel, dispatch, location)}>
                        <Form.Label>
                            You're almost there! Enter serial number:
                        </Form.Label>
                        <Form.Control type="text" placeholder="1234567890"/>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={(event) => cancelHandler(event, props.setShowAddDeviceInstance, history)}>
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={(event) => submit(event, enteredDeviceSerialNumberText, props.setShowAddDeviceInstance, history, selectedModel, dispatch, location)}>
                        Add new {selectedModelName}
                    </Button>
                </Modal.Footer>

            </Modal>
        </>
    );
}