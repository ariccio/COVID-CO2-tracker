import React from 'react';
import {Button} from 'react-bootstrap';

import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { selectSublocationSelectedLocationID } from '../sublocationsDropdown/sublocationSlice';


const RealtimeUploadButtonIfSelectedPlace: React.FC<{selectedSubLocation: number}> = ({selectedSubLocation}) => {
    const [translate] = useTranslation();
    // debugger;
    if (selectedSubLocation > 0) {
        return (
            <i><b>{translate("set-as-default-place-for-realtime-upload-client")}</b></i>
        );
    }
    return (
        <i>{translate("select-sublocation-to-set-as-default-for-realtime-upload")}</i>
    )
}

export const ChoosePlaceAsDefault: React.FC<{place_id?: string | undefined}> = ({place_id}) => {
    const selectedSubLocation = useSelector(selectSublocationSelectedLocationID);
    
    if (!place_id) {
        return null;
    }

    return (
        <>
            <Button variant="primary" disabled={true} title="Not implemented yet! Coming soon :)">
                <RealtimeUploadButtonIfSelectedPlace selectedSubLocation={selectedSubLocation} />
            </Button>
            {/* <Link to={{pathname:`/places/???/createmeasurement`, state: {background: location}}} className="btn btn-primary">
                
            </Link> */}
        </>
    )

}