import React from 'react';
import {Table, Button} from 'react-bootstrap';
import { useDispatch } from 'react-redux';
import { deleteRequestOptions } from '../../utils/DefaultRequestOptions';
import { ErrorObjectType } from '../../utils/ErrorObject';
import { fetchJSONWithChecks } from '../../utils/FetchHelpers';


// import {queryUserInfo, UserInfoType, defaultUserInfo} from '../../utils/QueryUserInfo';
import {UserInfoSingleMeasurement} from '../../utils/QueryDeviceInfo';
import { API_URL } from '../../utils/UrlPath';
import { updateUserInfo } from '../profile/Profile';

const DELETE_MEASUREMENT_URL = (API_URL + '/measurement');


const measurementTableHeader = (withDelete?: boolean, innerLocation?: boolean) =>
    <thead>
        <tr>
            {/* <th>#</th> */}
            <th>Measurement ID</th>
            <th>Device</th>
            <th>CO2 PPM</th>
            <th>time</th>
            <th>crowding</th>
            <th>danger level</th>
            {innerLocation ? (<th>inner location</th>) : null}
            {withDelete ? (<th>delete measurement</th>) : null}
            {/* <th>measured at google place:</th> */}
        </tr>
    </thead>


function measurementRowKey(measurement_id: number): string {
    return `profile-measurement-entry-key-${measurement_id}`;
}

interface DeleteDeviceResponse {
    errors?: Array<ErrorObjectType>
}

function deleteClickHandler(event: React.MouseEvent<HTMLElement, MouseEvent>, measurement: UserInfoSingleMeasurement, dispatch: ReturnType<typeof useDispatch>) {
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

const maybeDeleteButton = (measurement: UserInfoSingleMeasurement, dispatch: ReturnType<typeof useDispatch>, withDelete?: boolean) => {
    if (withDelete) {
        return (
            <td>
                <Button variant="primary" onClick={(event) => {deleteClickHandler(event, measurement, dispatch);}}>
                    delete
                </Button>
            </td>
        )
    }
    // debugger;
    return null;
}


const maybeInnerLocation = (measurement: UserInfoSingleMeasurement, innerLocation?: boolean) => {
    if (innerLocation) {
        // debugger;
        return (<td>{measurement.location_where_inside_info}</td>);
    }
    // debugger;
    return null;
}

const riskRow = (measurement: UserInfoSingleMeasurement) => {
    if (measurement.co2ppm < 400) {
        return (<td><i>Unreasonably low measurement</i></td>);
    }
    if (measurement.co2ppm < 500) {
        return (<td><p style={{color:"green"}}><b>Very low!</b></p></td>);
    }
    if (measurement.co2ppm < 600) {
        return (<td><p style={{color:"green"}}>Low</p></td>);
    }
    if (measurement.co2ppm < 700) {
        return (<td><p style={{color:"green"}}>Fairly low</p></td>);
    }
    if (measurement.co2ppm < 800) {
        return (<td><p>Acceptable</p></td>);
    }
    if (measurement.co2ppm < 1000) {
        return (<td><p>Marginal/Warning</p></td>)
    }
    if (measurement.co2ppm < 1200) {
        return (<td><p style={{color:"red"}}><b>Bad</b></p></td>);
    }
    if (measurement.co2ppm < 2000) {
        return (<td><p style={{color:"red"}}><b><u>High: Danger zone</u></b></p></td>);
    }
    if (measurement.co2ppm < 5000) {
        return (<td><p style={{color:"red"}}><b><u>Extremely high: danger zone</u></b></p></td>);
    }
    if (measurement.co2ppm < 30_000) {
        return (<td><p style={{color:"red"}}><b><u><i>Abysmal, <a href="https://www.fsis.usda.gov/sites/default/files/media_file/2020-08/Carbon-Dioxide.pdf">violates OSHA, must not remain this high over 8 hours, confirm meter calibration</a></i></u></b></p></td>);
    }
    return (<td><p style={{color:"red"}}><b><u><i>Immediate death or invalid measurement</i></u></b></p></td>);
}

const mapMeasurementsToTableBody = (measurements: Array<UserInfoSingleMeasurement>, dispatch: ReturnType<typeof useDispatch>, withDelete?: boolean, innerLocation?: boolean)/*: JSX.Element*/ => {
    if (measurements === undefined) {
        debugger;
    }
    return measurements.map((measurement, index: number) => {
        // if (measurement.place === undefined) {
        //     debugger;
        // }
        return (
            <tr key={measurementRowKey(measurement.measurement_id)}>
                {/* <td>{index}</td> */}
                <td>{measurement.measurement_id}</td>
                <td>{measurement.device_name}</td>
                <td>{measurement.co2ppm}</td>
                {/* Displays the measurement as if it were taken in the timezone where the user currently is. It's painful to adjust the timezone according to the google places time offset, so this works for now. */}
                <td>{new Date(measurement.measurementtime).toString()}</td>
                <td>{measurement.crowding}</td>
                {riskRow(measurement)}
                {maybeInnerLocation(measurement, innerLocation)}
                {maybeDeleteButton(measurement, dispatch, withDelete)}
                {/* <td>{measurement.place.google_place_id}</td> */}
            </tr>
        )
    })
}


const measureTableBody = (measurements: Array<UserInfoSingleMeasurement>, dispatch: ReturnType<typeof useDispatch>, withDelete?: boolean, innerLocation?: boolean): JSX.Element =>
    <tbody>
        {mapMeasurementsToTableBody(measurements, dispatch, withDelete, innerLocation)}
    </tbody>


interface MeasurementsTableProps {
    measurements: Array<UserInfoSingleMeasurement>,
    withDelete?: boolean,
    innerLocation?: boolean
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
    if (props.measurements === undefined) {
        debugger;
    }
    return (
        <>
            <Table striped bordered hover>
                {measurementTableHeader(props.withDelete, props.innerLocation)}
                {measureTableBody(props.measurements, dispatch, props.withDelete, props.innerLocation)}
            </Table>
        </>
    )
}
