import React, {useEffect, useState} from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {Dropdown, Button} from 'react-bootstrap';
import {Link, useLocation} from 'react-router-dom';

import {ManufacturerDeviceModelsTable} from '../deviceModels/DeviceModelsTable';

import {ErrorObjectType, exceptionToErrorObject} from '../../utils/ErrorObject';

import {SingleManufacturerInfoResponse} from './manufacturerSlice';

import {setSelectedManufacturer} from './manufacturerSlice';
import {selectSelectedManufacturer} from './manufacturerSlice';

import {queryManufacturerInfo, queryManufacturers, CreateManufacturerModalDialog} from '../create/createManufacturerModel';


interface CreateManufacturerOrModelProps {

}

interface EachManufacturer {
    name: string,
    id: number
}

export interface ManufacturersArray {
    manufacturers: Array<EachManufacturer>,
    errors?: Array<ErrorObjectType>

}

const defaultManufacturersArray: ManufacturersArray = {
    manufacturers: []
}

// const CreateManufacturer: React.FC<
const initSingleManufactuerInfo: SingleManufacturerInfoResponse = {
    name: '',
    manufacturer_id: -1,
    models: []
}

function dropdownKeyToManufacturerID(eventKey: string): number | null {
    if (eventKey === "-1") {
        return null;
    }
    return parseInt(eventKey);
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


const getAndSetManufacturers = (setKnownManufacturers: React.Dispatch<React.SetStateAction<ManufacturersArray>>, setErrors: React.Dispatch<React.SetStateAction<ErrorObjectType[] | null>>) => {
    const getAllManufacturersPromise = queryManufacturers();
    getAllManufacturersPromise.then(result => {
        if (result.errors !== undefined) {
            setErrors(result.errors);
        }
        else {
            setKnownManufacturers(result);
        }
    }).catch((error) => {
        setErrors([exceptionToErrorObject(error)])
    })

}

const getSingleManufacturer = (selectedManufacturer: number | null, setManufacturerModels: React.Dispatch<React.SetStateAction<SingleManufacturerInfoResponse>>, setErrors: React.Dispatch<React.SetStateAction<ErrorObjectType[] | null>>) => {
    if ((selectedManufacturer !== null) && (selectedManufacturer !== -1)) {
        const getManufacturerInfoPromise = queryManufacturerInfo(selectedManufacturer);
        getManufacturerInfoPromise.then(manufacturerInfo => {
            if (manufacturerInfo.errors === undefined) {
                // debugger;
                setManufacturerModels(manufacturerInfo);
                return;
            }
            setErrors(manufacturerInfo.errors);
        }).catch((error) => {
            setErrors([exceptionToErrorObject(error)])
        }) 
    }

}

const selectManufacturerHandler = (eventKey: any, event: Object, setShowAddManufacturer: React.Dispatch<React.SetStateAction<boolean>>, dispatch: any
    ) => {
    if (eventKey === "-1") {
        console.log(`user selected create manufacturer`);
        setShowAddManufacturer(true);
        return;
    }
    const selected = dropdownKeyToManufacturerID(eventKey);
    if (selected !== null) {
        dispatch(setSelectedManufacturer(selected));
        console.log(`user selected manufactuer dropdown number: ${eventKey}`);
    }
}

const renderDropdown = (manufacturerModels: SingleManufacturerInfoResponse, setShowAddManufacturer: React.Dispatch<React.SetStateAction<boolean>>, knownManufacturers: ManufacturersArray, location: ReturnType<typeof useLocation>, dispatch: any) => 
    <Dropdown onSelect={(eventKey: any, event: Object) => {selectManufacturerHandler(eventKey, event, setShowAddManufacturer, dispatch)}}>
        <Dropdown.Toggle variant="success" id="dropdown-basic">
            {manufacturerModels.name === '' ? "Select manufacturer:" : manufacturerModels.name} 
        </Dropdown.Toggle>
        <Dropdown.Menu>
            {manufacturersToDropdown(knownManufacturers)}
            <Dropdown.Item eventKey={"-1"}>
                <Link to={{pathname: `/manufacturers/create`, state: {background: location}}}>
                    Create new manufacturer
                </Link>
            </Dropdown.Item>
        </Dropdown.Menu>
    </Dropdown>

const renderNewModelForManufacturer = (manufacturerModels: SingleManufacturerInfoResponse) => {
    if (manufacturerModels === initSingleManufactuerInfo) {
        return null;
    }
    return (
        <Button>
            Create new model for manufacturer {manufacturerModels.name}
        </Button>
    );

}


export const CreateManufacturerOrModel: React.FC<CreateManufacturerOrModelProps> = () => {
    let location = useLocation();
    const dispatch = useDispatch();

    const [knownManufacturers, setKnownManufacturers] = useState(defaultManufacturersArray);
    //TODO: this is not how you do nested routes.
    const [showAddManufacturer, setShowAddManufacturer] = useState(location.pathname.endsWith('create'));
    const [errors, setErrors] = useState(null as (Array<ErrorObjectType> | null));
    const [manufacturerModels, setManufacturerModels] = useState(initSingleManufactuerInfo as SingleManufacturerInfoResponse);
    const selectedManufacturer = useSelector(selectSelectedManufacturer);

    useEffect(() => {
        // console.log("change");
        getAndSetManufacturers(setKnownManufacturers, setErrors);
    },[showAddManufacturer])

    useEffect(() => {
        getSingleManufacturer(selectedManufacturer, setManufacturerModels, setErrors);
    }, [selectedManufacturer])

    return (
        <>
            {(showAddManufacturer) ? <CreateManufacturerModalDialog showAddManufacturer={showAddManufacturer} setShowAddManufacturer={setShowAddManufacturer}/> : null}
            {renderDropdown(manufacturerModels, setShowAddManufacturer, knownManufacturers, location, dispatch)}
            <br/>
            <br/>
            <br/>
            {errors === null ? <ManufacturerDeviceModelsTable models={manufacturerModels.models}/>  : errors}
            {renderNewModelForManufacturer(manufacturerModels)}
        </>
    )
}
