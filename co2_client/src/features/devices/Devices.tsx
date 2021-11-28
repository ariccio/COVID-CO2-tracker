
import React, {useEffect, useState, Suspense}  from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {useParams, Link} from 'react-router-dom';
import {Button} from 'react-bootstrap';

import * as Sentry from "@sentry/browser"; // for manual error reporting.

import { useTranslation } from 'react-i18next';

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


const maybeRenderMeasurements = (deviceInfo: DeviceInfoResponse) => {
    if (deviceInfo.measurements.data === undefined) {
        console.log("measurements array is null, this is a bug, and this is an ugly hack to work around it. (Devices.tsx)");
        return (
            <div>
                <br/>
                <span>No measurements for device #{deviceInfo.device_id}.</span>
            </div>
        )
    }
    return (
        <div>
            <MeasurementsTable measurements={deviceInfo.measurements.data}/>
        </div>
    )
}

export function Device() {
    // console.log(props.match.params.deviceId)

    // const selectedModel = useSelector(selectSelectedModel);
    // const selectedDevice = useSelector(selectSelectedDevice);

    const [deviceInfo, setDeviceInfo] = useState(defaultDeviceInfoResponse);
    const [errorState, setErrorState] = useState('');
    const {deviceId} = useParams();
    if (deviceId === undefined) {
        debugger;

        throw new Error("Something wrong with react-router, deviceId is undefined in Device?");
    }
    useEffect(() => {
        const parsedDeviceID = parseInt(deviceId);
        if (isNaN(parsedDeviceID)) {
            return;
        }

        const deviceInfoPromise: Promise<DeviceInfoResponse> = queryDeviceInfo(parsedDeviceID);
        deviceInfoPromise.then((deviceInfoResponse) => {
            if (deviceInfoResponse.errors !== undefined) {
                //TODO: shouldn't get here, queryDeviceInfo throws.
                const formatted = formatErrors(deviceInfoResponse.errors);
                if (formatted.includes("webkit")) {
                    Sentry.captureMessage(formatted);
                }    
                setErrorState(formatted);
            }
            // console.log(deviceInfoResponse);
            setDeviceInfo(deviceInfoResponse);
        }).catch((error) => {
            // Some users are seeing weird errors in safari in spanish. Force report them.
            if (error.message.includes("webkit")) {
                Sentry.captureException(error);
            }
            setErrorState(error.message);
        })
    }, [deviceId]);

    console.table(deviceInfo);
    if (errorState !== '') {
        return (
            <div>
                <p>
                    Error loading device info for device {deviceId}!
                    Error: {errorState}
                </p>
            </div>
        );
    }
    console.warn("TODO: change to render more than first two measurements :)")
    return (
        <div>
            Model: "<Link to={deviceModelsPath + `/${deviceInfo.device_model_id}`}>{deviceInfo.device_model}</Link>" - serial #: "{deviceInfo.serial}" first ten measurements:
            {maybeRenderMeasurements(deviceInfo)}
            
        </div>
    );
}


const renderAddDeviceButton = (createDeviceClicked: boolean, setCreateClicked: React.Dispatch<React.SetStateAction<boolean>>, setShowAddDeviceInstance: React.Dispatch<React.SetStateAction<boolean>>, selectedModelName: string) => {
    return (
        <div>
            <Button variant={"primary"} onClick={() => {setCreateClicked(!createDeviceClicked); setShowAddDeviceInstance(true)}}>
                <span>
                    Add my {selectedModelName}:
                </span>
            </Button>
        </div>
    )
}

const ShowAddDevice = (props: {showAddDeviceInstance: boolean, setShowAddDeviceInstance: React.Dispatch<React.SetStateAction<boolean>>}) => {
    const [translate] = useTranslation();
    if (props.showAddDeviceInstance) {
        return (
            <div>
                <p>
                    {translate('Selected device:')}
                </p>
                
                <Suspense fallback="loading translations...">
                    <CreateMyDeviceInstance showAddDeviceInstance={props.showAddDeviceInstance} setShowAddDeviceInstance={props.setShowAddDeviceInstance}/>
                </Suspense>
            </div>
        )
    }
    return null;
}


const UnselectModelButton = (props: {selectedModelName: string}) => {
    const dispatch = useDispatch();
    const [translate] = useTranslation();
    return (
        <Button variant="secondary" onClick={() => {dispatch(setSelectedModel(-1)); dispatch(setSelectedModelName(''))}}>
            {translate('Unselect')} {props.selectedModelName}
        </Button>
    );
}


const selectModelOrUnselectModel = (selectedModelName: string, dispatch: ReturnType<typeof useDispatch>) => {
    if (selectedModelName === '') {
        return (
            <div>
                <CreateManufacturerOrModel/>
                <br/>
                <br/>
                <br/>
                <br/>
            </div>
        );
    }
    return (
        <div>
            <Suspense fallback="Loading translations...">
                <UnselectModelButton selectedModelName={selectedModelName}/>
            </Suspense>
            <br/>
            <br/>
        </div>
    )
}


const DevicesContainer: React.FC<{}> = () => {
    const [translate] = useTranslation();

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
            // Some users are seeing weird errors in safari in spanish. Force report them.
            if (errorState.includes("webkit")) {
                Sentry.captureMessage(errorState);
            }
            return (
                <div>
                    {translate('not-logged-in-or-error')}
                    {errorState}
                </div>
            );
        }
         return (
            <div>
                <h3>
                    Loading user info...
                </h3>
            </div>
        );
    }

    return (
        <div>
            <h3>
                {translate('add-devices-view-stats')}
            </h3>
            <br/>
            {selectModelOrUnselectModel(selectedModelName, dispatch)}
            {selectedModelName !== '' ?  renderAddDeviceButton(createDeviceClicked, setCreateClicked, setShowAddDeviceInstance, selectedModelName) : null}


            <br/>
            <br/>
            <br/>
            <Suspense fallback="loading translations...">
                <ShowAddDevice showAddDeviceInstance={showAddDeviceInstance} setShowAddDeviceInstance={setShowAddDeviceInstance}/>
            </Suspense>
            

            <p>
                <span>
                    TODO: show device instances table.
                </span>

                <span>
                    {/* Will need to refactor DevicesTable into something like UserDevicesTable (because it doesn't use a serializer) */}
                    popular devices: (NOT IMPLEMENTED YET, will show all kinds of stats)
                </span>
            </p>

            <p>
                {errorState !== '' ? `Errors: ${errorState}` : null}
            </p>

        </div>
    )
}

export const Devices = () => {
    return (
        <Suspense fallback="loading translations...">
            <DevicesContainer/>
        </Suspense>
    );
}