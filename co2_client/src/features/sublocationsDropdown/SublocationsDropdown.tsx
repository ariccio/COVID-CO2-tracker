import React from 'react';
import {Dropdown} from 'react-bootstrap';
import { useDispatch } from 'react-redux';


import {SublocationMeasurements} from '../places/placesSlice';
import { setSublocationSelectedLocationID } from './sublocationSlice';


function dropdownKeyToSublocationID(eventKey: string | null): number {
    // if (eventKey === '-1') {
    //     return null;
    // }
    if (eventKey === null) {
        return -1;
    }
    return parseInt(eventKey);
}

function dropdownItemRowKey(sublocation: SublocationMeasurements): string {
    return `rowkey-${sublocation.sub_location_id}-show-dropdown`;
}

const selectSubLocationDropdownHandler = (eventKey: string|null, event: React.SyntheticEvent<unknown>, dispatch: ReturnType<typeof useDispatch>) => {
    console.log(eventKey);
    // setSelectedSubLocation(dropdownKeyToSublocationID(eventKey));
    // debugger;
    dispatch(setSublocationSelectedLocationID(dropdownKeyToSublocationID(eventKey)))
}

const subLocationsToDropdown = (sublocation_with_measurements: Array<SublocationMeasurements>) => {
    return sublocation_with_measurements.map((sublocation) => {
        return (
            <Dropdown.Item eventKey={`${sublocation.sub_location_id}`} key={dropdownItemRowKey(sublocation)}>
                {sublocation.description}
            </Dropdown.Item>   
        )
    })
}

export interface SubLocationsDropdownProps {
    selected: SublocationMeasurements | null,
    // setSelectedSubLocation: React.Dispatch<React.SetStateAction<number>>,
    measurements_by_sublocation: Array<SublocationMeasurements>,
    nothingSelectedText: string,
    nothingSelectedItem: JSX.Element
}

export const SublocationsDropdown: React.FC<SubLocationsDropdownProps> = (props: SubLocationsDropdownProps) => {
    const dispatch = useDispatch();
    return (
        <>
            <Dropdown onSelect={(eventKey: string | null, event: React.SyntheticEvent<unknown>) => {selectSubLocationDropdownHandler(eventKey, event, dispatch)}}>
                <Dropdown.Toggle variant="success" id="dropdown-basic">
                    { props.selected ? props.selected.description : props.nothingSelectedText} 
                </Dropdown.Toggle>

                <Dropdown.Menu>
                    {props.nothingSelectedItem}
                    {subLocationsToDropdown(props.measurements_by_sublocation)}
                </Dropdown.Menu>

            </Dropdown>
        </>
    )
}
