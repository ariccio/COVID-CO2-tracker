import React, {useEffect, useState} from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {Dropdown} from 'react-bootstrap';


import {ManufacturerDeviceModelsTable} from '../deviceModels/DeviceModelsTable';

import {formatErrors, ErrorObjectType} from '../../utils/ErrorObject';

import {ManufacturerModelInfo, SingleManufacturerInfo} from './manufacturerSlice';

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
    manufacturers: Array<EachManufacturer>
}

const defaultManufacturersArray: ManufacturersArray = {
    manufacturers: []
}

// const CreateManufacturer: React.FC<
const initSingleManufactuerInfo: SingleManufacturerInfo = {
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


export const CreateManufacturerOrModel: React.FC<CreateManufacturerOrModelProps> = () => {

    const [knownManufacturers, setKnownManufacturers] = useState(defaultManufacturersArray);
    const [showAddManufacturer, setShowAddManufacturer] = useState(false);
    const [errors, setErrors] = useState(null as (Array<ErrorObjectType> | null));
    //This should be in redux
    // const [selectedManufacturer, setSelectedManufacturer] = useState("");
    const selectedManufacturer = useSelector(selectSelectedManufacturer);

    const [manufacturerModels, setManufacturerModels] = useState(initSingleManufactuerInfo as SingleManufacturerInfo);
    const dispatch = useDispatch();

    useEffect(() => {
        const getAllManufacturersPromise = queryManufacturers();
        getAllManufacturersPromise.then(result => {
            setKnownManufacturers(result);
        })
    },[showAddManufacturer])

    useEffect(() => {
        if ((selectedManufacturer !== null) && (selectedManufacturer !== -1)) {
            const getManufacturerInfoPromise = queryManufacturerInfo(selectedManufacturer);
            getManufacturerInfoPromise.then(manufacturerInfo => {
                if (manufacturerInfo.errors === undefined) {
                    setManufacturerModels(manufacturerInfo);
                    return;
                }
                setErrors(manufacturerInfo.errors);
            })
        }
    }, [selectedManufacturer])

    const selectManufacturerHandler = (eventKey: any, event: Object) => {
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
    return (
        <>
            TODO: need route directly to create dialog
            <CreateManufacturerModalDialog showAddManufacturer={showAddManufacturer} setShowAddManufacturer={setShowAddManufacturer}/>
            <Dropdown onSelect={selectManufacturerHandler}>
                <Dropdown.Toggle variant="success" id="dropdown-basic">
                    {manufacturerModels.name === '' ? "Select manufacturer:" : manufacturerModels.name} 
                </Dropdown.Toggle>
                <Dropdown.Menu>
                    {manufacturersToDropdown(knownManufacturers)}
                    <Dropdown.Item eventKey={"-1"}>Create new manufacturer</Dropdown.Item>
                </Dropdown.Menu>
            </Dropdown>

            <br/>
            <br/>
            <br/>
            {errors === null ? <ManufacturerDeviceModelsTable models={manufacturerModels.models}/>  : errors}
        </>
    )
}
