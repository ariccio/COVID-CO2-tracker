import React, {useEffect, useState, Suspense} from 'react';
// import { useSelector, useDispatch } from 'react-redux';
// import {Dropdown} from 'react-bootstrap';
import {useLocation} from 'react-router-dom';
import {RouteComponentProps} from 'react-router-dom';

import { useTranslation } from 'react-i18next';


// import {deviceModelsPath} from '../../paths/paths';
import {userRequestOptions} from '../../utils/DefaultRequestOptions';
import { fetchJSONWithChecks } from '../../utils/FetchHelpers';
import {API_URL} from '../../utils/UrlPath';
import {ErrorObjectType, formatErrors} from '../../utils/ErrorObject';

import {CreateDeviceModelModalDialog} from '../create/CreateDeviceModel';
import { SerializedSingleMeasurement } from '../../utils/QueryDeviceInfo';
import { MeasurementsTable } from '../measurements/MeasurementsTable';

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

interface ModelMeasurementsResponse {
    measurements: {
        data: Array<SerializedSingleMeasurement>
    },
    errors?: Array<ErrorObjectType>
}

const queryDeviceModelMeasurements = (url: string): Promise<ModelMeasurementsResponse> => {
    const fetchCallback = async (awaitedResponse: Response): Promise<ModelMeasurementsResponse> => {
        return awaitedResponse.json();
    }
    return fetchJSONWithChecks(url, userRequestOptions(), 200, true, fetchCallback, fetchCallback) as Promise<ModelMeasurementsResponse>;
}

const BasicDeviceModelInfo = (props: {deviceModelInfo: QueryDeviceModelInfoResponse}) => {
    const [translate] = useTranslation();
    if (props.deviceModelInfo !== defaultQueryDeviceModelInfoResponse) {
        // debugger;
        return (
            <>
                <br/>
                {translate('model name:')} {props.deviceModelInfo.name}, <br/> 
                {translate('made by:')} {props.deviceModelInfo.manufacturer_name}, <br/>
                {translate("total-models-in-database")} {props.deviceModelInfo.count}, <br/>
                {translate("total-modelmeasurement")} {props.deviceModelInfo.measurement_count} <br/>
            </>
        );
    }
    return (
        <p>
            <b>
                <i>
                    Loading info for device model from database...
                </i>
            </b>
        </p>
    )
} 


const measurements = (modelMeasurements: ModelMeasurementsResponse | null) => {
    if (modelMeasurements === null) {
        return (
            <>
                Loading measurements...
            </>
        )
    }
    // debugger;
    if (modelMeasurements.measurements.data === undefined) {
        console.log("measurements array is null, this is a bug, and this is an ugly hack to work around it. (DeviceModels.tsx)");
        return (
            <>
                <br/>
                <span>No measurements for this model.</span>
            </>
        )
    }
    return (
        <MeasurementsTable measurements={modelMeasurements.measurements.data} withDevice/>
    )
}


export const DeviceModels: React.FC<RouteComponentProps<DeviceModelsProps>> = (props: RouteComponentProps<DeviceModelsProps>) => {
    const location = useLocation();
    // const dispatch = useDispatch();

    const [deviceModelInfo, setDeviceModelInfo] = useState(defaultQueryDeviceModelInfoResponse);
    const [errorState, setErrorState] = useState('');
    const [showAddModel, setShowAddModel] = useState(location.pathname.endsWith('create'));

    const [modelMeasurements, setModelMeasurements] = useState(null as ModelMeasurementsResponse | null);
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
                // debugger;
            }).catch((errors) => {
                // debugger;
                setErrorState(errors.message);
                // debugger;
            })
        }
    }, [props.match.params.deviceModelId]);
    useEffect(() => {
        if (deviceModelInfo === defaultQueryDeviceModelInfoResponse) {
            return;
        }
        const modelMeasurementURL = (API_URL + `/model/${deviceModelInfo.model_id}/measurements`);
        const resultPromise = queryDeviceModelMeasurements(modelMeasurementURL);
        resultPromise.then((result) => {
            if (result.errors !== undefined) {
                setErrorState(formatErrors(result.errors));
                return;
            }
            // debugger;
            setModelMeasurements(result);
        }).catch((error) => {
            // debugger;
            setErrorState(error.message);
            // debugger;
        })
    }, [deviceModelInfo])
    if (props.match.params.deviceModelId === undefined) {
        return (
            <>
                No model selected. <br/>
                
            </>
        );     
    }

    if (errorState !== '') {
        return (
            <>
                <br/>
                Error: {errorState}
                <br/>
                <br/>
            </>
        );    
    }
    return (
        <>
            {/* <Route path={`${deviceModelsPath}/:deviceModelId`}> */}

            {/* </Route> */}
            <>
                You selected device model: {props.match.params.deviceModelId}
                <Suspense fallback="Loading translation...">
                    <BasicDeviceModelInfo deviceModelInfo={deviceModelInfo} />
                </Suspense>
                <Suspense fallback="loading translations...">
                    {showAddModel ? <CreateDeviceModelModalDialog showAddModel={showAddModel} setShowAddModel={setShowAddModel}/> : null}
                </Suspense>
                {measurements(modelMeasurements)}
            </>
        </>
    )
}