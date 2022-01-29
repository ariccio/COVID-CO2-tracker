import React, {Suspense} from 'react';
import {Table, Button} from 'react-bootstrap';
import {Link} from 'react-router-dom';
import { useTranslation } from 'react-i18next';


import {UserInfoDevice} from '../../utils/DeviceInfoTypes';
import {deviceModelsPath, devicesPath} from '../../paths/paths';
import {deleteRequestOptions} from '../../utils/DefaultRequestOptions';
import { API_URL } from '../../utils/UrlPath';
import { fetchJSONWithChecks } from '../../utils/FetchHelpers';
import { ErrorObjectType, formatErrors } from '../../utils/ErrorObject';
import { updateUserInfo } from '../profile/Profile';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../app/store';

const DeviceTableHeader = () => {
    const [translate] = useTranslation();
    return (
        <thead>
            <tr>
                <th>#</th>
                <th>{translate("Device ID")}</th>
                <th>{translate("Serial #")}</th>
                <th>{translate("Device model")}</th>
                <th>{translate("Device manufacturer")}</th>
                <th></th>
            </tr>
        </thead>
    );
}

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

const handleDeleteDeviceClick = (event: React.MouseEvent<HTMLElement, MouseEvent>, deviceId: number, dispatch: AppDispatch) => {
    event.stopPropagation();
    event.preventDefault();
    const result = deleteDevice(deviceId);
    result.then((response) => {
        if (response.errors !== undefined) {
            alert(formatErrors(response.errors));
            return;
        }
        console.table(response);
        updateUserInfo(dispatch);
    })

}

const mapDevicesToTableBody = (devices: Array<UserInfoDevice>, dispatch: AppDispatch)/*: JSX.Element*/ => {
    return devices.map((device, index: number) => {
        return (
            <tr key={deviceRowKey(device.device_id)}>                
                <td><Link to={`${devicesPath}/${device.device_id}`}>{index}</Link></td>
                <td><Link to={`${devicesPath}/${device.device_id}`}>{device.device_id}</Link></td>
                <td><Link to={`${devicesPath}/${device.device_id}`}>{device.serial}</Link></td>
                <td><Link to={`${deviceModelsPath}/${device.device_model_id}`}>{device.device_model}</Link></td>
                <td><Link to={`${devicesPath}/${device.device_id}`}>{device.device_manufacturer}</Link></td>
                <td><Button onClick={(event) => handleDeleteDeviceClick(event, device.device_id, dispatch)}>Delete device?</Button></td>
            </tr>
        )
    })
}

const deviceTableBody = (devices: Array<UserInfoDevice>, dispatch: AppDispatch): JSX.Element =>
    <tbody>
        {mapDevicesToTableBody(devices, dispatch)}
    </tbody>


interface DevicesTableProps {
    devices: Array<UserInfoDevice>
}

//devices: Array<UserInfoDevice>
export const DevicesTable: React.FC<DevicesTableProps> = (props: DevicesTableProps) => {
    const dispatch = useDispatch();
    if (props.devices === undefined) {
        throw new Error("props.devices is undefined! This is a bug in DevicesTable.tsx.")
    }
    return (
        <div>
            <Table striped bordered hover>
                <Suspense fallback="Loading translations...">
                    <DeviceTableHeader/>
                </Suspense>
                {deviceTableBody(props.devices, dispatch)}
            </Table>

        </div>
    )
}
