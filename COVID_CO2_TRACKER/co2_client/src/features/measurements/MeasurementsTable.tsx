import React from 'react';
import {Table, Button} from 'react-bootstrap';
import { useDispatch } from 'react-redux';
import { deleteRequestOptions } from '../../utils/DefaultRequestOptions';
import { ErrorObjectType } from '../../utils/ErrorObject';
import { fetchJSONWithChecks } from '../../utils/FetchHelpers';


// import {queryUserInfo, UserInfoType, defaultUserInfo} from '../../utils/QueryUserInfo';
import {UserInfoMeasurements} from '../../utils/QueryDeviceInfo';
import { API_URL } from '../../utils/UrlPath';
import { updateUserInfo } from '../profile/Profile';

const DELETE_MEASUREMENT_URL = (API_URL + '/measurement');

const measurementTableHeader = (withDelete?: boolean) =>
    <thead>
        <tr>
            {/* <th>#</th> */}
            <th>Measurement ID</th>
            <th>Device ID</th>
            <th>CO2 PPM</th>
            <th>time</th>
            <th>crowding</th>
            <th>inner location</th>
            {withDelete ? (<th>delete measurement</th>) : null}
            {/* <th>measured at google place:</th> */}
        </tr>
    </thead>


function measurementRowKey(device: number): string {
    return `profile-measurement-entry-key-${device}`;
}

interface DeleteDeviceResponse {
    errors?: Array<ErrorObjectType>
}

function deleteClickHandler(event: React.MouseEvent<HTMLElement, MouseEvent>, measurement: UserInfoMeasurements, dispatch: ReturnType<typeof useDispatch>) {
    event.preventDefault();
    event.stopPropagation();
    const fetchFailedCallback = async (awaitedResponse: Response): Promise<DeleteDeviceResponse> => {
        console.error("failed to delete the device!");
        return awaitedResponse.json();
    }

    const fetchSuccessCallback = async (awaitedResponse: Response): Promise<DeleteDeviceResponse> => {
        return awaitedResponse.json();
    }
    const defaultDeleteOptions = deleteRequestOptions();
    const thisDeleteMeasurements = (DELETE_MEASUREMENT_URL + '/' + measurement.measurement_id);
    const result = fetchJSONWithChecks(thisDeleteMeasurements, defaultDeleteOptions, 200, true, fetchFailedCallback, fetchSuccessCallback) as Promise<DeleteDeviceResponse>;
    result.then((response) => {
        if (response.errors !== undefined) {
            console.warn("failed to delete device, not refreshing profile.")
            return;
        }
        updateUserInfo(dispatch);
    }).catch((error) => {
        console.warn("device delete promise exception?");
        console.error(error);
        debugger;
    })
    // debugger;

}

const maybeDeleteButton = (measurement: UserInfoMeasurements, dispatch: ReturnType<typeof useDispatch>, withDelete?: boolean) => {
    if (!withDelete) {
        return null;
    }
    return (
        <td>
            <Button variant="primary" onClick={(event) => {deleteClickHandler(event, measurement, dispatch);}}>
                delete
            </Button>
        </td>
    )
}

const mapMeasurementsToTableBody = (measurements: Array<UserInfoMeasurements>, dispatch: ReturnType<typeof useDispatch>, withDelete?: boolean)/*: JSX.Element*/ => {
    return measurements.map((measurement, index: number) => {
        if (measurement.place === undefined) {
            debugger;
        }
        return (
            <tr key={measurementRowKey(measurement.measurement_id)}>
                {/* <td>{index}</td> */}
                <td>{measurement.measurement_id}</td>
                <td>{measurement.device_id}</td>
                <td>{measurement.co2ppm}</td>
                <td>{measurement.measurementtime}</td>
                <td>{measurement.crowding}</td>
                <td>{measurement.location_where_inside_info}</td>
                {maybeDeleteButton(measurement, dispatch, withDelete)}
                {/* <td>{measurement.place.google_place_id}</td> */}
            </tr>
        )
    })
}


const measureTableBody = (measurements: Array<UserInfoMeasurements>, dispatch: ReturnType<typeof useDispatch>, withDelete?: boolean): JSX.Element =>
    <tbody>
        {mapMeasurementsToTableBody(measurements, dispatch, withDelete)}
    </tbody>


interface MeasurementsTableProps {
    measurements: Array<UserInfoMeasurements>,
    withDelete?: boolean 
}

// withDelete enables rendering button to delete measurements.
// Allows reusability across components, with functionality to delete measurements on the users profile.
// I could do this lots of other ways. Hooks? But this is easy rn.
// Reading for later:
//  https://spicefactory.co/blog/2019/03/26/how-to-avoid-the-boolean-trap-when-designing-react-components/

export const MeasurementsTable: React.FC<MeasurementsTableProps> = (props: MeasurementsTableProps): JSX.Element => {
    // In theory I could eliminate the use of dispatch if there's no need to show the delete button, since I only use dispatch when users delete their own measurements.
    const dispatch = useDispatch();
    // debugger;
    return (
        <>
            <Table striped bordered hover>
                {measurementTableHeader(props.withDelete)}
                {measureTableBody(props.measurements, dispatch, props.withDelete)}
            </Table>
        </>
    )
}
