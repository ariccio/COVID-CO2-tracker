
import React, {useEffect, useState}  from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {RouteComponentProps, Link} from 'react-router-dom';
import {Button} from 'react-bootstrap';
import {defaultUserInfo} from '../../utils/QueryUserInfo';
import {defaultDeviceInfoResponse, DeviceInfoResponse, queryDeviceInfo} from '../../utils/QueryDeviceInfo';
// import {DevicesTable} from './DevicesTable';
import {MeasurementsTable} from '../measurements/MeasurementsTable';
import {CreateManufacturerOrModel} from '../manufacturers/Manufacturers';

// import {devicesPath} from '../../paths/paths';
import { formatErrors } from '../../utils/ErrorObject';

import {selectSelectedModelName, setSelectedModel, setSelectedModelName} from '../deviceModels/deviceModelsSlice';

import {CreateMyDeviceInstance} from '../create/CreateDeviceInstance';
import { updateUserInfo } from '../profile/Profile';
import { selectUserInfoErrorState, selectUserInfoState } from '../profile/profileSlice';
import { deviceModelsPath } from '../../paths/paths';
// import { selectSelectedManufacturer } from '../manufacturers/manufacturerSlice';

interface deviceProps {
    deviceId: string
}

export function Device(props: RouteComponentProps<deviceProps>) {
    // console.log(props.match.params.deviceId)

    // const selectedModel = useSelector(selectSelectedModel);
    // const selectedDevice = useSelector(selectSelectedDevice);

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
            setDeviceInfo(deviceInfoResponse);
        }).catch((error) => {
            setErrorState(error.message);
        })
    }, [props.match.params.deviceId]);

    console.table(deviceInfo);
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
            Model: "<Link to={deviceModelsPath + `/${deviceInfo.device_model_id}`}>{deviceInfo.device_model}</Link>" - serial #: "{deviceInfo.serial}" measurements:
            <MeasurementsTable measurements={deviceInfo.measurements.data}/>
        </>
    );
}


const renderAddDeviceButton = (createDeviceClicked: boolean, setCreateClicked: React.Dispatch<React.SetStateAction<boolean>>, setShowAddDeviceInstance: React.Dispatch<React.SetStateAction<boolean>>, selectedModelName: string) => {
    return (
        <>
            <Button variant={"primary"} onClick={() => {setCreateClicked(!createDeviceClicked); setShowAddDeviceInstance(true)}}>
                Add my {selectedModelName}:
            </Button>
        </>
    )
}

const renderShowAddDevice = (showAddDeviceInstance: boolean, setShowAddDeviceInstance: React.Dispatch<React.SetStateAction<boolean>>) => {
    if (showAddDeviceInstance) {
        return (
            <>
                <p>
                    Selected device:
                </p>

                <CreateMyDeviceInstance showAddDeviceInstance={showAddDeviceInstance} setShowAddDeviceInstance={setShowAddDeviceInstance}/>
            </>
        )
    }
    return null;
}


const unselectModelButton = (selectedModelName: string, dispatch: ReturnType<typeof useDispatch>) =>
    <Button variant="secondary" onClick={() => {dispatch(setSelectedModel(-1)); dispatch(setSelectedModelName(''))}}>
        Unselect {selectedModelName}
    </Button>


const selectModelOrUnselectModel = (selectedModelName: string, dispatch: ReturnType<typeof useDispatch>) => {
    if (selectedModelName === '') {
        return (
            <>
                <CreateManufacturerOrModel/>
                <br/>
                <br/>
                <br/>
                <br/>
            </>
        );
    }
    return (
        <>
            {unselectModelButton(selectedModelName, dispatch)}
            <br/>
            <br/>
        </>
    )
}


export const Devices: React.FC<{}> = () => {
    
    // const [userInfo, setUserInfo] = useState(defaultUserInfo);
    const [createDeviceClicked, setCreateClicked] = useState(false);
    // const [notLoggedIn, setNotLoggedIn] = useState(false);
    // const [errorState, setErrorState] = useState('');
    const selectedModelName = useSelector(selectSelectedModelName);
    // const selectedManufacturer = useSelector(selectSelectedManufacturer);
    const userInfo = useSelector(selectUserInfoState);
    const errorState = useSelector(selectUserInfoErrorState);


    //Buggy. It might be better if these were in redux anyways.
    const [showAddDeviceInstance, setShowAddDeviceInstance] = useState((selectedModelName !== '') && createDeviceClicked);
    const dispatch = useDispatch();
    useEffect(() => {
        updateUserInfo(dispatch);
    }, [dispatch])
    // debugger;
    if (userInfo === defaultUserInfo) {
        if (errorState !== '') {
            return (
                <>
                    Not logged in, or error:
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
            <h3>
                Add your devices and view stats
            </h3>
            <br/>
            {selectModelOrUnselectModel(selectedModelName, dispatch)}
            {selectedModelName !== '' ?  renderAddDeviceButton(createDeviceClicked, setCreateClicked, setShowAddDeviceInstance, selectedModelName) : null}


            <br/>
            <br/>
            <br/>
            {renderShowAddDevice(showAddDeviceInstance, setShowAddDeviceInstance)}
            

            <p>
                popular devices: (NOT IMPLEMENTED YET, will show all kinds of stats)
            </p>

            <p>
                {errorState !== '' ? `Errors: ${errorState}` : null}
            </p>

        </>
    )
}