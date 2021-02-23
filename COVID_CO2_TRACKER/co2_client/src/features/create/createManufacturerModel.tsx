import React, {useEffect, useState} from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {Dropdown, Modal, Button, Form} from 'react-bootstrap';

import {API_URL} from '../../utils/UrlPath';
import {postRequestOptions, userRequestOptions} from '../../utils/DefaultRequestOptions';
import {formatErrors} from '../../utils/ErrorObject';

import {setEnteredManufacturerText, setManufacturerFeedbackText} from './creationSlice';
import {selectEnteredManufacturerText, selectManufacturerFeedbackText} from './creationSlice';

interface CreateManufacturerOrModelProps {

}


interface EachManufacturer {
    name: string,
    id: number
}

interface ManufacturersArray {
    manufacturers: Array<EachManufacturer>
}

const defaultManufacturersArray: ManufacturersArray = {
    manufacturers: []
}

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
            for (let i = 0; i < response.manufacturers.length; ++i) {
                console.assert(response.manufacturers[i].name !== undefined);
                console.assert(response.manufacturers[i].id !== undefined);
            }
        }
    }
    return response;
}


async function queryManufacturers(): Promise<ManufacturersArray> {
    const ALL_MANUFACTURERS_URL = (API_URL + '/all_manufacturers');
    const rawResponse: Promise<Response> = fetch(ALL_MANUFACTURERS_URL, userRequestOptions() );
    const awaitedResponse = await rawResponse;
    const jsonResponse = await awaitedResponse.json();
    const response = await jsonResponse;
    if ((response.errors !== undefined) || (response.status !== 200)) {
        if (response.status !== 200) {
            console.warn("server returned a response with a status field, and it wasn't a 200 (OK) status.");
        }
        console.error(formatErrors(response.errors));
        alert(formatErrors(response.errors));
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
    if ((response.errors !== undefined) || (response.status !== 201)) {
        if (response.status !== 201) {
            console.warn("server returned a response with a status field, and it wasn't a 201 (CREATED) status.");
        }
        console.error(formatErrors(response.errors));
        alert(formatErrors(response.errors));
        debugger;
        // throw new Error("hmm");
    }
    return responseToNewManufacturerStrongType(response);
}


function dropdownItemRowKey(manufacturer: EachManufacturer): string {
    return `rowkey-${manufacturer.name}-${manufacturer.id}-create-dropdown`;
}

function manufacturersToDropdown(manufacturers_: ManufacturersArray) {
    const manufacturers = manufacturers_.manufacturers;
    return manufacturers.map((manufacturer: EachManufacturer, index: number) => {
        return (
            <Dropdown.Item eventKey={`${manufacturer.id}`} key={dropdownItemRowKey(manufacturer)}>{manufacturer.name}</Dropdown.Item>
        )
    })
}

interface manufacturerDialogProps {
    showAddManufacturer: boolean,
    setShowAddManufacturer: React.Dispatch<React.SetStateAction<boolean>>
}

const CreateManufacturerModalDialog: React.FC<manufacturerDialogProps> = (props: manufacturerDialogProps) => {
    const enteredManufacturerText = useSelector(selectEnteredManufacturerText);
    const dispatch = useDispatch();
    // const [enteredManufacturerText, setEnteredManufacturerText] = useState("");
    const feedbackText = useSelector(selectManufacturerFeedbackText);
    // const [feedbackText, setFeedbackText] = useState("");
    const submit = () => {
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
    return (
        <Modal show={props.showAddManufacturer} onHide={() => props.setShowAddManufacturer(false)}>
            <Modal.Header closeButton>
                <Modal.Title>Add a manufacturer to the database</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                (Please reduce administrative burden, don't add nuisance manufacturers. TODO: styling this text)
                <Form onChange={(event: React.FormEvent<HTMLFormElement>) => {
                    const text = (event.currentTarget.elements[0] as HTMLInputElement).value;
                    dispatch(setEnteredManufacturerText(text));
                }}>
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
                <Button variant="primary" onClick={() => submit()}>
                    Submit new manufacturer
                </Button>
            </Modal.Footer>

        </Modal>
    )

}

// const CreateManufacturer: React.FC<

export const CreateManufacturerOrModel: React.FC<CreateManufacturerOrModelProps> = () => {

    const [knownManufacturers, setKnownManufacturers] = useState(defaultManufacturersArray);
    const [showAddManufacturer, setShowAddManufacturer] = useState(false);

    //This should be in redux
    const [selectedManufacturer, setSelectedManufacturer] = useState("");

    useEffect(() => {
        const getAllManufacturersPromise = queryManufacturers();
        getAllManufacturersPromise.then(result => {
            setKnownManufacturers(result);
        })
    },[showAddManufacturer])

    const selectManufacturerHandler = (eventKey: any, event: Object) => {
        if (eventKey === "-1") {
            setShowAddManufacturer(true);
            return;
        }
        setSelectedManufacturer(eventKey)
    }
    return (
        <>
            <CreateManufacturerModalDialog showAddManufacturer={showAddManufacturer} setShowAddManufacturer={setShowAddManufacturer}/>
            <Dropdown onSelect={selectManufacturerHandler}>
                <Dropdown.Toggle variant="success" id="dropdown-basic">
                    Select manufacturer:
                </Dropdown.Toggle>
                <Dropdown.Menu>
                    {manufacturersToDropdown(knownManufacturers)}
                    <Dropdown.Item eventKey={"-1"}>Create new manufacturer</Dropdown.Item>
                </Dropdown.Menu>
            </Dropdown>
        </>
    )
}