import {useEffect, useState, Suspense} from 'react';
// import { useSelector, useDispatch } from 'react-redux';
// import {Dropdown} from 'react-bootstrap';
import {useLocation} from 'react-router-dom';
import {useParams} from 'react-router-dom';

import { useTranslation } from 'react-i18next';


// import {deviceModelsPath} from '../../paths/paths';
import {userRequestOptions} from '../../utils/DefaultRequestOptions';
import { fetchJSONWithChecks } from '../../utils/FetchHelpers';
import {API_URL} from '../../utils/UrlPath';
import {ErrorObjectType, exceptionToErrorObject, formatErrors} from '../../utils/ErrorObject';

import {CreateDeviceModelModalDialog} from '../create/CreateDeviceModel';
import { SerializedSingleMeasurement } from '../../utils/DeviceInfoTypes';
import { MeasurementsTable } from '../measurements/MeasurementsTable';

const SHOW_DEVICE_MODEL_URL = (API_URL + '/model');


interface DeviceModelAdminComments {

    /*
        admin_comments: Array(1)
            0: {id: 1, body: 'hey hoe', author_id: 1}
     */
    id: number,
    body: string,
    author_id: number
}

interface QueryDeviceModelInfoResponse {
    admin_comments: DeviceModelAdminComments[] | null,
    model_id: number,
    name: string,
    manufacturer: number,
    manufacturer_name: string,
    count: number,
    measurement_count: number,
    errors?: Array<ErrorObjectType>

}

const defaultQueryDeviceModelInfoResponse: QueryDeviceModelInfoResponse = {
    admin_comments: null,
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
        console.log("TODO: strong types");

        /*
            {model_id: 2, name: 'Contoso 1', manufacturer: 3, count: 1, measurement_count: 0, …}
            admin_comments: Array(1)
                0: {id: 1, body: 'hey hoe', author_id: 1}
            count: 1
            manufacturer: 3
            manufacturer_name: "Contoso"
            measurement_count: 0
            model_id: 2
            name: "Contoso 1"
        */
        return await awaitedResponse.json();
    }

    const fetchFailedCallback = async (awaitedResponse: Response): Promise<any> => {
        
        //enclosing function does not expect throw here, checks for errors itself.
        return await awaitedResponse.json();
    }

    //throw new Error(`API key fetch failed: ${formatErrors(jsonResponse.errors)}`);
    const result = fetchJSONWithChecks(`${SHOW_DEVICE_MODEL_URL}/${deviceModelId}`, userRequestOptions(), 200, true, fetchFailedCallback, fetchCallback);
    return result;
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


const AdminComment = (comment: DeviceModelAdminComments) => {
    return (
        <>
            Admin comment #{comment.id}: {comment.body} <br/> 
        </>
    )
}

const MaybeAdminComments = (props: {admin_comments: DeviceModelAdminComments[] | null}) => {
    if (props.admin_comments === null) {
        return null;
    }
    if (props.admin_comments.length === 0) {
        return null;
    }
    return (
        <>
        {props.admin_comments.map((comment) => AdminComment(comment))}
        </>
    );
}

const MaybeShowLimitNote = (props: {measurement_count: number}) => {
    if (props.measurement_count > 200) {
        return (
            <>
                {/* TODO: FIX */}
                Currently showing only up to 200 until I speed up THIS part of the backend a bit :) <br/>
            </>
        )
    }
    return null;
}

const BasicDeviceModelInfo = (props: {deviceModelInfo: QueryDeviceModelInfoResponse}) => {
    const [translate] = useTranslation();
    if (props.deviceModelInfo !== defaultQueryDeviceModelInfoResponse) {
        // debugger;
        return (
            <span>
                <br/>
                {translate('model name:')} {props.deviceModelInfo.name}, <br/> 
                {translate('made by:')} {props.deviceModelInfo.manufacturer_name}, <br/>
                {translate("total-models-in-database")} {props.deviceModelInfo.count}, <br/>
                {translate("total-modelmeasurement")} {props.deviceModelInfo.measurement_count} <br/>
                <MaybeAdminComments admin_comments={props.deviceModelInfo.admin_comments}/>
                <MaybeShowLimitNote measurement_count={props.deviceModelInfo.measurement_count}/>
            </span>
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
            <div>
                <span>
                    Loading measurements...
                </span>
            </div>
        )
    }
    // debugger;
    if (modelMeasurements.measurements.data === undefined) {
        console.log("measurements array is null, this is a bug, and this is an ugly hack to work around it. (DeviceModels.tsx)");
        return (
            <div>
                <br/>
                <span>No measurements for this model.</span>
            </div>
        )
    }
    return (
        <MeasurementsTable measurements={modelMeasurements.measurements.data} withDevice/>
    )
}


export const DeviceModels = () => {
    const location = useLocation();
    // const dispatch = useDispatch();
    const {deviceModelId} = useParams();
    

    const [deviceModelInfo, setDeviceModelInfo] = useState(defaultQueryDeviceModelInfoResponse);
    const [errorState, setErrorState] = useState('');
    const [showAddModel, setShowAddModel] = useState(location.pathname.endsWith('create'));

    const [modelMeasurements, setModelMeasurements] = useState(null as ModelMeasurementsResponse | null);
    useEffect(() => {
        if (deviceModelId !== undefined) {
            if (deviceModelId === 'create') {
                // history.pushState();
                setShowAddModel(true);
                return;
            }
            queryDeviceModelInfo(deviceModelId).then(response => {
                setDeviceModelInfo(response);
                // debugger;
                if (response.errors !== undefined) {
                    debugger;
                    setErrorState(formatErrors(response.errors));
                }
            }).catch((error) => {
                // debugger;
                setErrorState(formatErrors([exceptionToErrorObject(error)]));
            })
        }
    }, [deviceModelId]);
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
            setErrorState(formatErrors([exceptionToErrorObject(error)]));
            // debugger;
        })
    }, [deviceModelInfo])
    if (deviceModelId === undefined) {
        return (
            <div>
                <span>
                    No model selected. <br/>
                    
                </span>
            </div>
        );     
    }

    if (errorState !== '') {
        return (
            <div>
                <span>
                    <br/>
                    Error! Message: {errorState}
                    <br/>
                    <br/>
                </span>
            </div>
        );    
    }
    return (
        <div>
            {/* <Route path={`${deviceModelsPath}/:deviceModelId`}> */}

            {/* </Route> */}
            <div>
                You selected device model: {deviceModelId}
                <Suspense fallback="Loading translation...">
                    <BasicDeviceModelInfo deviceModelInfo={deviceModelInfo} />
                </Suspense>
                <Suspense fallback="loading translations...">
                    {showAddModel ? <CreateDeviceModelModalDialog showAddModel={showAddModel} setShowAddModel={setShowAddModel}/> : null}
                </Suspense>
                {measurements(modelMeasurements)}
            </div>
        </div>
    )
}