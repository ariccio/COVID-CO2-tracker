import React, { useEffect, useState } from 'react';
import {Dropdown} from 'react-bootstrap'
import { useSelector } from 'react-redux';

import { useTranslation } from 'react-i18next';

import { formatErrors } from '../../utils/ErrorObject';
import { fetchDeviceNamesForMeasurementsBySublocation } from '../../utils/QueryDeviceInfo';
import {SerializedSingleDeviceSerial} from '../../utils/DeviceInfoTypes';
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
            <div>
                Inner location description: {location.description}
            </div>
        );
    }
    return null;
}

function locationKey(location: SublocationMeasurements): string {
    return `measurement-table-sub-location-table-key-${location.sub_location_id}-${location.measurements.data.length}`
}

const singleLocation = (location: SublocationMeasurements, withDescription: boolean, deviceSerials?: Array<SerializedSingleDeviceSerial>) => {

    if (location.measurements.data === undefined) {
        console.log("measurements array is null, this is a bug, and this is an ugly hack to work around it. (MeasurementsByDropdown.tsx)");
        return (
            <div>
                <br/>
                <span>No measurements for this sublocation ({location.sub_location_id}, {location.description}).</span>
            </div>
        )
    }
    return (
        <div key={locationKey(location)}>
            {maybeDescription(location, withDescription)}
            <MeasurementsTable measurements={location.measurements.data} deviceSerials={deviceSerials} withDevice/>
        </div>
    );

}

const allMeasurements = (sublocations: Array<SublocationMeasurements>, deviceSerials?: Array<SerializedSingleDeviceSerial>) => {
    return sublocations.map((location) => {
        if (location.measurements === undefined) {
            debugger;
        }
        return singleLocation(location, true, deviceSerials);
    })

}

function findByID(sublocations: Array<SublocationMeasurements>, selected: number): SublocationMeasurements | undefined {
    return sublocations.find((value) => {
        return (value.sub_location_id === selected);
    });
}

const measurements = (sublocations: Array<SublocationMeasurements>, selected: number, deviceSerials?: Array<SerializedSingleDeviceSerial>) => {
    // if (sublocations === undefined) {
    //     debugger;
    // }
    if (selected === -1) {
        if (sublocations === undefined) {
            throw new Error(`sublocations is undefined! This is a bug in MeasurementsByDropdown.tsx. selected: ${selected}, deviceSerials: ${deviceSerials?.toString()}`)
        }
        // console.log("rendering all measurements for this location.");
        return allMeasurements(sublocations, deviceSerials);
    }
    const foundSelected = findByID(sublocations, selected)
    if (foundSelected === undefined) {
        console.error("missing sublocation!");
        debugger;
        return (
            <div>
                Selected value not in sublocation array. This is a bug.
            </div>
        );
    }
    return singleLocation(foundSelected, false, deviceSerials);
}

const nothingSelectedItem = () => {
    return (
        <div>
            <Dropdown.Item eventKey={'-1'}>
                All
            </Dropdown.Item>
        </div>
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
    const [translate] = useTranslation();

    // props.selectedPlaceInfoFromDatabase.measurements_by_sublocation[0].
    // debugger;
    
    // if (props.selectedPlaceInfoFromDatabase.measurements_by_sublocation === undefined) {
    //     debugger;
    // }
    console.assert(props.selectedPlaceInfoFromDatabase.measurements_by_sublocation.length > 0);
    // const [selectedSubLocation, setSelectedSubLocation] = useState(-1);
    const selectedSubLocation = useSelector(selectSublocationSelectedLocationID);
    const selectedPlace = useSelector(selectSelectedPlace);
    const [deviceSerialsErrorState, setDeviceSerialsErrorState] = useState('');
    const [deviceSerials, setDeviceSerials] = useState([] as Array<SerializedSingleDeviceSerial>);
    useEffect(() => {
        if (props.selectedPlaceInfoFromDatabase.measurements_by_sublocation === undefined) {
            //Seen in sentry, was undefined.
            console.warn(`"props.selectedPlaceInfoFromDatabase.measurements_by_sublocation" === undefined. No measurements to fetch. Rest of object: ${JSON.stringify(props.selectedPlaceInfoFromDatabase)}`);
            return;
        }
        const promise = fetchDeviceNamesForMeasurementsBySublocation(props.selectedPlaceInfoFromDatabase.measurements_by_sublocation);
        promise.then((result) => {
            if (result.errors !== undefined) {
                setDeviceSerialsErrorState(formatErrors(result.errors));
                return;
            }
            setDeviceSerials(result.devices.data);
            // debugger;
        })
        promise.catch((error) => {
            setDeviceSerialsErrorState(error)
        })
    }, [props.selectedPlaceInfoFromDatabase.measurements_by_sublocation])



    if (props.selectedPlaceInfoFromDatabase === defaultPlaceInfo) {
        // debugger;
        console.log('unlikely to hit this path.')
        return (
            <div>
                <span>
                    {translate('no-place-selected-no-measurements')}
                </span>
            </div>
        );
    }

    if (deviceSerialsErrorState !== '') {
        console.log("some kind of error while loading device serial numbers...");
        return (
            <div>
                <span>
                    {translate('error-loading-device-serials')} {deviceSerialsErrorState}
                </span>
            </div>
        )
    }
    // Quiet the log on first load.
    if (selectedPlace.utc_offset_minutes !== undefined) {
        console.log(`selectedPlace.utc_offset_minutes: ${selectedPlace.utc_offset_minutes}`);
    }
    //new Date(new Date(props.selectedPlaceInfoFromDatabase.measurements_by_sublocation[0].measurements[0].measurementtime)-(selectedPlace.utc_offset_minutes*1000*60))
    //14:46:33.674 
    // debugger;
    const selected = findSelected(props.selectedPlaceInfoFromDatabase.measurements_by_sublocation, selectedSubLocation);
    return (
        <div>
            <SublocationsDropdown selected={selected} measurements_by_sublocation={props.selectedPlaceInfoFromDatabase.measurements_by_sublocation} nothingSelectedText={"All measurements:"} nothingSelectedItem={nothingSelectedItem()}/>
            {measurements(props.selectedPlaceInfoFromDatabase.measurements_by_sublocation, selectedSubLocation, deviceSerials)}
            {/* <MeasurementsTable measurements={props.selectedPlaceInfoFromDatabase}/> */}
        </div>
    );
}