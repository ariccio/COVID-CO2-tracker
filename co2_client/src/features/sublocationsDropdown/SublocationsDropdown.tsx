import {Dropdown} from 'react-bootstrap';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../app/store';

import {SublocationMeasurements} from '../places/placesSlice';
import { setSublocationSelectedLocationID } from './sublocationSlice';


function dropdownKeyToSublocationID(eventKey: string | null): number {
    if (eventKey === null) {
        return -1;
    }
    return parseInt(eventKey);
}

function dropdownItemRowKey(sublocation: SublocationMeasurements): string {
    return `rowkey-${sublocation.sub_location_id}-show-dropdown`;
}

const selectSubLocationDropdownHandler = (eventKey: string|null, event: React.SyntheticEvent<unknown>, dispatch: AppDispatch, setGlobal: boolean, setSelectedSubLocationIDModalOnly?: React.Dispatch<React.SetStateAction<number>>) => {
    console.log(eventKey);
    // setSelectedSubLocation(dropdownKeyToSublocationID(eventKey));
    const newSelectionID = dropdownKeyToSublocationID(eventKey);
    if (setGlobal) {
        dispatch(setSublocationSelectedLocationID(newSelectionID));
        return;
    }

    if (setSelectedSubLocationIDModalOnly === undefined) {
        debugger;
        throw new Error("Missing callback to set location!");
    }
    setSelectedSubLocationIDModalOnly(newSelectionID);
    // debugger;
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

export interface SelectedSublocationForDropdownDisplay {
    // isSelected: boolean,
    description: string,
    sub_location_id: number | undefined
}

export interface SubLocationsDropdownProps {
    // selected: SublocationMeasurements | null,
    // setSelectedSubLocation: React.Dispatch<React.SetStateAction<number>>,
    measurements_by_sublocation: Array<SublocationMeasurements>,
    nothingSelectedText: string,
    nothingSelectedItem: JSX.Element,
    selectedSublocationDisplayData: SelectedSublocationForDropdownDisplay | null,

    // Decouple immediate location choice from global location choice when creating measurement. Performance improvement.
    setGlobal: boolean,
    setSelectedSubLocationIDModalOnly?: React.Dispatch<React.SetStateAction<number>>
}

export const SublocationsDropdown: React.FC<SubLocationsDropdownProps> = (props: SubLocationsDropdownProps) => {
    const dispatch = useDispatch();
    if (props.measurements_by_sublocation === undefined) {
        throw new Error(`measurements_by_sublocation is undefined, this is a bug in SublocationsDropdown.tsx. props.selected?.description: ${props.selectedSublocationDisplayData?.description}, props.selected?.sub_location_id: ${props.selectedSublocationDisplayData?.sub_location_id}`);
    }

    // debugger;
    return (
        <div>
            <Dropdown onSelect={(eventKey: string | null, event: React.SyntheticEvent<unknown>) => {selectSubLocationDropdownHandler(eventKey, event, dispatch, props.setGlobal, props.setSelectedSubLocationIDModalOnly)}}>
                <Dropdown.Toggle variant="success" id="dropdown-basic">
                    { props.selectedSublocationDisplayData ? props.selectedSublocationDisplayData.description : props.nothingSelectedText} 
                </Dropdown.Toggle>

                <Dropdown.Menu>
                    {props.nothingSelectedItem}
                    {subLocationsToDropdown(props.measurements_by_sublocation)}
                </Dropdown.Menu>

            </Dropdown>
        </div>
    )
}
