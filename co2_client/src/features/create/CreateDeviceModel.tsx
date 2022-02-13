import React, {Suspense, useState} from 'react';
import {useSelector, useDispatch} from 'react-redux';
import {Modal, Button, Form, Spinner} from 'react-bootstrap';
import {useLocation, useNavigate} from 'react-router-dom'


import { useTranslation } from 'react-i18next';


import {selectSelectedManufacturer} from '../manufacturers/manufacturerSlice';
import {setEnteredModelText, selectEnteredModelText} from '../create/creationSlice';
import {setSelectedModel, setSelectedModelName} from '../deviceModels/deviceModelsSlice';
import {postRequestOptions} from '../../utils/DefaultRequestOptions';
import { fetchJSONWithChecks } from '../../utils/FetchHelpers';

import {ErrorObjectType, formatErrors} from '../../utils/ErrorObject';

import {API_URL} from '../../utils/UrlPath';
import { AppDispatch } from '../../app/store';

interface modelDialogProps {
    showAddModel: boolean,
    setShowAddModel: React.Dispatch<React.SetStateAction<boolean>>
}

interface NewModelResponse {
    model_id: number,
    manufacturer_id: number,
    name: string,
    errors?: Array<ErrorObjectType>
}

function responseToNewModelStrongType(response: any): NewModelResponse {
    console.assert(response.model_id !== undefined);
    console.assert(typeof response.model_id === 'number');
    console.assert(response.manufacturer_id !== undefined);
    console.assert(response.name !== undefined);
    if (response.errors !== undefined) {
        console.assert(response.errors !== null);
    }
    return response;
}

const ModalHeader = () => {
    const [translate] = useTranslation();
    return (
        <Modal.Header closeButton>
            <Modal.Title>{translate("add-model")}</Modal.Title>
        </Modal.Header>
    );
}


const hideHandler = (setShowAddModel: React.Dispatch<React.SetStateAction<boolean>>, navigate: ReturnType<typeof useNavigate>) => {
    setShowAddModel(false);
    navigate(-1);
}

const onChangeEvent = (event: React.FormEvent<HTMLFormElement>, dispatch: any) => {
    const text = (event.currentTarget.elements[0] as HTMLInputElement).value;
    dispatch(setEnteredModelText(text));
}

const NEW_MODEL_URL = (API_URL + '/model');

function newModelRequestInit(newModelName: string, manufacturer_id: number): RequestInit {
    const defaultOptions = postRequestOptions();
    const newOptions = {
        ...defaultOptions,
        body: JSON.stringify({
            model: {
                manufacturer_id: manufacturer_id,
                name: newModelName
            }
        })
    }
    return newOptions;
}


async function createNewModel(name: string, manufacturer: number): Promise<NewModelResponse> {
    const fetchFailedCallback = async (awaitedResponse: Response): Promise<NewModelResponse> => {
        console.error("failed to create new model");
        return responseToNewModelStrongType(await awaitedResponse.json());
    }
    const fetchSuccessCallback =  async (awaitedResponse: Response): Promise<NewModelResponse> => {
        return responseToNewModelStrongType(await awaitedResponse.json());
    }
    // instead of alert, we need to handle this in the modal.
    const result = fetchJSONWithChecks(NEW_MODEL_URL, newModelRequestInit(name, manufacturer), 201, true, fetchFailedCallback, fetchSuccessCallback) as Promise<NewModelResponse>;
    return result;
}

const submitHandler = (enteredModelText: string, setShowAddModel: React.Dispatch<React.SetStateAction<boolean>>, navigate: ReturnType<typeof useNavigate>, selectedManufacturer: number, dispatch: AppDispatch, setShowSubmit: React.Dispatch<React.SetStateAction<boolean>>, setSubmitting: React.Dispatch<React.SetStateAction<boolean>>) => {
    setShowSubmit(false);
    setSubmitting(true);

    const result = createNewModel(enteredModelText, selectedManufacturer);
    result.then((response) => {
        setShowSubmit(true);
        setSubmitting(false);
        if (response.errors !== undefined) {
            alert(`Create model errors: ${formatErrors(response.errors)}`);
        }
        else {
            setShowAddModel(false);
            dispatch(setSelectedModel(response.model_id));
            dispatch(setSelectedModelName(response.name));
            navigate(-1);

        }
    }).catch((errors) => {
        setShowSubmit(true);
        setSubmitting(false);
        alert(errors.message)
    })
}

