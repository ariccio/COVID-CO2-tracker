import React from 'react';
import {Dropdown} from 'react-bootstrap'
import { useSelector } from 'react-redux';
import { selectSelectedPlace } from '../google/googleSlice';


import {SelectedPlaceDatabaseInfo, defaultPlaceInfo, SublocationMeasurements} from '../places/placesSlice';
import { SublocationsDropdown } from '../sublocationsDropdown/SublocationsDropdown';
import { selectSublocationSelectedLocationID } from '../sublocationsDropdown/sublocationSlice';


import {MeasurementsTable} from './MeasurementsTable';


interface MeasurementsByDropdownProps {
    selectedPlaceInfoFromDatabase: SelectedPlaceDatabaseInfo
}

const maybeDescription = (location: SublocationMeasurements, withDescription: boolean) => {
    if (withDescription) {
        return (
            <>
                Inner location description: {location.description}
            </>
        );
    }
    return null;
}

function locationKey(location: SublocationMeasurements): string {
    return `measurement-table-sub-location-table-key-${location.sub_location_id}-${location.measurements.length}`
}

const singleLocation = (location: SublocationMeasurements, withDescription: boolean) => {
    return (
        <div key={locationKey(location)}>
            {maybeDescription(location, withDescription)}
            <MeasurementsTable measurements={location.measurements}/>
        </div>
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
        // console.log("rendering all measurements for this location.");
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

const nothingSelectedItem = () => {
    return (
        <>
            <Dropdown.Item eventKey={'-1'}>
                All
            </Dropdown.Item>
        </>
    )
}

const findSelected = (measurements_by_sublocation: Array<SublocationMeasurements>, selectedSubLocation: number): SublocationMeasurements | null => {
    const selected_ = findByID(measurements_by_sublocation, selectedSubLocation);
    if (selected_ === undefined) {
        return null;
    }
    return selected_;
}

export const MeasurementsByDropdown: React.FC<MeasurementsByDropdownProps> = (props: MeasurementsByDropdownProps): JSX.Element => {
    // props.selectedPlaceInfoFromDatabase.measurements_by_sublocation[0].
    // debugger;
    // if (props.selectedPlaceInfoFromDatabase.measurements_by_sublocation === undefined) {
    //     debugger;
    // }
    console.assert(props.selectedPlaceInfoFromDatabase.measurements_by_sublocation.length > 0);
    // const [selectedSubLocation, setSelectedSubLocation] = useState(-1);
    const selectedSubLocation = useSelector(selectSublocationSelectedLocationID);
    const selectedPlace = useSelector(selectSelectedPlace);
    if (props.selectedPlaceInfoFromDatabase === defaultPlaceInfo) {
        // debugger;
        console.log('unlikely to hit this path.')
        return (
            <>
                No place selected, no measurements to show. Loading...
            </>
        );
    }
    console.log(selectedPlace.utc_offset_minutes);
    //new Date(new Date(props.selectedPlaceInfoFromDatabase.measurements_by_sublocation[0].measurements[0].measurementtime)-(selectedPlace.utc_offset_minutes*1000*60))
    //14:46:33.674 
    // debugger;
    const selected = findSelected(props.selectedPlaceInfoFromDatabase.measurements_by_sublocation, selectedSubLocation);
    return (
        <>
            <SublocationsDropdown selected={selected} measurements_by_sublocation={props.selectedPlaceInfoFromDatabase.measurements_by_sublocation} nothingSelectedText={"All measurements:"} nothingSelectedItem={nothingSelectedItem()}/>
            {measurements(props.selectedPlaceInfoFromDatabase.measurements_by_sublocation, selectedSubLocation)}
            {/* <MeasurementsTable measurements={props.selectedPlaceInfoFromDatabase}/> */}
        </>
    );
}