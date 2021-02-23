
import React, {useEffect, useState}  from 'react';
import {Route, RouteComponentProps} from 'react-router-dom';

import {UserInfoType, queryUserInfo, defaultUserInfo} from '../../utils/QueryUserInfo';
import {defaultDeviceInfoResponse, DeviceInfoResponse, queryDeviceInfo} from '../../utils/QueryDeviceInfo';
import {DevicesTable} from './DevicesTable';
import {MeasurementsTable} from '../measurements/MeasurementsTable';
import {CreateManufacturerOrModel} from '../create/createManufacturerModel';

interface deviceProps {
    deviceId: string
}

export function Device(props: RouteComponentProps<deviceProps>) {
    // console.log(props.match.params.deviceId)

    const [deviceInfo, setDeviceInfo] = useState(defaultDeviceInfoResponse);
    useEffect(() => {
        const deviceInfoPromise: Promise<DeviceInfoResponse> = queryDeviceInfo(parseInt(props.match.params.deviceId));
        deviceInfoPromise.then((deviceInfoResponse) => {
            // console.log(deviceInfoResponse);
            setDeviceInfo(deviceInfoResponse)
        })
    }, [props.match.params.deviceId]);

    console.log(deviceInfo);
    return (
        <>
            {deviceInfo.device_model} - {deviceInfo.serial}'s measurements
            <MeasurementsTable measurements={deviceInfo.measurements}/>
        </>
    );
}



export const Devices: React.FC<{}> = () => {
    
    const [userInfo, setUserInfo] = useState(defaultUserInfo);

    useEffect(() => {
        const userInfoPromise: Promise<UserInfoType> = queryUserInfo();
        userInfoPromise.then((userInfo) => {
            // console.log(userInfo);
            setUserInfo(userInfo)
        })
    }, [])

    return (
        <>
            <h3>
                My devices:
            </h3>
        <DevicesTable devices={userInfo.user_info.devices}/>

        create a device:
        <CreateManufacturerOrModel/>


        <br>
        </br>
        <br>
        </br>
        <br>
        </br>
        <p>
            Selected device:
        </p>


        <Route path={'/devices/:deviceId'} component={Device}/>

        <p>
            popular devices: (NOT IMPLEMENTED YET, will show all kinds of stats)
        </p>
        </>
    )
}