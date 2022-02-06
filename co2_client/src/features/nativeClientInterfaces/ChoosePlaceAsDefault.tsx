import React, { useState } from 'react';
import {Button} from 'react-bootstrap';

import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { postRequestOptions } from '../../utils/DefaultRequestOptions';
import { Errors, formatErrors } from '../../utils/ErrorObject';
import { fetchJSONWithChecks } from '../../utils/FetchHelpers';
import { USER_SETTINGS_URL } from '../../utils/UrlPath';
import { selectSublocationSelectedLocationID } from '../sublocationsDropdown/sublocationSlice';

function sublocationSelected(sublocationID: number): boolean {
    if (sublocationID < 0) {
        return false;
    }
    return true;
}

interface NewOptionsResponseType {
    errors?: Errors
}

function newUserSettingsRequestInit(selectedSubLocation: number, place_id: string): RequestInit {
    if (selectedSubLocation === -1) {
        throw new Error("invariant, bug");
    }
    if (place_id === '') {
        throw new Error("invariant, bug");
    }
    const defaultRequestOptions = postRequestOptions();
    const newOptions = {
        ...defaultRequestOptions,
        body: JSON.stringify({
            user_settings: {
                realtime_upload_place_id: place_id,
                realtime_upload_sub_location_id: selectedSubLocation
            }
        })
    };
    return newOptions;
}

async function createSettings(selectedSubLocation: number, place_id: string): Promise<NewOptionsResponseType> {
    const init = newUserSettingsRequestInit(selectedSubLocation, place_id);
    const settingsFetchFailedCallback = async (awaitedResponse: Response): Promise<NewOptionsResponseType> => {
        console.error(`Failed to create settings! ${place_id}, ${selectedSubLocation}`);
        return awaitedResponse.json();
    }
    const settingsFetchSuceededCallback = async (awaitedResponse: Response): Promise<NewOptionsResponseType> => {
        console.log("TODO: strong type");
        return awaitedResponse.json();
    }

    const result = fetchJSONWithChecks(USER_SETTINGS_URL, init, 200, true, settingsFetchFailedCallback, settingsFetchSuceededCallback) as Promise<NewOptionsResponseType>;
    return result;
}

const RealtimeUploadButtonIfSelectedPlace: React.FC<{selectedSubLocation: number}> = ({selectedSubLocation}) => {
    const [translate] = useTranslation();
    // debugger;
    if (sublocationSelected(selectedSubLocation)) {
        return (
            <i><b>{translate("set-as-default-place-for-realtime-upload-client")}</b></i>
        );
    }
    return (
        <i>{translate("select-sublocation-to-set-as-default-for-realtime-upload")}</i>
    )
}

const handleButtonClick = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>, selectedSubLocation: number, place_id: string, setCreateErrors: React.Dispatch<React.SetStateAction<string | null>>) => {
    debugger;
    event.stopPropagation();
    event.preventDefault();
    createSettings(selectedSubLocation, place_id).then((result) => {
        debugger;
        if (result.errors) {
            setCreateErrors(formatErrors(result.errors));
        }
    }).catch((error) => {
        debugger;
        setCreateErrors(String(error));
    })
}


const MaybeCreateErrors: React.FC<{createErrors: string | null}> = ({createErrors}) => {
    if (createErrors === null) {
        return null;
    }
    if (createErrors === '') {
        return null;
    }
    return (
        <span>Error creating user settings: {createErrors}</span>
    )
}

export const ChoosePlaceAsDefault: React.FC<{place_id?: string | undefined}> = ({place_id}) => {
    const selectedSubLocation = useSelector(selectSublocationSelectedLocationID);
    const [createErrors, setCreateErrors] = useState(null as (string | null));
    
    if (place_id === undefined) {
        return null;
    }
    if (place_id === null) {
        debugger;
        return null;
    }
    if (place_id === '') {
        debugger;
        return null;
    }
    // debugger;

    return (
        <>
            <Button variant="primary" disabled={!sublocationSelected(selectedSubLocation)} title="Not implemented yet! Coming soon :)" onClick={(event) => handleButtonClick(event, selectedSubLocation, place_id, setCreateErrors)}>
                <RealtimeUploadButtonIfSelectedPlace selectedSubLocation={selectedSubLocation} />
            </Button>
            <br/>
            <MaybeCreateErrors createErrors={createErrors}/><br/>
            {/* <Link to={{pathname:`/places/???/createmeasurement`, state: {background: location}}} className="btn btn-primary">
                
            </Link> */}
        </>
    )

}