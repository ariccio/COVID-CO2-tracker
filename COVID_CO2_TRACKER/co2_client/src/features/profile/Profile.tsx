import React, {useEffect, useState} from 'react';

import { useSelector, useDispatch } from 'react-redux';
import {Table} from 'react-bootstrap';
import {selectUsername} from '../login/loginSlice';
import {queryUserInfo, UserInfoType, UserInfoDevice, UserInfoMeasurements} from '../../utils/QueryUserInfo';

interface ProfileProps {

}

const defaultUserInfo: UserInfoType = {
    user_info: {
        username: '',
        devices: [],
        measurements: []
    }
}

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

const measurementTableHeader = () =>
    <thead>
        <tr>
            <th>#</th>
            <th>Measurement ID</th>
            <th>Device ID</th>
            <th>CO2 PPM</th>
            <th>measurement time</th>
        </tr>
    </thead>

function deviceRowKey(device: number): string {
    return `profile-device-entry-key-${device}`;
}

function measurementRowKey(device: number): string {
    return `profile-measurement-entry-key-${device}`;
}

const mapDevicesToTableBody = (devices: Array<UserInfoDevice>)/*: JSX.Element*/ => {
    return devices.map((device, index: number) => {
        return (
            <tr key={deviceRowKey(device.device_id)}>
                <td>{index}</td>
                <td>{device.device_id}</td>
                <td>{device.serial}</td>
                <td>{device.device_model}</td>
                <td>{device.device_manufacturer}</td>
            </tr>
        )
    })
}

const mapMeasurementsToTableBody = (measurements: Array<UserInfoMeasurements>)/*: JSX.Element*/ => {
    return measurements.map((measurement, index: number) => {
        return (
            <tr key={measurementRowKey(measurement.measurement_id)}>
                <td>{index}</td>
                <td>{measurement.measurement_id}</td>
                <td>{measurement.device_id}</td>
                <td>{measurement.co2ppm}</td>
                <td>{measurement.measurementtime}</td>
            </tr>
        )
    })
}

const measureTableBody = (measurements: Array<UserInfoMeasurements>): JSX.Element =>
    <tbody>
        {mapMeasurementsToTableBody(measurements)}
    </tbody>

const deviceTableBody = (devices: Array<UserInfoDevice>): JSX.Element =>
    <tbody>
        {mapDevicesToTableBody(devices)}
    </tbody>


const renderDevices = (devices: Array<UserInfoDevice>): JSX.Element => {
    return (
        <>
            <h3>Devices</h3>
            <Table striped bordered hover>
                {deviceTableHeader()}
                {deviceTableBody(devices)}
            </Table>

        </>
    )
}

const renderMeasurements = (measurements: Array<UserInfoMeasurements>): JSX.Element => {
    return (
        <>
            <h3>measurements</h3>
            <Table striped bordered hover>
                {measurementTableHeader()}
                {measureTableBody(measurements)}
            </Table>
        </>
    )
}

export const Profile: React.FC<ProfileProps> = () => {
    debugger;
    const username = useSelector(selectUsername);

    const [userInfo, setUserInfo] = useState(defaultUserInfo);
    useEffect(() => {
        const userInfoPromise: Promise<UserInfoType> = queryUserInfo();
        userInfoPromise.then((userInfo) => {
            console.log(userInfo);
            setUserInfo(userInfo)
        })
    }, [])

    return (
        <>
            <h1>
                {username}'s profile'
                
            </h1>
            {renderDevices(userInfo.user_info.devices)}
            {renderMeasurements(userInfo.user_info.measurements)}
        </>
    )
}