const onSubmitEvent = (event: React.FormEvent<HTMLFormElement>, enteredModelText: string, setShowAddModel: React.Dispatch<React.SetStateAction<boolean>>, navigate: ReturnType<typeof useNavigate>, selectedManufacturer: number, dispatch: AppDispatch, setShowSubmit: React.Dispatch<React.SetStateAction<boolean>>, setSubmitting: React.Dispatch<React.SetStateAction<boolean>>) => {
    event.stopPropagation();
    event.preventDefault();
    submitHandler(enteredModelText, setShowAddModel, navigate, selectedManufacturer, dispatch, setShowSubmit, setSubmitting);
    // debugger;
}


const cancelHandler = (event: React.MouseEvent<HTMLElement, MouseEvent>, setShowAddModel: React.Dispatch<React.SetStateAction<boolean>>, navigate: ReturnType<typeof useNavigate>) => {
    // event.stopPropagation();
    // event.preventDefault();
    setShowAddModel(false);
    navigate(-1);
}

const submit = (event: React.MouseEvent<HTMLElement, MouseEvent>, enteredModelText: string, setShowAddModel: React.Dispatch<React.SetStateAction<boolean>>, navigate: ReturnType<typeof useNavigate>, selectedManufacturer: number, dispatch: AppDispatch, setShowSubmit: React.Dispatch<React.SetStateAction<boolean>>, setSubmitting: React.Dispatch<React.SetStateAction<boolean>>) => {
    event.stopPropagation();
    event.preventDefault();
    submitHandler(enteredModelText, setShowAddModel, navigate, selectedManufacturer, dispatch, setShowSubmit, setSubmitting);
}


//TODO: extract logic
const submitOrSpinning = (submitting: boolean, translate: any) => {
    if (!submitting) {
        return (
            <div>
                <span>
                    {translate('Create new model')}
                </span>
            </div>
        )
    }
    return (
        <div>
            <Spinner animation="border" role="status">
                  <span className="visually-hidden">
                      {translate("creating-model")}
                  </span>
            </Spinner>
        </div>
    )
}


export const CreateDeviceModelModalDialog: React.FC<modelDialogProps> = (props: modelDialogProps) => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const location = useLocation();
    const [translate] = useTranslation();
    const [showSubmit, setShowSubmit] = useState(true);
    const [submitting, setSubmitting] = useState(false);


    const selectedManufacturer = useSelector(selectSelectedManufacturer);
    const enteredModelText = useSelector(selectEnteredModelText);

    //TODO: this is not how you do nested routes.
    if (location.pathname.endsWith('create')) {
        props.setShowAddModel(true);
    }


    if (selectedManufacturer === null) {
        alert(translate("select-manufacturer-first"));
        props.setShowAddModel(false);
        if (location.pathname.endsWith('create')) {
            debugger;
            alert("TODO");
            // history.replace('/');
        }
        return null;
    }
    return (
        <div>
            <Modal show={props.showAddModel} onHide={() => hideHandler(props.setShowAddModel, navigate)}>
                <Suspense fallback="loading translations...">
                    <ModalHeader/>
                </Suspense>
                <Modal.Body>
                    (Please reduce administrative burden, don't add nuisance models. TODO: styling this text)
                    <Form noValidate onChange={(event) => onChangeEvent(event, dispatch)} onSubmit={(event) => onSubmitEvent(event, enteredModelText, props.setShowAddModel, navigate, selectedManufacturer, dispatch, setShowSubmit, setSubmitting)}>
                        <Form.Label>
                            <span>
                                {translate('Model name')}
                            </span>
                        </Form.Label>
                        <Form.Control type="text" placeholder="some model name..."/>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={(event) => cancelHandler(event, props.setShowAddModel, navigate)}>
                        <span>
                            {translate('Cancel')}
                        </span>
                    </Button>
                    <Button variant="primary" disabled={!showSubmit} onClick={(event) => submit(event, enteredModelText, props.setShowAddModel, navigate, selectedManufacturer, dispatch, setShowSubmit, setSubmitting)}>
                        {submitOrSpinning(submitting, translate)}
                        
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}