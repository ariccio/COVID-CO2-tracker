import React from 'react';
import {Table, Button} from 'react-bootstrap';
import {UserInfoDevice} from '../../utils/QueryDeviceInfo';
import {Link} from 'react-router-dom';

import {deviceModelsPath, devicesPath} from '../../paths/paths';
import {deleteRequestOptions} from '../../utils/DefaultRequestOptions';
import { API_URL } from '../../utils/UrlPath';
import { fetchJSONWithChecks } from '../../utils/FetchHelpers';
import { ErrorObjectType, formatErrors } from '../../utils/ErrorObject';

const deviceTableHeader = () =>
    <thead>
        <tr>
            <th>#</th>
            <th>Device ID</th>
            <th>Serial #</th>
            <th>Device model</th>
            <th>Device manufacturer</th>
            <th></th>
        </tr>
    </thead>

function deviceRowKey(device: number): string {
    return `profile-device-entry-key-${device}`;
}

interface DeleteDeviceResponse {

    errors?: Array<ErrorObjectType>
}


const DELETE_DEVICE_URL = (API_URL + '/device');

async function deleteDevice(deviceId: number): Promise<DeleteDeviceResponse> {
    const defaultDeleteOptions = deleteRequestOptions();
    
    const fetchFailedCallback = async (awaitedResponse: Response): Promise<DeleteDeviceResponse> => {
        console.error(`failed to delete device! ${deviceId}`);
        return awaitedResponse.json();
    }

    const fetchSuccessCallback = async (awaitedResponse: Response): Promise<DeleteDeviceResponse> => {
        return awaitedResponse.json();
    }
    const thisDeviceDelete = (DELETE_DEVICE_URL + `/${deviceId}`);
    const result = fetchJSONWithChecks(thisDeviceDelete, defaultDeleteOptions, 200, true, fetchFailedCallback, fetchSuccessCallback) as Promise<DeleteDeviceResponse>;
    return result;
}

const handleDeleteDeviceClick = (event: React.MouseEvent<HTMLElement, MouseEvent>, deviceId: number) => {
    event.stopPropagation();
    event.preventDefault();
    const result = deleteDevice(deviceId);
    result.then((response) => {
        if (response.errors !== undefined) {
            alert(formatErrors(response.errors));
            return;
        }
        console.log(response);
    })

}

const mapDevicesToTableBody = (devices: Array<UserInfoDevice>)/*: JSX.Element*/ => {
    return devices.map((device, index: number) => {
        return (
            <tr key={deviceRowKey(device.device_id)}>                
                <td><Link to={`${devicesPath}/${device.device_id}`}>{index}</Link></td>
                <td><Link to={`${devicesPath}/${device.device_id}`}>{device.device_id}</Link></td>
                <td><Link to={`${devicesPath}/${device.device_id}`}>{device.serial}</Link></td>
                <td><Link to={`${deviceModelsPath}/${device.device_model_id}`}>{device.device_model}</Link></td>
                <td><Link to={`${devicesPath}/${device.device_id}`}>{device.device_manufacturer}</Link></td>
                <td><Button onClick={(event) => handleDeleteDeviceClick(event, device.device_id)}>Delete device?</Button></td>
            </tr>
        )
    })
}

const deviceTableBody = (devices: Array<UserInfoDevice>): JSX.Element =>
    <tbody>
        {mapDevicesToTableBody(devices)}
    </tbody>


interface DevicesTableProps {
    devices: Array<UserInfoDevice>
}

//devices: Array<UserInfoDevice>
export const DevicesTable: React.FC<DevicesTableProps> = (props: DevicesTableProps) => {
    return (
        <>
            <Table striped bordered hover>
                {deviceTableHeader()}
                {deviceTableBody(props.devices)}
            </Table>

        </>
    )
}
