import React, { useState, Suspense } from 'react';
import {Table, Button} from 'react-bootstrap';
import { useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';

import { useTranslation } from 'react-i18next';

import { devicesPath } from '../../paths/paths';
import { deleteRequestOptions } from '../../utils/DefaultRequestOptions';
import { ErrorObjectType } from '../../utils/ErrorObject';
import { fetchJSONWithChecks } from '../../utils/FetchHelpers';


// import {queryUserInfo, UserInfoType, defaultUserInfo} from '../../utils/QueryUserInfo';
import {SerializedSingleDeviceSerial, SerializedSingleMeasurement} from '../../utils/QueryDeviceInfo';
import { API_URL } from '../../utils/UrlPath';
import { defaultPlaceInfo, setPlacesInfoErrors, setPlacesInfoFromDatabase } from '../places/placesSlice';
import { updateUserInfo } from '../profile/Profile';

import {ShowMeasurementModal} from './ShowMeasurement';

const DELETE_MEASUREMENT_URL = (API_URL + '/measurement');



const MeasurementTableHeader = (props: {withDelete?: boolean, innerLocation?: InnerLocationDetails, withDevice?: boolean}) => {
    const [translate] = useTranslation();
    return (
        <thead>
            <tr>
                {/* <th>#</th> */}
                <th>{translate('id-and-details')}</th>
                {props.withDevice ? (<th>{translate('Device')}</th>) : null}
                <th>{translate('co2-ppm')}</th>
                <th>{translate('time')}</th>
                <th>{translate('crowding')}</th>
                <th>{translate('danger level')}</th>
                <th>{translate('rebreathed fraction')}</th>
                {props.innerLocation ? (<th>{translate('inner location')}</th>) : null}
                {props.withDelete ? (<th>{translate('delete measurement')}</th>) : null}
                {/* <th>measured at google place:</th> */}
            </tr>
        </thead>

    );
}


function measurementRowKey(measurement_id: string): string {
    return `profile-measurement-entry-key-${measurement_id}`;
}
    
interface DeleteDeviceResponse {
    errors?: Array<ErrorObjectType>
}

function deleteClickHandler(event: React.MouseEvent<HTMLElement, MouseEvent>, measurement: SerializedSingleMeasurement, dispatch: ReturnType<typeof useDispatch>) {
    event.preventDefault();
    event.stopPropagation();
    const fetchFailedCallback = async (awaitedResponse: Response): Promise<DeleteDeviceResponse> => {
        console.error("failed to delete the device!");
        return awaitedResponse.json();
    }

    const fetchSuccessCallback = async (awaitedResponse: Response): Promise<DeleteDeviceResponse> => {
        return awaitedResponse.json();
    }
    const defaultDeleteOptions = deleteRequestOptions();
    const thisDeleteMeasurements = (DELETE_MEASUREMENT_URL + '/' + measurement.id);
    const result = fetchJSONWithChecks(thisDeleteMeasurements, defaultDeleteOptions, 200, true, fetchFailedCallback, fetchSuccessCallback) as Promise<DeleteDeviceResponse>;
    result.then((response) => {
        if (response.errors !== undefined) {
            console.warn("failed to delete device, not refreshing profile.")
            return;
        }
        updateUserInfo(dispatch);
        dispatch(setPlacesInfoFromDatabase(defaultPlaceInfo));
        dispatch(setPlacesInfoErrors(''));
    }).catch((error) => {
        console.warn("device delete promise exception?");
        console.error(error);
        debugger;
    })
    // debugger;

}

const maybeDeleteButton = (measurement: SerializedSingleMeasurement, dispatch: ReturnType<typeof useDispatch>, withDelete?: boolean) => {
    if (withDelete) {
        return (
            <td>
                <Button variant="primary" onClick={(event) => {deleteClickHandler(event, measurement, dispatch);}}>
                    delete
                </Button>
            </td>
        )
    }
    // debugger;
    return null;
}


const maybeInnerLocation = (measurement: SerializedSingleMeasurement, innerLocation?: InnerLocationDetails) => {
    if (innerLocation) {
        // debugger;
        return (<td>{innerLocation.description}</td>);
    }
    // debugger;
    return null;
}

//TODO: extract to some kind of more generic risk stuff
const RiskRow = (props: {measurement: SerializedSingleMeasurement}) => {
    const [translate] = useTranslation();
    if (props.measurement.attributes.co2ppm < 400) {
        return (<td><i>{translate('Unreasonably low measurement')}</i></td>);
    }
    if (props.measurement.attributes.co2ppm < 500) {
        return (<td><p style={{color:"green"}}><b>{translate('Very low!')}</b></p></td>);
    }
    if (props.measurement.attributes.co2ppm < 600) {
        return (<td><p style={{color:"green"}}>{translate('Low')}</p></td>);
    }
    if (props.measurement.attributes.co2ppm < 700) {
        return (<td><p style={{color:"green"}}>{translate('Fairly low')}</p></td>);
    }
    if (props.measurement.attributes.co2ppm < 800) {
        return (<td><p>{translate('Acceptable')}</p></td>);
    }
    if (props.measurement.attributes.co2ppm < 1000) {
        return (<td><p>{translate('Marginal/Warning')}</p></td>)
    }
    if (props.measurement.attributes.co2ppm < 1200) {
        return (<td><p style={{color:"red"}}><b>{translate('Bad')}</b></p></td>);
    }
    if (props.measurement.attributes.co2ppm < 2000) {
        return (<td><p style={{color:"red"}}><b><u>{translate('High: Danger zone')}</u></b></p></td>);
    }
    if (props.measurement.attributes.co2ppm < 5000) {
        return (<td><p style={{color:"red"}}><b><u>{translate('Extremely high: danger zone')}</u></b></p></td>);
    }
    if (props.measurement.attributes.co2ppm < 30_000) {
        return (<td><p style={{color:"red"}}><b><u><i>Abysmal, <a href="https://www.fsis.usda.gov/sites/default/files/media_file/2020-08/Carbon-Dioxide.pdf">violates OSHA, must not remain this high over 8 hours, confirm meter calibration</a></i></u></b></p></td>);
    }
    return (<td><p style={{color:"red"}}><b><u><i>{translate('Immediate death or invalid measurement')}</i></u></b></p></td>);
}

const deviceIDOrSerialWithLink = (id: string, deviceSerials?: Array<SerializedSingleDeviceSerial>) => {
    // debugger;
    if (deviceSerials && (deviceSerials.length > 0)) {
        const found = deviceSerials.find((serialized, index) => {
            return serialized.id === id;
        })
        if (found) {
            return (
                <>
                    <td><Link to={`${devicesPath}/${id}`}>S#: {found.attributes.serial}</Link></td>
                </>
            )
        }
    }
    return (
        <>
            <td><Link to={`${devicesPath}/${id}`}>ID: {id}</Link></td>
        </>
    )
}

function percentRebreathedFromPPM(co2ppm: number): number {
    const GLOBAL_OUTDOOR = 420; // "Note ARANET4 meter calibrates to outdoor air assuming 420 ppm"
    const FRACTION_ADDED_TO_BREATH = 0.038; //"Ca = Volume fraction of CO2 added to exhaled breath"
    if (co2ppm < 0) {
        throw new Error("Invariant! co2ppm < 0");
    }
    const difference = co2ppm - GLOBAL_OUTDOOR;
    // debugger;
    const rebreathedAirFractionPpm = (difference/FRACTION_ADDED_TO_BREATH);
    const rebreathedAirPercent = rebreathedAirFractionPpm / 10_000;
    return rebreathedAirPercent;
}

const RebreathedFraction = (props: {co2ppm: number}) => {
    // For math, see:
    //  https://docs.google.com/spreadsheets/d/1AjFzhqM_NILYvZjgE8n0CvGZzYh04JpF_DO0phrOcFw
    //  https://onlinelibrary.wiley.com/doi/abs/10.1034/j.1600-0668.2003.00189.x
    const percent = percentRebreathedFromPPM(props.co2ppm);
    if (percent < 0) {
        return (
            <>
                <td>
                    co2ppm too low.
                </td>
            </>
        )
    }
    return (
        <>
            <td>
                {percent.toFixed(3)}%
            </td>
        </>
    )
}



const mapMeasurementsToTableBody = (measurements: Array<SerializedSingleMeasurement>, dispatch: ReturnType<typeof useDispatch>, setShowMeasurementModal: React.Dispatch<React.SetStateAction<boolean>>, setSelectedMeasurement: React.Dispatch<React.SetStateAction<string>>, withDelete?: boolean, innerLocation?: InnerLocationDetails, deviceSerials?: Array<SerializedSingleDeviceSerial>, withDevice?: boolean)/*: JSX.Element*/ => {
    if (measurements === undefined) {
        throw new Error(`measurements is undefined! This is a bug in MeasurementsTable.tsx. deviceSerials: ${deviceSerials?.toString()}`);
    }
    // debugger;
    return measurements.map((measurement, index: number) => {
        // if (measurement.place === undefined) {
        //     debugger;
        // }
        // debugger;
        // const maybeDeviceId = (measurement.relationships ?  : '')
        return (
            <tr key={measurementRowKey(measurement.id)}>
                {/* <td>{index}</td> */}
                <td><Button variant="primary" onClick={() => {setShowMeasurementModal(true); setSelectedMeasurement(measurement.id)}}>{measurement.id} details</Button></td>
                {withDevice ? deviceIDOrSerialWithLink(measurement.relationships.device.data.id, deviceSerials) : null}
                
                <td>{measurement.attributes.co2ppm}</td>
                {/* Displays the measurement as if it were taken in the timezone where the user currently is. It's painful to adjust the timezone according to the google places time offset, so this works for now. */}
                <td>{new Date(measurement.attributes.measurementtime).toString()}</td>
                <td>{measurement.attributes.crowding}</td>
                <Suspense fallback="loading translations...">
                    <RiskRow measurement={measurement}/>
                </Suspense>
                <RebreathedFraction co2ppm={measurement.attributes.co2ppm}/>
                {maybeInnerLocation(measurement, innerLocation)}
                {maybeDeleteButton(measurement, dispatch, withDelete)}
                {/* <td>{measurement.place.google_place_id}</td> */}
            </tr>
        )
    })
}


const measureTableBody = (measurements: Array<SerializedSingleMeasurement>, dispatch: ReturnType<typeof useDispatch>, setShowMeasurementModal: React.Dispatch<React.SetStateAction<boolean>>, setSelectedMeasurement: React.Dispatch<React.SetStateAction<string>>, withDelete?: boolean, innerLocation?: InnerLocationDetails, deviceSerials?: Array<SerializedSingleDeviceSerial>, withDevice?: boolean): JSX.Element =>
    <tbody>
        {mapMeasurementsToTableBody(measurements, dispatch, setShowMeasurementModal, setSelectedMeasurement, withDelete, innerLocation, deviceSerials, withDevice)}
    </tbody>


interface InnerLocationDetails {
    sub_location_id: number,
    description: string

}

interface MeasurementsTableProps {
    measurements: Array<SerializedSingleMeasurement>,
    withDelete?: boolean,
    innerLocation?: InnerLocationDetails,
    deviceSerials?: Array<SerializedSingleDeviceSerial>,
    withDevice?: boolean
}

// function testingFetch(measurementID: number): void {
//     const fetchCallback = async (awaitedResponse: Response): Promise<DeleteDeviceResponse> => {
//         return awaitedResponse.json();
//     }
//     const thisShowMeasurement = (SHOW_MEASUREMENT_URL + '/' + measurementID);
//     const result = fetchJSONWithChecks(thisShowMeasurement, userRequestOptions(), 200, true, fetchCallback, fetchCallback) as Promise<any>;
//     result.then((response) => {
//         if (response.errors !== undefined) {
//             console.error(formatErrors(response.errors));
//         }
//         console.log(response);
//         debugger;
//     }).catch((error) => {
//         console.error(error);
//         debugger;
//     })
// }


// withDelete enables rendering button to delete measurements.
// Allows reusability across components, with functionality to delete measurements on the users profile.
// I could do this lots of other ways. Hooks? But this is easy rn.
// Reading for later:
//  https://spicefactory.co/blog/2019/03/26/how-to-avoid-the-boolean-trap-when-designing-react-components/

export const MeasurementsTable: React.FC<MeasurementsTableProps> = (props: MeasurementsTableProps): JSX.Element => {
    // In theory I could eliminate the use of dispatch if there's no need to show the delete button, since I only use dispatch when users delete their own measurements.
    const dispatch = useDispatch();
    // debugger;

    const [showMeasurementModal, setShowMeasurementModal] = useState(false);
    const [selectedMeasurement, setSelectedMeasurement] = useState('');
    // const [selectedMeasurementObj, setSelectedMeasurementObj] = useState(undefined as SerializedSingleMeasurement | undefined);
    if (props.measurements === undefined) {
        debugger;
    }
    // if (props.measurements.length > 0) {
    //     testingFetch(props.measurements[0].id);
    // }

    // useEffect(() => {
    //     const found = props.measurements.find((measurement) => {
    //         return measurement.id === selectedMeasurement;
    //     });
    //     setSelectedMeasurementObj(found);
    // }, [selectedMeasurement])

    // debugger;
    return (
        <>
            <Suspense fallback="loading translations">
                <Table striped bordered hover>
                    <MeasurementTableHeader withDelete={props.withDelete} innerLocation={props.innerLocation} withDevice={props.withDevice} />
                    {measureTableBody(props.measurements, dispatch, setShowMeasurementModal, setSelectedMeasurement, props.withDelete, props.innerLocation, props.deviceSerials, props.withDevice)}
                </Table>
                <ShowMeasurementModal showMeasurementModal={showMeasurementModal} setShowMeasurementModal={setShowMeasurementModal} selectedMeasurement={selectedMeasurement} setSelectedMeasurement={setSelectedMeasurement}/>
            </Suspense>
        </>
    )
}
