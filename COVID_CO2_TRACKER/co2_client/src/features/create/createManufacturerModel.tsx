import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {Modal, Button, Form} from 'react-bootstrap';

import {ManufacturerDeviceModelsTable} from '../deviceModels/DeviceModelsTable';

import {API_URL} from '../../utils/UrlPath';
import {postRequestOptions, userRequestOptions} from '../../utils/DefaultRequestOptions';
import {formatErrors, ErrorObjectType} from '../../utils/ErrorObject';

import {setEnteredManufacturerText, setManufacturerFeedbackText} from './creationSlice';
import {selectEnteredManufacturerText, selectManufacturerFeedbackText} from './creationSlice';


import {ManufacturerModelInfo, SingleManufacturerInfo} from '../manufacturers/manufacturerSlice';

import {ManufacturersArray} from '../manufacturers/Manufacturers';




interface NewManufacturerResponse {
    name: string,
    id: number,
    errors?: any
}


const MANUFACTURERS_URL = API_URL + '/manufacturers';

function responseToManufacturersArrayStrongType(response: any): ManufacturersArray {
    console.assert(response.manufacturers !== undefined);
    if (response.manufacturers !== undefined) {
        if (response.manufacturers.length > 0) {
            //https://app.codacy.com/gh/ariccio/COVID-CO2-tracker/file/53649034797/issues/source?bid=22403719&fileBranchId=22403719#l43
            //https://stackoverflow.com/a/55701580/625687
            for (let i = 0; i < parseInt(response.manufacturers.length); ++i) {
                console.assert(response.manufacturers[i].name !== undefined);
                console.assert(response.manufacturers[i].id !== undefined);
            }
        }
    }
    return response;
}

interface withErrors {
    errors?: Array<ErrorObjectType>
}

type SingleManufacturerInfoReturnType = SingleManufacturerInfo & withErrors;


function manufacturerInfoResponseToStrongType(response: any): SingleManufacturerInfoReturnType {
    console.assert(response.manufacturer_id !== undefined);
    console.assert(response.name !== undefined);
    console.assert(response.models !== undefined);
    if (response.models.length === undefined) {
        throw new Error("missing property length!");
    }
    for (let i = 0; i < parseInt(response.models.length); i++) {
        console.assert(response.models[i].model_id !== undefined);
        console.assert(response.models[i].name !== undefined);
        console.assert(response.models[i].count !== undefined);
    }
    return response;
}


export async function queryManufacturerInfo(manufacturer_id: number): Promise<SingleManufacturerInfoReturnType> {
    // if (manufacturer_id === '-1') {
    //     return null;
    // }
    const MANUFACTURER_SHOW_URL = (MANUFACTURERS_URL + `/${manufacturer_id}`);
    const rawResponse: Promise<Response> = fetch(MANUFACTURER_SHOW_URL, userRequestOptions() );
    const awaitedResponse = await rawResponse;
    const jsonResponse = await awaitedResponse.json();
    const response = await jsonResponse;
    if ((response.errors !== undefined) || (awaitedResponse.status !== 200)) {
        if (awaitedResponse.status !== 200) {
            console.warn(`server returned a response (${awaitedResponse.status}) with a status field, and it wasn't a 200 (OK) status.`);
        }
        if (response.errors !== undefined) {
            console.error(formatErrors(response.errors));
            alert(formatErrors(response.errors));
            return manufacturerInfoResponseToStrongType(response);
        }
        debugger;
        throw new Error("hmm");
        // return null;
    }
    
    // debugger;
    return manufacturerInfoResponseToStrongType(response);
}


export async function queryManufacturers(): Promise<ManufacturersArray> {
    const ALL_MANUFACTURERS_URL = (API_URL + '/all_manufacturers');
    const rawResponse: Promise<Response> = fetch(ALL_MANUFACTURERS_URL, userRequestOptions() );
    const awaitedResponse = await rawResponse;
    const jsonResponse = await awaitedResponse.json();
    const response = await jsonResponse;
    if ((response.errors !== undefined) || (awaitedResponse.status !== 200)) {
        if (awaitedResponse.status !== 200) {
            console.warn(`server returned a response (${awaitedResponse.status}) with a status field, and it wasn't a 200 (OK) status.`);
        }
        if (response.errors !== undefined) {
            console.error(formatErrors(response.errors));
            alert(formatErrors(response.errors));
        }
        debugger;
        throw new Error("hmm");
    }
    return responseToManufacturersArrayStrongType(response);
}

