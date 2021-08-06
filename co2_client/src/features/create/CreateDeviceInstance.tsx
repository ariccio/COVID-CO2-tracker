import React, {Suspense, useState} from 'react';
import {useSelector, useDispatch} from 'react-redux';
import {Modal, Button, Form, Spinner} from 'react-bootstrap';
import {useLocation, useHistory} from 'react-router-dom';

import { useTranslation } from 'react-i18next';

import {setEnteredDeviceSerialNumberText, selectEnteredDeviceSerialNumberText} from './creationSlice';
import {selectSelectedModel, selectSelectedModelName, setSelectedDevice, setSelectedDeviceSerialNumber} from '../deviceModels/deviceModelsSlice';
import { ErrorObjectType, formatErrors } from '../../utils/ErrorObject';
import { API_URL } from '../../utils/UrlPath';
import { postRequestOptions } from '../../utils/DefaultRequestOptions';
import { fetchJSONWithChecks } from '../../utils/FetchHelpers';
import { profilePath } from '../../paths/paths';


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

const ModalHeader = (props: {modelName: string}) => {
    const [translate] = useTranslation();
    return (
        <Modal.Header closeButton>
            <Modal.Title>{translate('enter-serial-number')} {props.modelName}</Modal.Title>
        </Modal.Header>
    );
}


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
    const result = fetchJSONWithChecks(NEW_DEVICE_URL, ri, 201, false, fetchFailedCallback, fetchSuccessCallback) as Promise<NewDeviceResponse>;
    return result;
}

const submitHandler = (enteredDeviceSerialNumberText: string, setShowAddDeviceInstance: React.Dispatch<React.SetStateAction<boolean>>, history: ReturnType<typeof useHistory>, selectedModel: number, dispatch: ReturnType<typeof useDispatch>, location: ReturnType<typeof useLocation>, setShowSubmit: React.Dispatch<React.SetStateAction<boolean>>, setSubmitting: React.Dispatch<React.SetStateAction<boolean>>) => {
    setShowSubmit(false);
    setSubmitting(true);
    const result = createNewDevice(enteredDeviceSerialNumberText, selectedModel);
    result.then((response) => {
        setShowSubmit(true);
        setSubmitting(false);
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
        history.push(profilePath);
    })
    //TODO: catch? Remember to toggele submitting and showsubmit!
}

const onChangeEvent = (event: React.FormEvent<HTMLFormElement>, dispatch: any) => {
    const text = (event.currentTarget.elements[0] as HTMLInputElement).value;
    dispatch(setEnteredDeviceSerialNumberText(text));
}

const onSubmitEvent = (event: React.FormEvent<HTMLFormElement>, enteredDeviceSerialNumberText: string, setShowAddDeviceInstance: React.Dispatch<React.SetStateAction<boolean>>, history: ReturnType<typeof useHistory>, selectedModel: number, dispatch: ReturnType<typeof useDispatch>, location: ReturnType<typeof useLocation>, setShowSubmit: React.Dispatch<React.SetStateAction<boolean>>, setSubmitting: React.Dispatch<React.SetStateAction<boolean>>) => {
    event.stopPropagation();
    event.preventDefault();
    //submitH();
    submitHandler(enteredDeviceSerialNumberText, setShowAddDeviceInstance, history, selectedModel, dispatch, location, setShowSubmit, setSubmitting);
}

const cancelHandler = (event: React.MouseEvent<HTMLElement, MouseEvent>, setShowAddDeviceInstance: React.Dispatch<React.SetStateAction<boolean>>, history: ReturnType<typeof useHistory>) => {
    setShowAddDeviceInstance(false);
    // history.goBack();
}

const submit = (event: React.MouseEvent<HTMLElement, MouseEvent>, enteredDeviceSerialNumberText: string, setShowAddDeviceInstance: React.Dispatch<React.SetStateAction<boolean>>, history: ReturnType<typeof useHistory>, selectedModel: number, dispatch: ReturnType<typeof useDispatch>, location: ReturnType<typeof useLocation>, setShowSubmit: React.Dispatch<React.SetStateAction<boolean>>, setSubmitting: React.Dispatch<React.SetStateAction<boolean>>) => {
    event.stopPropagation();
    event.preventDefault();
    submitHandler(enteredDeviceSerialNumberText, setShowAddDeviceInstance, history, selectedModel, dispatch, location, setShowSubmit, setSubmitting);
}

//TODO: extract logic
const submitOrSpinning = (submitting: boolean, translate: any) => {
    if (!submitting) {
        return (
            <>
                {translate('Add new')}
            </>
        )
    }
    return (
        <>
            <Spinner animation="border" role="status">
                  <span className="visually-hidden">
                      {translate('creating-device')}
                  </span>
            </Spinner>
        </>
    )
}


export const CreateMyDeviceInstance: React.FC<CreateMyDeviceInstanceProps> = (props: CreateMyDeviceInstanceProps) => {
    const selectedModel = useSelector(selectSelectedModel);
    const selectedModelName = useSelector(selectSelectedModelName);
    const enteredDeviceSerialNumberText = useSelector(selectEnteredDeviceSerialNumberText);

    const history = useHistory();
    const dispatch = useDispatch();
    const location = useLocation();
    const [translate] = useTranslation();
    const [showSubmit, setShowSubmit] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    //TODO: this is not how you do nested routes.
    if (location.pathname.endsWith('create')) {
        props.setShowAddDeviceInstance(true);
    }

    if (selectedModel === -1) {
        props.setShowAddDeviceInstance(false);
        if (location.pathname.endsWith('create')) {
            alert(translate('select-model-first'));
            history.goBack();
        }
        return null;
    }

    return (
        <>
            <Modal show={props.showAddDeviceInstance} onHide={() => {props.setShowAddDeviceInstance(false)}}>
                <Suspense fallback="loading translation...">
                    <ModalHeader modelName={selectedModelName}/>
                </Suspense>
                <Modal.Body>
                    <Form noValidate onChange={(event) => onChangeEvent(event, dispatch)} onSubmit={(event) => onSubmitEvent(event, enteredDeviceSerialNumberText, props.setShowAddDeviceInstance, history, selectedModel, dispatch, location, setShowSubmit, setSubmitting)}>
                        <Form.Label>
                            {translate('almost-there-serial')}
                        </Form.Label>
                        <Form.Control type="text" placeholder="1234567890"/>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={(event) => cancelHandler(event, props.setShowAddDeviceInstance, history)}>
                        {translate('Cancel')}
                    </Button>
                    <Button variant="primary" disabled={!showSubmit} onClick={(event) => submit(event, enteredDeviceSerialNumberText, props.setShowAddDeviceInstance, history, selectedModel, dispatch, location, setShowSubmit, setSubmitting)}>
                        {submitOrSpinning(submitting, translate)} {selectedModelName}
                    </Button>
                </Modal.Footer>

            </Modal>
        </>
    );
}