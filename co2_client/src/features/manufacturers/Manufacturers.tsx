import {useEffect, useState, Suspense, useRef} from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {Dropdown} from 'react-bootstrap';
import {Link, useLocation} from 'react-router-dom';

import { useTranslation } from 'react-i18next';

import {ManufacturerDeviceModelsTable} from '../deviceModels/DeviceModelsTable';

import {ErrorObjectType, exceptionToErrorObject, formatErrors} from '../../utils/ErrorObject';

import {SingleManufacturerInfoResponse} from './manufacturerSlice';

import {setSelectedManufacturer} from './manufacturerSlice';
import {selectSelectedManufacturer} from './manufacturerSlice';

import {queryManufacturerInfo, queryManufacturers, CreateManufacturerModalDialog} from '../create/createManufacturerModel';
import { selectSelectedModel } from '../deviceModels/deviceModelsSlice';
import { AppDispatch } from '../../app/store';


// interface CreateManufacturerOrModelProps {

// }

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
    return manufacturers.map((manufacturer: EachManufacturer) => {
        return (
            <Dropdown.Item eventKey={`${manufacturer.id}`} key={dropdownItemRowKey(manufacturer)}>
                <span>
                    {manufacturer.name}
                </span>
            </Dropdown.Item>
        )
    })
}


const getAndSetManufacturers = (setKnownManufacturers: React.Dispatch<React.SetStateAction<ManufacturersArray>>, setErrors: React.Dispatch<React.SetStateAction<string>>) => {
    const getAllManufacturersPromise = queryManufacturers();
    getAllManufacturersPromise.then(result => {
        if (result.errors !== undefined) {
            setErrors(formatErrors(result.errors));
        }
        else {
            console.log(result);
            setKnownManufacturers(result);
        }
    }).catch((error) => {
        setErrors(formatErrors([exceptionToErrorObject(error)]))
    })

}

const getSingleManufacturer = (selectedManufacturer: number | null, setManufacturerModels: React.Dispatch<React.SetStateAction<SingleManufacturerInfoResponse>>, setErrors: React.Dispatch<React.SetStateAction<string>>) => {
    if ((selectedManufacturer !== null) && (selectedManufacturer !== -1)) {
        const getManufacturerInfoPromise = queryManufacturerInfo(selectedManufacturer);
        getManufacturerInfoPromise.then(manufacturerInfo => {
            if (manufacturerInfo.errors === undefined) {
                // debugger;
                setManufacturerModels(manufacturerInfo);
                return;
            }
            setErrors(formatErrors(manufacturerInfo.errors));
        }).catch((error) => {
            setErrors(formatErrors([exceptionToErrorObject(error)]))
        }) 
    }

}

const selectManufacturerHandler = (eventKey: string | null, event: React.SyntheticEvent<unknown>, setShowAddManufacturer: React.Dispatch<React.SetStateAction<boolean>>, dispatch: AppDispatch) => {
    if (eventKey === "-1") {
        console.log(`user selected create manufacturer`);
        setShowAddManufacturer(true);
        return;
    }
    console.assert(eventKey !== null);
    if (eventKey === null) {
        alert("TODO: I need to handle this. Event key null.");
        return;
    }
    const selected = dropdownKeyToManufacturerID(eventKey);
    if (selected !== null) {
        dispatch(setSelectedManufacturer(selected));
        console.log(`user selected manufacturer dropdown number: ${eventKey}`);
    }
}

const RenderDropdown = (props: {manufacturerModels: SingleManufacturerInfoResponse, setShowAddManufacturer: React.Dispatch<React.SetStateAction<boolean>>, knownManufacturers: ManufacturersArray}) => {
    const dispatch = useDispatch();
    const [translate] = useTranslation();
    
    return (
        <Dropdown onSelect={(eventKey: string | null, event: React.SyntheticEvent<unknown>) => {selectManufacturerHandler(eventKey, event, props.setShowAddManufacturer, dispatch)}}>
            <Dropdown.Toggle variant="success" id="dropdown-basic">
                <span>
                    {props.manufacturerModels.name === '' ? "Select manufacturer:" : props.manufacturerModels.name}
                </span>
            </Dropdown.Toggle>
            <Dropdown.Menu id="dropdown-for-testing-basic-id">
                {manufacturersToDropdown(props.knownManufacturers)}
                <Dropdown.Item eventKey={"-1"}>
                    {/* TODO: this is not valid? Dropdown.item might be a link itself */}
                    {/* <Link to={{pathname: `/manufacturers/create`, state: {background: location}}}> */}
                    <span>
                        {translate('Create new manufacturer')}
                    </span>
                    {/* </Link> */}
                </Dropdown.Item>
            </Dropdown.Menu>
        </Dropdown>

    );

} 

