import React, { useState } from 'react';
import { UserInfoSingleMeasurement } from '../../utils/QueryDeviceInfo';
import {SelectedPlaceDatabaseInfo, defaultPlaceInfo, selectPlaceExistsInDatabase, SublocationMeasurements} from '../places/placesSlice';

import {Dropdown} from 'react-bootstrap';

import {MeasurementsTable} from './MeasurementsTable';


interface MeasurementsByDropdownProps {
    selectedPlaceInfoFromDatabase: SelectedPlaceDatabaseInfo
}

const maybeDescription = (location: SublocationMeasurements, withDescription: boolean) => {
    if (withDescription) {
        return (
            <>
                description: {location.description}
            </>
        );
    }
    return null;
}

const singleLocation = (location: SublocationMeasurements, withDescription: boolean) => {
    return (
        <>
            {maybeDescription(location, withDescription)}
            <MeasurementsTable measurements={location.measurements}/>
        </>
    );

}

const allMeasurements = (sublocations: Array<SublocationMeasurements>) => {
    return sublocations.map((location) => {
        if (location.measurements === undefined) {
            debugger;
        }
        return singleLocation(location, true);
    })

}

function findByID(sublocations: Array<SublocationMeasurements>, selected: number): SublocationMeasurements | undefined {
    return sublocations.find((value) => {
        return (value.sub_location_id === selected);
    });
}

const measurements = (sublocations: Array<SublocationMeasurements>, selected: number) => {
    // if (sublocations === undefined) {
    //     debugger;
    // }
    if (selected === -1) {
        console.log("rendering all measurements for this location.");
        return allMeasurements(sublocations);
    }
    const foundSelected = findByID(sublocations, selected)
    if (foundSelected === undefined) {
        console.error("missing sublocation!");
        debugger;
        return (
            <>
                Selected value not in sublocation array. This is a bug.
            </>
        );
    }
    return singleLocation(foundSelected, false);
}

function dropdownKeyToSublocationID(eventKey: string | null): number {
    // if (eventKey === '-1') {
    //     return null;
    // }
    if (eventKey === null) {
        return -1;
    }
    return parseInt(eventKey);
}

const selectSubLocationDropdownHandler = (eventKey: string|null, event: React.SyntheticEvent<unknown>, setSelectedSubLocation: React.Dispatch<React.SetStateAction<number>>) => {
    console.log(eventKey);
    setSelectedSubLocation(dropdownKeyToSublocationID(eventKey));
}

function dropdownItemRowKey(sublocation: SublocationMeasurements): string {
    return `rowkey-${sublocation.sub_location_id}-show-dropdown`;
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

export const MeasurementsByDropdown: React.FC<MeasurementsByDropdownProps> = (props: MeasurementsByDropdownProps): JSX.Element => {
    // props.selectedPlaceInfoFromDatabase.measurements_by_sublocation[0].
    // debugger;
    // if (props.selectedPlaceInfoFromDatabase.measurements_by_sublocation === undefined) {
    //     debugger;
    // }
    console.assert(props.selectedPlaceInfoFromDatabase.measurements_by_sublocation.length > 0);
    const [selectedSubLocation, setSelectedSubLocation] = useState(-1);
    if (props.selectedPlaceInfoFromDatabase === defaultPlaceInfo) {
        // debugger;
        console.log('unlikely to hit this path.')
        return (
            <>
                No place selected, no measurements to show. Loading...
            </>
        );
    }
    const selected = findByID(props.selectedPlaceInfoFromDatabase.measurements_by_sublocation, selectedSubLocation);
    return (
        <>
            <Dropdown onSelect={(eventKey: string | null, event: React.SyntheticEvent<unknown>) => {selectSubLocationDropdownHandler(eventKey, event, setSelectedSubLocation)}}>
                <Dropdown.Toggle variant="success" id="dropdown-basic">
                    { selected ? selected.description : "All measurements:"} 
                </Dropdown.Toggle>

                <Dropdown.Menu>
                    <Dropdown.Item eventKey={'-1'}>
                        All
                    </Dropdown.Item>
                    {subLocationsToDropdown(props.selectedPlaceInfoFromDatabase.measurements_by_sublocation)}
                </Dropdown.Menu>

            </Dropdown>
            {measurements(props.selectedPlaceInfoFromDatabase.measurements_by_sublocation, selectedSubLocation)}
            {/* <MeasurementsTable measurements={props.selectedPlaceInfoFromDatabase}/> */}
        </>
    );
}