
import React, {useEffect, useState}  from 'react';
import {Route, RouteComponentProps} from 'react-router-dom';
import {Button} from 'react-bootstrap';
import {UserInfoType, queryUserInfo, defaultUserInfo} from '../../utils/QueryUserInfo';
import {defaultDeviceInfoResponse, DeviceInfoResponse, queryDeviceInfo} from '../../utils/QueryDeviceInfo';
// import {DevicesTable} from './DevicesTable';
import {MeasurementsTable} from '../measurements/MeasurementsTable';
import {CreateManufacturerOrModel} from '../manufacturers/Manufacturers';

import {devicesPath} from '../../paths/paths';

interface deviceProps {
    deviceId: string
}

export function Device(props: RouteComponentProps<deviceProps>) {
    // console.log(props.match.params.deviceId)

    const [deviceInfo, setDeviceInfo] = useState(defaultDeviceInfoResponse);
    useEffect(() => {
        const parsedDeviceID = parseInt(props.match.params.deviceId);
        if (isNaN(parsedDeviceID)) {
            return;
        }

        const deviceInfoPromise: Promise<DeviceInfoResponse> = queryDeviceInfo(parsedDeviceID);
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
    const [createDeviceClicked, setCreateClicked] = useState(false);
    const [notLoggedIn, setNotLoggedIn] = useState(false);
    useEffect(() => {

        //TODO: should be in redux
        const userInfoPromise: Promise<UserInfoType | null> = queryUserInfo();
        userInfoPromise.then((userInfo) => {
            if (userInfo === null) {
                setNotLoggedIn(true);
                return;
            }
            // console.log(userInfo);
            setUserInfo(userInfo)
        })
    }, [])

    if (notLoggedIn) {
        return (
            <h1>
                Not logged in!
            </h1>
        )
    }

    if (userInfo === defaultUserInfo) {
         return (
            <h3>
                Loading...
            </h3>
        )
    }

    return (
        <>
            <Button variant={createDeviceClicked ? "secondary" : "primary"} onClick={() => {setCreateClicked(!createDeviceClicked)}}>
                create a device:
            </Button>
            <br/>
            <br/>
            <br/>
            {createDeviceClicked ? <CreateManufacturerOrModel/> : null}


            <br/>
            <br/>
            <br/>
            <p>
                Selected device:
            </p>


            <Route path={`${devicesPath}/:deviceId`} component={Device}/>

            <p>
                popular devices: (NOT IMPLEMENTED YET, will show all kinds of stats)
            </p>
        </>
    )
}