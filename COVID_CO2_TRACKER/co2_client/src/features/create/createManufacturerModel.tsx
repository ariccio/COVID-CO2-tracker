import React, {useEffect, useState} from 'react';
import {Dropdown} from 'react-bootstrap';

import {API_URL} from '../../utils/UrlPath';
import {userRequestOptions} from '../../utils/DefaultRequestOptions';
import {formatErrors} from '../../utils/ErrorObject';

interface CreateManufacturerOrModelProps {

}

interface EachManufacturer {
    name: string,
    id: number
}

interface ManufacturersArray {
    manufacturers: Array<EachManufacturer>
}

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
    if (response.errors !== undefined) {
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


export const CreateManufacturerOrModel: React.FC<CreateManufacturerOrModelProps> = () => {

    const [knownManufacturers, setKnownManufacturers] = useState({} as ManufacturersArray);
    useEffect(() => {
        const getAllManufacturersPromise = queryManufacturers();
        getAllManufacturersPromise.then(result => {
            setKnownManufacturers(result);
        })
    },[])

    return (
        <>
            <Dropdown>
                <Dropdown.Toggle variant="success" id="dropdown-basic">
                    Select manufacturer
                </Dropdown.Toggle>
            </Dropdown>
        </>
    )
}