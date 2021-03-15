import React from 'react';
import {Table} from 'react-bootstrap';


// import {queryUserInfo, UserInfoType, defaultUserInfo} from '../../utils/QueryUserInfo';
import {UserInfoMeasurements} from '../../utils/QueryDeviceInfo';


const measurementTableHeader = () =>
    <thead>
        <tr>
            {/* <th>#</th> */}
            <th>Measurement ID</th>
            <th>Device ID</th>
            <th>CO2 PPM</th>
            <th>time</th>
            <th>crowding</th>
            <th>inner location</th>
            {/* <th>measured at google place:</th> */}
        </tr>
    </thead>


function measurementRowKey(device: number): string {
    return `profile-measurement-entry-key-${device}`;
}


const mapMeasurementsToTableBody = (measurements: Array<UserInfoMeasurements>)/*: JSX.Element*/ => {
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
                {/* <td>{measurement.place.google_place_id}</td> */}
            </tr>
        )
    })
}


const measureTableBody = (measurements: Array<UserInfoMeasurements>): JSX.Element =>
    <tbody>
        {mapMeasurementsToTableBody(measurements)}
    </tbody>


interface MeasurementsTableProps {
    measurements: Array<UserInfoMeasurements>
}


export const MeasurementsTable: React.FC<MeasurementsTableProps> = (props: MeasurementsTableProps): JSX.Element => {
    // debugger;
    return (
        <>
            <Table striped bordered hover>
                {measurementTableHeader()}
                {measureTableBody(props.measurements)}
            </Table>
        </>
    )
}
