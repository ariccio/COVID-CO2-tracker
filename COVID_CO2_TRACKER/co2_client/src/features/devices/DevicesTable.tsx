import React from 'react';
import {Table} from 'react-bootstrap';
import {UserInfoDevice} from '../../utils/QueryDeviceInfo';
import {Link} from 'react-router-dom';

import {devicesPath} from '../../paths/paths';

const deviceTableHeader = () =>
    <thead>
        <tr>
            <th>#</th>
            <th>Device ID</th>
            <th>Serial #</th>
            <th>Device model</th>
            <th>Device manufacturer</th>
        </tr>
    </thead>

function deviceRowKey(device: number): string {
    return `profile-device-entry-key-${device}`;
}


const mapDevicesToTableBody = (devices: Array<UserInfoDevice>)/*: JSX.Element*/ => {
    return devices.map((device, index: number) => {
        return (
            <tr key={deviceRowKey(device.device_id)}>                
                <td><Link to={`${devicesPath}/${device.device_id}`}>{index}</Link></td>
                <td><Link to={`${devicesPath}/${device.device_id}`}>{device.device_id}</Link></td>
                <td><Link to={`${devicesPath}/${device.device_id}`}>{device.serial}</Link></td>
                <td><Link to={`${devicesPath}/${device.device_id}`}>{device.device_model}</Link></td>
                <td><Link to={`${devicesPath}/${device.device_id}`}>{device.device_manufacturer}</Link></td>
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