function newManufacturerRequestInit(newManufacturerName: string): RequestInit {
    const defaultOptions = postRequestOptions();
    const newOptions = {
        ...defaultOptions,
        body: JSON.stringify({
            manufacturer: {
                name: newManufacturerName
            }
        })
    }
    return newOptions;
}

function responseToNewManufacturerStrongType(response: any): NewManufacturerResponse {
    console.assert(response.name !== undefined);
    console.assert(response.id !== undefined);
    return response;
}

async function createNewManufacturer(name: string): Promise<NewManufacturerResponse> {
    const rawResponse: Promise<Response> = fetch(MANUFACTURERS_URL, newManufacturerRequestInit(name));
    const awaitedResponse = await rawResponse;
    const jsonResponse = await awaitedResponse.json();
    const response = await jsonResponse;
    if ((response.errors !== undefined) || (awaitedResponse.status !== 201)) {
        if (response.status !== 201) {
            console.warn(`server returned a response (${awaitedResponse.status}) with a status field, and it wasn't a 201 (CREATED) status.`);
        }
        if (response.errors !== undefined) {
            console.error(formatErrors(response.errors));
            alert(formatErrors(response.errors));
        }
        debugger;
        // throw new Error("hmm");
    }
    return responseToNewManufacturerStrongType(response);
}




interface manufacturerDialogProps {
    showAddManufacturer: boolean,
    setShowAddManufacturer: React.Dispatch<React.SetStateAction<boolean>>
}


export const CreateManufacturerModalDialog: React.FC<manufacturerDialogProps> = (props: manufacturerDialogProps) => {
    const enteredManufacturerText = useSelector(selectEnteredManufacturerText);
    const dispatch = useDispatch();
    // const [enteredManufacturerText, setEnteredManufacturerText] = useState("");
    const feedbackText = useSelector(selectManufacturerFeedbackText);
    // const [feedbackText, setFeedbackText] = useState("");

    const submitHandler = () => {
        const result = createNewManufacturer(enteredManufacturerText);
        result.then((response) => {
            if (response.errors !== undefined) {
                dispatch(setManufacturerFeedbackText(formatErrors(response.errors)));
                debugger;
            }
            else {
                props.setShowAddManufacturer(false)
            }
        })

    }

    const submit = (event: React.MouseEvent<HTMLElement, MouseEvent>) => {
        event.stopPropagation();
        submitHandler();
    }
    const onChangeEvent = (event: React.FormEvent<HTMLFormElement>) => {
        const text = (event.currentTarget.elements[0] as HTMLInputElement).value;
        dispatch(setEnteredManufacturerText(text));
    }

    const onSubmitEvent = (event: React.FormEvent<HTMLFormElement>) => {
        event.stopPropagation();
        submitHandler();
        debugger;
    }

    return (
        <Modal show={props.showAddManufacturer} onHide={() => props.setShowAddManufacturer(false)}>
            <Modal.Header closeButton>
                <Modal.Title>Add a manufacturer to the database</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                (Please reduce administrative burden, don't add nuisance manufacturers. TODO: styling this text)
                <Form onChange={onChangeEvent} onSubmit={onSubmitEvent}>
                    <Form.Label>
                        Manufacturer name
                    </Form.Label>
                    <Form.Control type="text" placeholder="Contoso"></Form.Control>
                    <Form.Control.Feedback>{feedbackText}</Form.Control.Feedback>
                </Form>
            </Modal.Body>

            <Modal.Footer>
                <Button variant="secondary" onClick={() => props.setShowAddManufacturer(false)}>
                    Cancel
                </Button>
                <Button variant="primary" onClick={(event) => submit(event)}>
                    Submit new manufacturer
                </Button>
            </Modal.Footer>

        </Modal>
    )

}



// export const Manufacturers: React.FC<{}> = () => {

//     return (
//         <>

//         </>
//     )

// }
