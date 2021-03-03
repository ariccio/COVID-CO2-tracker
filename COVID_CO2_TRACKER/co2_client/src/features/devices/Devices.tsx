
import React, {useEffect, useState}  from 'react';
import {useSelector} from 'react-redux';
import {RouteComponentProps} from 'react-router-dom';
import {Button} from 'react-bootstrap';
import {UserInfoType, queryUserInfo, defaultUserInfo} from '../../utils/QueryUserInfo';
import {defaultDeviceInfoResponse, DeviceInfoResponse, queryDeviceInfo} from '../../utils/QueryDeviceInfo';
// import {DevicesTable} from './DevicesTable';
import {MeasurementsTable} from '../measurements/MeasurementsTable';
import {CreateManufacturerOrModel} from '../manufacturers/Manufacturers';

// import {devicesPath} from '../../paths/paths';
import { formatErrors } from '../../utils/ErrorObject';

import {selectSelectedModelName} from '../deviceModels/deviceModelsSlice';

import {CreateMyDeviceInstance} from '../create/CreateDeviceInstance';

interface deviceProps {
    deviceId: string
}

export function Device(props: RouteComponentProps<deviceProps>) {
    // console.log(props.match.params.deviceId)

    const [deviceInfo, setDeviceInfo] = useState(defaultDeviceInfoResponse);
    const [errorState, setErrorState] = useState('');
    useEffect(() => {
        const parsedDeviceID = parseInt(props.match.params.deviceId);
        if (isNaN(parsedDeviceID)) {
            return;
        }

        const deviceInfoPromise: Promise<DeviceInfoResponse> = queryDeviceInfo(parsedDeviceID);
        deviceInfoPromise.then((deviceInfoResponse) => {
            if (deviceInfoResponse.errors !== undefined) {
                setErrorState(formatErrors(deviceInfoResponse.errors));
            }
            // console.log(deviceInfoResponse);
            setDeviceInfo(deviceInfoResponse)
        }).catch((error) => {
            setErrorState(error.message);
        })
    }, [props.match.params.deviceId]);

    console.log(deviceInfo);
    if (errorState !== '') {
        return (
            <>
                <p>
                    Error loading device info for device {props.match.params.deviceId}!
                    Error: {errorState}
                </p>
            </>
        );
    }
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
    const [errorState, setErrorState] = useState('');
    const selectedModelName = useSelector(selectSelectedModelName);

    useEffect(() => {

        //TODO: should be in redux
        const userInfoPromise: Promise<UserInfoType> = queryUserInfo();
        userInfoPromise.then((userInfo) => {
            if (userInfo.errors !== undefined) {
                setNotLoggedIn(true);
                setErrorState(formatErrors(userInfo.errors));
                return;
            }
            // console.log(userInfo);
            setUserInfo(userInfo)
        }).catch((errors) => {
            // debugger;
            setErrorState(errors.message);
        })
    }, [])

    if (notLoggedIn) {
        return (
            <>
                <h1>
                    Not logged in!
                </h1>
                <p>
                    {errorState}
                </p>
            </>
        );
    }

    if (userInfo === defaultUserInfo) {
        if (errorState !== '') {
            return (
                <>
                    {errorState}
                </>
            );
        }
         return (
            <h3>
                Loading user info...
            </h3>
        );
    }

    return (
        <>
            <Button variant={createDeviceClicked ? "secondary" : "primary"} onClick={() => {setCreateClicked(!createDeviceClicked)}}>
                Add my device:
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

            <CreateMyDeviceInstance show={selectedModelName !== ''}/>
            

            <p>
                popular devices: (NOT IMPLEMENTED YET, will show all kinds of stats)
            </p>

            <p>
                {errorState !== '' ? `Errors: ${errorState}` : null}
            </p>

        </>
    )
}