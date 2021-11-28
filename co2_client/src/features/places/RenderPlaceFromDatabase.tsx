import React, {Suspense} from 'react';

import { useTranslation } from 'react-i18next';

import * as Sentry from "@sentry/browser"; // for manual error reporting.


import { MeasurementsByDropdown } from '../measurements/MeasurementsByDropdown';
import { defaultPlaceInfo, SelectedPlaceDatabaseInfo } from './placesSlice';


export const RenderFromDatabaseNoGoogleParam = (props: {selectedPlaceInfoFromDatabase: SelectedPlaceDatabaseInfo, selectedPlaceInfoErrors: string, selectedPlaceExistsInDatabase: boolean | null}) => {
    const [translate] = useTranslation();

    if (props.selectedPlaceInfoErrors !== '') {
        return (
            <div>
                <div>
                    {translate('failed-fetch-measurement-database')} {props.selectedPlaceInfoErrors}
                </div>
            </div>
        )
    }
    if (props.selectedPlaceInfoFromDatabase === defaultPlaceInfo) {
        // console.assert(selectedPlaceInfoFromDatabase.measurements === null);
        if (props.selectedPlaceExistsInDatabase === null) {
            return (
                <div>
                    {translate('querying-database-check-know')}
                </div>
            )
        }
        if (props.selectedPlaceExistsInDatabase === false) {
            return (
                <div>
                    {translate('no-measurements-uploaded-yet')}
                </div>
            )    
        }
        return (
            <div>
                <br/>
                Loading place info from database...
                <br/>
            </div>
        );
    }
    console.assert(props.selectedPlaceExistsInDatabase !== null);
    console.assert(props.selectedPlaceExistsInDatabase !== false);
    if (props.selectedPlaceInfoFromDatabase.measurements_by_sublocation === undefined) {
        console.assert(props.selectedPlaceInfoFromDatabase === defaultPlaceInfo);
        console.error("invalid state, maybe internal server error.");
        Sentry.captureMessage("invalid state while rendering place from database");
        debugger;
        if ((props.selectedPlaceInfoFromDatabase as any).error !== undefined) {
            return (
                <div>
                    Error: {(props.selectedPlaceInfoFromDatabase as any).error}
                </div>
            )
        }
        return null;
    }
    //TODO: need strong type in updatePlacesInfoFromBackend, else this can be undefined!
    if (props.selectedPlaceInfoFromDatabase.measurements_by_sublocation.length === 0) {
        // debugger;
        return (
            <div>
                {translate('zero-measurements-place')}
            </div>
        )
    }
    // debugger;
    return (
        <div>
            <Suspense fallback="loading translations...">
                <MeasurementsByDropdown selectedPlaceInfoFromDatabase={props.selectedPlaceInfoFromDatabase}/>
            </Suspense>
            
        </div>
    )

}
