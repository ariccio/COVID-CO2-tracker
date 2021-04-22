import React from 'react';
import { MeasurementsByDropdown } from '../measurements/MeasurementsByDropdown';
import { defaultPlaceInfo, SelectedPlaceDatabaseInfo } from './placesSlice';

export const renderFromDatabaseNoGoogleParam = (selectedPlaceInfoFromDatabase: SelectedPlaceDatabaseInfo, selectedPlaceInfoErrors: string, selectedPlaceExistsInDatabase: boolean | null) => {
    if (selectedPlaceInfoErrors !== '') {
        return (
            <>
                <div>
                    Failed to fetch measurement info from the database! {selectedPlaceInfoErrors}
                </div>
            </>
        )
    }
    if (selectedPlaceInfoFromDatabase === defaultPlaceInfo) {
        // console.assert(selectedPlaceInfoFromDatabase.measurements === null);
        if (selectedPlaceExistsInDatabase === null) {
            return (
                <>
                    Querying database to see if we already know about this place...
                </>
            )
        }
        if (selectedPlaceExistsInDatabase === false) {
            return (
                <div>
                    No measurements uploaded for this place yet.
                </div>
            )    
        }
        return (
            <>
                <br/>
                Loading place info from database...
                <br/>
            </>
        );
    }
    console.assert(selectedPlaceExistsInDatabase !== null);
    console.assert(selectedPlaceExistsInDatabase !== false);
    if (selectedPlaceInfoFromDatabase.measurements_by_sublocation === undefined) {
        console.assert(selectedPlaceInfoFromDatabase === defaultPlaceInfo);
        console.error("invalid state, maybe internal server error.");
        debugger;
        if ((selectedPlaceInfoFromDatabase as any).error !== undefined) {
            return (
                <>
                    {(selectedPlaceInfoFromDatabase as any).error}
                </>
            )
        }
        return null;
    }
    //TODO: need strong type in updatePlacesInfoFromBackend, else this can be undefined!
    if (selectedPlaceInfoFromDatabase.measurements_by_sublocation.length === 0) {
        // debugger;
        return (
            <div>
                Zero measurements recorded for this place.
            </div>
        )
    }
    // debugger;
    return (
        <>
            <MeasurementsByDropdown selectedPlaceInfoFromDatabase={selectedPlaceInfoFromDatabase}/>
            
        </>
    )

}