const NewModelForManufacturer = (props: {manufacturerModels: SingleManufacturerInfoResponse, selectedModel: number}) => {
    const [translate] = useTranslation();

    const to = useRef({pathname:`/devicemodels/create`});
    if (props.selectedModel !== -1) {
        return null;
    }
    // const buttonClick = () => {
    //     debugger;
    //     return <Redirect } />
    // }
    if (props.manufacturerModels === initSingleManufactuerInfo) {
        return null;
    }
    return (
        <Link to={to.current.pathname} className="btn btn-primary">
            {translate('create-new-model-manufacturer')} {props.manufacturerModels.name}
        </Link>
    );

}

const renderDropdownOrLoading = (knownManufacturers: ManufacturersArray, manufacturerModels: SingleManufacturerInfoResponse, setShowAddManufacturer: React.Dispatch<React.SetStateAction<boolean>>, location: ReturnType<typeof useLocation>, dispatch: AppDispatch, errors: string) => {
    if(knownManufacturers !== defaultManufacturersArray) {
        if (knownManufacturers.manufacturers === undefined) {
            throw new Error(`knownManufacturers.manufacturers is undefined! This is a bug in Manufacturers.tsx. manufacturerModels: ${String(manufacturerModels)}, errors: ${JSON.stringify(errors)}`)
        }
        return (
            <Suspense fallback="loading translations...">

                <RenderDropdown manufacturerModels={manufacturerModels} setShowAddManufacturer={setShowAddManufacturer} knownManufacturers={knownManufacturers}/>
            </Suspense>
        );
    }
    if (errors !== '') {
        return(
            <div>
                {errors}
            </div>
        );
    } 
    return (
        <div>Loading manufacturers...</div>
    );
}

const renderDeviceModelsOrLoading = (selectedManufacturer: number | null, manufacturerModels: SingleManufacturerInfoResponse, errors: string) => {
    if (errors === '') {
        if (selectedManufacturer === null) {
            return null;
        }
        if (manufacturerModels === initSingleManufactuerInfo) {
            return (
                <div>
                    Loading known models from database...
                </div>
            )
        }
        return (
            <Suspense fallback="loading translations...">
                <ManufacturerDeviceModelsTable models={manufacturerModels.models} selectedManufacturer={selectedManufacturer}/>
            </Suspense>
        );
    }
    return(
        <div aria-label='Manufacturer UI errors'>
            {errors}
        </div>
    );
}

export const CreateManufacturerOrModel = () => {
    const location = useLocation();
    const dispatch = useDispatch();

    const [knownManufacturers, setKnownManufacturers] = useState(defaultManufacturersArray);
    //TODO: this is not how you do nested routes.
    const [showAddManufacturer, setShowAddManufacturer] = useState(location.pathname.endsWith('create'));
    const [errors, setErrors] = useState('');
    const [manufacturerModels, setManufacturerModels] = useState(initSingleManufactuerInfo as SingleManufacturerInfoResponse);
    const selectedManufacturer = useSelector(selectSelectedManufacturer);
    const selectedModel = useSelector(selectSelectedModel);

    useEffect(() => {
        // console.log("change");
        getAndSetManufacturers(setKnownManufacturers, setErrors);
    },[showAddManufacturer])

    useEffect(() => {
        getSingleManufacturer(selectedManufacturer, setManufacturerModels, setErrors);
    }, [selectedManufacturer, selectedModel])

    return (
        <div>
            <Suspense fallback="loading translations...">
                {(showAddManufacturer) ? <CreateManufacturerModalDialog showAddManufacturer={showAddManufacturer} setShowAddManufacturer={setShowAddManufacturer}/> : null}
            </Suspense>
            {renderDropdownOrLoading(knownManufacturers, manufacturerModels, setShowAddManufacturer, location, dispatch, errors)}
            <br/>
            <br/>
            <br/>
            {renderDeviceModelsOrLoading(selectedManufacturer, manufacturerModels, errors)}
            <Suspense fallback="loading translations...">
                <NewModelForManufacturer manufacturerModels={manufacturerModels} selectedModel={selectedModel} />
            </Suspense>
        </div>
    )
}
