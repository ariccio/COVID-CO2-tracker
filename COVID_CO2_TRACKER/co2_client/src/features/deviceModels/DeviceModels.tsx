import React, {useEffect, useState} from 'react';
// import { useSelector, useDispatch } from 'react-redux';
// import {Dropdown} from 'react-bootstrap';
import {useLocation} from 'react-router-dom';
import {RouteComponentProps} from 'react-router-dom';
// import {deviceModelsPath} from '../../paths/paths';
import {userRequestOptions} from '../../utils/DefaultRequestOptions';
import { fetchJSONWithChecks } from '../../utils/FetchHelpers';
import {API_URL} from '../../utils/UrlPath';
import {ErrorObjectType, formatErrors} from '../../utils/ErrorObject';

import {CreateDeviceModelModalDialog} from '../create/CreateDeviceModel';

interface DeviceModelsProps {
    deviceModelId: string
}

const SHOW_DEVICE_MODEL_URL = (API_URL + '/model');


interface QueryDeviceModelInfoResponse {
    model_id: number,
    name: string,
    manufacturer: number,
    manufacturer_name: string,
    count: number,
    measurement_count: number,
    errors?: Array<ErrorObjectType>

}

const defaultQueryDeviceModelInfoResponse: QueryDeviceModelInfoResponse = {
    model_id: -1,
    name: '',
    manufacturer: -1,
    manufacturer_name: '',
    count: -1,
    measurement_count: -1,
    errors: undefined
}

async function queryDeviceModelInfo(deviceModelId: string): Promise<any> {

    const fetchCallback = async (awaitedResponse: Response): Promise<any> => {
        console.log("TODO: strong types")
        return await awaitedResponse.json();
    }
    const result = fetchJSONWithChecks(`${SHOW_DEVICE_MODEL_URL}/${deviceModelId}`, userRequestOptions(), 200, true, fetchCallback, fetchCallback);
    return result;
    // try {
    //     // debugger;
    //     const rawResponse: Promise<Response> = fetch(`${SHOW_DEVICE_MODEL_URL}/${deviceModelId}`, userRequestOptions());
    //     const awaitedResponse = await rawResponse;
    //     // const jsonResponse = awaitedResponse.json();
    //     // const parsedJSONResponse = await jsonResponse;
    //     // console.log(parsedJSONResponse);
    //     if(fetchFailed(awaitedResponse, 200, true)) {
    //         debugger;
    //     }

    //     return await awaitedResponse.json();
    // }
    // catch(error) {
    //     fetchFilter(error);
    // }
}

const basicDeviceModelInfo = (deviceModelInfo: QueryDeviceModelInfoResponse, errorState: any) => {
    if (deviceModelInfo !== defaultQueryDeviceModelInfoResponse) {
        // debugger;
        return (
            <>
                <br/>
                model name: {deviceModelInfo.name}, <br/> 
                made by: {deviceModelInfo.manufacturer_name}, <br/>
                total devices of that model in database: {deviceModelInfo.count}, <br/>
                total measurements by devices of that model: {deviceModelInfo.measurement_count} <br/>
                {errorState !== '' ? errorState : null}
            </>
        );
    }
    if (errorState === '') {
        return (
            <p>
                <b>
                    <i>
                        Loading infor for device model from database...
                    </i>
                </b>
            </p>
        )
    }
    return (
        {errorState}
    );
} 



export const DeviceModels: React.FC<RouteComponentProps<DeviceModelsProps>> = (props: RouteComponentProps<DeviceModelsProps>) => {
    const location = useLocation();
    // const dispatch = useDispatch();

    const [deviceModelInfo, setDeviceModelInfo] = useState(defaultQueryDeviceModelInfoResponse);
    const [errorState, setErrorState] = useState('');
    const [showAddModel, setShowAddModel] = useState(location.pathname.endsWith('create'));
    useEffect(() => {
        if (props.match.params.deviceModelId !== undefined) {
            if (props.match.params.deviceModelId === 'create') {
                // history.pushState();
                setShowAddModel(true);
                return;
            }
            queryDeviceModelInfo(props.match.params.deviceModelId).then(response => {
                setDeviceModelInfo(response);
                if (response.errors !== undefined) {
                    setErrorState(formatErrors(response.errors));
                }
                debugger;
            }).catch((errors) => {
                debugger;
                setErrorState(errors.message);
                debugger;
            })
        }
    }, [props.match.params.deviceModelId])
    if (props.match.params.deviceModelId === undefined) {
        return (
            <>
                Will contain a page with stats by-device-model, eventually. <br/>
                
            </>
        );     
    }
    return (
        <>
            {/* <Route path={`${deviceModelsPath}/:deviceModelId`}> */}

            {/* </Route> */}
            <p>
                Will contain a page with stats by-device-model, eventually.
                You selected device model: {props.match.params.deviceModelId}
                {basicDeviceModelInfo(deviceModelInfo, errorState)}
                {showAddModel ? <CreateDeviceModelModalDialog showAddModel={showAddModel} setShowAddModel={setShowAddModel}/> : null}
            </p>
        </>
    )
}