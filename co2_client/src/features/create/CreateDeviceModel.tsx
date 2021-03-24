import React from 'react';
import {useSelector, useDispatch} from 'react-redux';
import {Modal, Button, Form} from 'react-bootstrap';
import {useLocation, useHistory} from 'react-router-dom'
import {selectSelectedManufacturer} from '../manufacturers/manufacturerSlice';
import {setEnteredModelText, selectEnteredModelText} from '../create/creationSlice';
import {setSelectedModel, setSelectedModelName} from '../deviceModels/deviceModelsSlice';
import {postRequestOptions} from '../../utils/DefaultRequestOptions';
import { fetchJSONWithChecks } from '../../utils/FetchHelpers';

import {ErrorObjectType, formatErrors} from '../../utils/ErrorObject';

import {API_URL} from '../../utils/UrlPath';

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

const ModalHeader = () =>
    <Modal.Header closeButton>
        <Modal.Title>Add a model to the database</Modal.Title>
    </Modal.Header>


const hideHandler = (setShowAddModel: React.Dispatch<React.SetStateAction<boolean>>, history: ReturnType<typeof useHistory>) => {
    setShowAddModel(false);
    history.goBack();
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

const submitHandler = (enteredModelText: string, setShowAddModel: React.Dispatch<React.SetStateAction<boolean>>, history: ReturnType<typeof useHistory>, selectedManufacturer: number, dispatch: ReturnType<typeof useDispatch>) => {
    const result = createNewModel(enteredModelText, selectedManufacturer);
    result.then((response) => {
        if (response.errors !== undefined) {
            alert(formatErrors(response.errors));
        }
        else {
            setShowAddModel(false);
            dispatch(setSelectedModel(response.model_id));
            dispatch(setSelectedModelName(response.name));
            history.goBack();

        }
    }).catch((errors) => {
        alert(errors.message)
    })
}

const onSubmitEvent = (event: React.FormEvent<HTMLFormElement>, enteredModelText: string, setShowAddModel: React.Dispatch<React.SetStateAction<boolean>>, history: ReturnType<typeof useHistory>, selectedManufacturer: number, dispatch: ReturnType<typeof useDispatch>) => {
    event.stopPropagation();
    event.preventDefault();
    submitHandler(enteredModelText, setShowAddModel, history, selectedManufacturer, dispatch);
    // debugger;
}


const cancelHandler = (event: React.MouseEvent<HTMLElement, MouseEvent>, setShowAddModel: React.Dispatch<React.SetStateAction<boolean>>, history: ReturnType<typeof useHistory>) => {
    // event.stopPropagation();
    // event.preventDefault();
    setShowAddModel(false);
    history.goBack();
}

const submit = (event: React.MouseEvent<HTMLElement, MouseEvent>, enteredModelText: string, setShowAddModel: React.Dispatch<React.SetStateAction<boolean>>, history: ReturnType<typeof useHistory>, selectedManufacturer: number, dispatch: ReturnType<typeof useDispatch>) => {
    event.stopPropagation();
    event.preventDefault();
    submitHandler(enteredModelText, setShowAddModel, history, selectedManufacturer, dispatch);
}


export const CreateDeviceModelModalDialog: React.FC<modelDialogProps> = (props: modelDialogProps) => {
    const history = useHistory();
    const dispatch = useDispatch();
    const location = useLocation();

    const selectedManufacturer = useSelector(selectSelectedManufacturer);
    const enteredModelText = useSelector(selectEnteredModelText);

    //TODO: this is not how you do nested routes.
    if (location.pathname.endsWith('create')) {
        props.setShowAddModel(true);
    }


    if (selectedManufacturer === null) {
        alert("Select a manufacturer first!");
        props.setShowAddModel(false);
        if (location.pathname.endsWith('create')) {
            debugger;
            history.replace('/');
        }
        return null;
    }
    return (
        <>
            <Modal show={props.showAddModel} onHide={() => hideHandler(props.setShowAddModel, history)}>
                <ModalHeader/>
                <Modal.Body>
                    (Please reduce administrative burden, don't add nuisance models. TODO: styling this text)
                    <Form noValidate onChange={(event) => onChangeEvent(event, dispatch)} onSubmit={(event) => onSubmitEvent(event, enteredModelText, props.setShowAddModel, history, selectedManufacturer, dispatch)}>
                        <Form.Label>
                            Model name
                        </Form.Label>
                        <Form.Control type="text" placeholder="some model name..."/>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={(event) => cancelHandler(event, props.setShowAddModel, history)}>
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={(event) => submit(event, enteredModelText, props.setShowAddModel, history, selectedManufacturer, dispatch)}>
                        Submit new model
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}