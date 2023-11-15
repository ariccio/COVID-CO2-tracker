import { useState, Suspense } from 'react';
import {Table, Button} from 'react-bootstrap';
import { useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import * as Sentry from "@sentry/react";

import { useTranslation } from 'react-i18next';

import { devicesPath } from '../../paths/paths';
import { deleteRequestOptions } from '../../utils/DefaultRequestOptions';
import { ErrorObjectType } from '../../utils/ErrorObject';
import { fetchJSONWithChecks } from '../../utils/FetchHelpers';


// import {queryUserInfo, UserInfoType, defaultUserInfo} from '../../utils/QueryUserInfo';
import {SerializedSingleDeviceSerial, SerializedSingleMeasurement} from '../../utils/DeviceInfoTypes';
import { API_URL } from '../../utils/UrlPath';
import { defaultPlaceInfo, setPlacesInfoErrors, setPlacesInfoFromDatabase } from '../places/placesSlice';
import { updateUserInfo } from '../profile/Profile';

import {ShowMeasurementModal} from './ShowMeasurement';
import { percentRebreathedFromPPM, rebreathedToString } from '../../utils/Rebreathed';
import { AppDispatch } from '../../app/store';

const DELETE_MEASUREMENT_URL = (API_URL + '/measurement');



const MeasurementTableHeader = (props: {withDelete?: boolean, innerLocation?: InnerLocationDetails, withDevice?: boolean}) => {
    const [translate] = useTranslation();
    return (
        <thead>
            <tr>
                <th>{translate('id-and-details')}</th>
                {props.withDevice ? (<th>{translate('Device')}</th>) : null}
                <th>CO2&#8346;&#8346;&#8344;</th>
                <th>{translate('time')}</th>
                <th>{translate('crowding')}</th>
                <th>{translate('danger level')}</th>
                <th>{translate('rebreathed fraction')}</th>
                {props.innerLocation ? (<th>{translate('inner location')}</th>) : null}
                {props.withDelete ? (<th>{translate('delete measurement')}</th>) : null}
            </tr>
        </thead>
    );
}


function measurementRowKey(measurement_id: number): string {
    return `profile-measurement-entry-key-${measurement_id}`;
}

function measurementMapKey(measurement_id: number): string {
    return `profile-measurement-map-key-${measurement_id}`;
}
    
interface DeleteDeviceResponse {
    errors?: Array<ErrorObjectType>
}

function deleteClickHandler(event: React.MouseEvent<HTMLElement, MouseEvent>, measurement: SerializedSingleMeasurement, dispatch: AppDispatch) {
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
    if (measurement.id === null) {
        throw new Error("tried to delete measurement with NULL id.");
    }
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

const MaybeDeleteButton = (props:{measurement: SerializedSingleMeasurement, withDelete?: boolean}) => {
    const dispatch = useDispatch();
    if (props.withDelete) {
        return (
            <td>
                <Button variant="primary" onClick={(event) => {deleteClickHandler(event, props.measurement, dispatch);}}>
                    delete
                </Button>
            </td>
        )
    }
    // debugger;
    return null;
}


const MaybeInnerLocation = (props: {measurement: SerializedSingleMeasurement, innerLocation?: InnerLocationDetails}) => {
    if (props.innerLocation) {
        // debugger;
        return (<td>{props.innerLocation.description}</td>);
    }
    // debugger;
    return null;
}

const RED_COLOR_OBJECT_STYLE = {color: 'red'};
const GREEN_COLOR_OBJECT_STYLE = {color:"green"};

const AboveFiveThousand = () => {
    return (
        <td><p style={RED_COLOR_OBJECT_STYLE}><b><u><i>Abysmal, <a href="https://www.fsis.usda.gov/sites/default/files/media_file/2020-08/Carbon-Dioxide.pdf">violates OSHA, must not remain this high over 8 hours, confirm meter calibration</a></i></u></b></p></td>
    );
}

//TODO: extract to some kind of more generic risk stuff
const RiskRow = (props: {co2ppm: number}) => {
    const [translate] = useTranslation();
    if (props.co2ppm < 400) {
        return (<td><i>{translate('Unreasonably low measurement')}</i></td>);
    }
    if (props.co2ppm < 500) {
        return (<td><p style={GREEN_COLOR_OBJECT_STYLE}><b>{translate('Very low!')}</b></p></td>);
    }
    if (props.co2ppm < 600) {
        return (<td><p style={GREEN_COLOR_OBJECT_STYLE}>{translate('Low')}</p></td>);
    }
    if (props.co2ppm < 700) {
        return (<td><p style={GREEN_COLOR_OBJECT_STYLE}>{translate('Fairly low')}</p></td>);
    }
    if (props.co2ppm < 800) {
        return (<td><p>{translate('Acceptable')}</p></td>);
    }
    if (props.co2ppm < 1000) {
        return (<td><p>{translate('Marginal/Warning')}</p></td>)
    }
    if (props.co2ppm < 1200) {
        return (<td><p style={RED_COLOR_OBJECT_STYLE}><b>{translate('Bad')}</b></p></td>);
    }
    if (props.co2ppm < 2000) {
        return (<td><p style={RED_COLOR_OBJECT_STYLE}><b><u>{translate('High: Danger zone')}</u></b></p></td>);
    }
    if (props.co2ppm < 5000) {
        return (<td><p style={RED_COLOR_OBJECT_STYLE}><b><u>{translate('Extremely high: danger zone')}</u></b></p></td>);
    }
    if (props.co2ppm < 30_000) {
        return (
            <AboveFiveThousand/>
        )
    }
    return (<td><p style={RED_COLOR_OBJECT_STYLE}><b><u><i>{translate('Immediate death or invalid measurement')}</i></u></b></p></td>);
}

const CrowdingOrRealtime = (props: {measurement: SerializedSingleMeasurement}) => {
    if (props.measurement.attributes.crowding !== null) {
        //NOTE TO SELF: right now, serializing the extra measurement info is getting super slow. So Just assume FOR NOW that anything without crowding is realtime.
        if (props.measurement.attributes.extra_measurement_info) {
            debugger;
            throw new Error(`Bad combination of crowding and realtime! ${JSON.stringify(props.measurement)}`);
        }
        return (
            <td>{props.measurement.attributes.crowding}</td>
        );
    }
    if (props.measurement.attributes.extra_measurement_info === undefined) {
        //NOTE TO SELF: right now, serializing the extra measurement info is getting super slow. So Just assume FOR NOW that anything without crowding is realtime.
        return (
            <td><p style={RED_COLOR_OBJECT_STYLE}>Realtime measurement!</p></td>
        );
    }
    debugger;
    if (props.measurement.attributes.extra_measurement_info !== null) {
        if (props.measurement.attributes.crowding !== null) {
            throw new Error(`Bad combination of realtime and crowding! ${JSON.stringify(props.measurement)}`);
        }
        if (props.measurement.attributes.extra_measurement_info.realtime !== null) {
            if (!(props.measurement.attributes.extra_measurement_info.realtime)) {
                Sentry.captureMessage(`Strange combination of information for measurement ${props.measurement.id}. Full object: ${JSON.stringify(props.measurement)}`)
                return (
                    <td>Not realtime?</td>
                )
            }
            return (
                <td><p style={RED_COLOR_OBJECT_STYLE}>Realtime measurement!</p></td>
            );
        }
        throw new Error("Missing realtime?");
    }
    throw new Error("Bad combination, no crowding, no realtime.");
}

const TableCellWithIDLink = (props: {id: number}) => {
    const linkToDevice = `${devicesPath}/${props.id}`;
    return (
        <td><Link to={linkToDevice}>ID: {props.id}</Link></td>
    )
}

let warnedAlready = false;

const DeviceIDOrSerialWithLink = (props: {id: number | null, deviceSerials?: Array<SerializedSingleDeviceSerial>}) => {
    // debugger;
    if (props.id === null) {
        throw new Error("Rendering empty device?");
    }
    if (props.deviceSerials === undefined) {
        // debugger;
        if (!warnedAlready) {
            console.warn("This is not a bug. Device serials aren't necessarily provided with every call. That said, I believe It's a missing feature.")
            warnedAlready = true;
        }
        return (
            <TableCellWithIDLink id={props.id}/>
        );    
    }
    if (props.deviceSerials.length === 0) {
        // Not loaded yet.
        return (
            <TableCellWithIDLink id={props.id}/>
        );
    }
    const found = props.deviceSerials.find((serialized) => {
        return serialized.id === props.id;
    });
    if (found) {
        return (
            <td><Link to={`${devicesPath}/${props.id}`}>S#: {found.attributes.serial}</Link></td>
        )
    }
    return (
        <TableCellWithIDLink id={props.id}/>
    );
}


const RebreathedFraction = (props: {co2ppm: number}) => {
    const percent = percentRebreathedFromPPM(props.co2ppm);
    const display = rebreathedToString(percent);
    return (
        <td>
            {display}
        </td>
    )
}

const ShowMeasurementButtonTableData = (props: {setShowMeasurementModal: React.Dispatch<React.SetStateAction<boolean>>, setSelectedMeasurement: React.Dispatch<React.SetStateAction<number | null>>, id: number}) => {
    return (
        <td><Button variant="primary" onClick={() => {props.setShowMeasurementModal(true); props.setSelectedMeasurement(props.id)}}>#{props.id}</Button></td>
    );
}

const MapMeasurementsToTableBody = (props: {measurements: Array<SerializedSingleMeasurement>, setShowMeasurementModal: React.Dispatch<React.SetStateAction<boolean>>, setSelectedMeasurement: React.Dispatch<React.SetStateAction<number | null>>, withDelete?: boolean, innerLocation?: InnerLocationDetails, deviceSerials?: Array<SerializedSingleDeviceSerial>, withDevice?: boolean})/*: JSX.Element*/ => {
    if (props.measurements === undefined) {
        throw new Error(`measurements is undefined! This is a bug in MeasurementsTable.tsx. deviceSerials: ${props.deviceSerials?.toString()}`);
    }
    if (props.measurements.length === 0) {
        // debugger;
        return null;
    }

    const measurementMapCallback = (measurement: SerializedSingleMeasurement): JSX.Element => {
        if (measurement.id === null) {
            return badMeasurement(measurement);
        }
        return (
            <SingleMeasurementTableRow measurement={measurement} setSelectedMeasurement={props.setSelectedMeasurement} setShowMeasurementModal={props.setShowMeasurementModal} deviceSerials={props.deviceSerials} innerLocation={props.innerLocation} withDelete={props.withDelete} withDevice={props.withDevice} key={measurementMapKey(measurement.id)}/>
        );
    };
    return (
        <>
            {props.measurements.map(measurementMapCallback)}
        </>
    );
}


const MeasureTableBody = (props: {measurements: Array<SerializedSingleMeasurement>, setShowMeasurementModal: React.Dispatch<React.SetStateAction<boolean>>, setSelectedMeasurement: React.Dispatch<React.SetStateAction<number | null>>, withDelete?: boolean, innerLocation?: InnerLocationDetails, deviceSerials?: Array<SerializedSingleDeviceSerial>, withDevice?: boolean}): JSX.Element =>
    <tbody>
        <MapMeasurementsToTableBody measurements={props.measurements} setShowMeasurementModal={props.setShowMeasurementModal} setSelectedMeasurement={props.setSelectedMeasurement} withDelete={props.withDelete} innerLocation={props.innerLocation} deviceSerials={props.deviceSerials} withDevice={props.withDevice}/>
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
    // debugger;

    const [showMeasurementModal, setShowMeasurementModal] = useState(false);
    const [selectedMeasurement, setSelectedMeasurement] = useState(null as (number | null));
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
        <div>
            <Suspense fallback="loading translations">
                <Table striped bordered hover>
                    <MeasurementTableHeader withDelete={props.withDelete} innerLocation={props.innerLocation} withDevice={props.withDevice} />
                    <MeasureTableBody measurements={props.measurements} setShowMeasurementModal={setShowMeasurementModal} setSelectedMeasurement={setSelectedMeasurement} withDelete={props.withDelete} innerLocation={props.innerLocation} deviceSerials={props.deviceSerials} withDevice={props.withDevice}/>
                </Table>
                <ShowMeasurementModal showMeasurementModal={showMeasurementModal} setShowMeasurementModal={setShowMeasurementModal} selectedMeasurement={selectedMeasurement} setSelectedMeasurement={setSelectedMeasurement}/>
            </Suspense>
        </div>
    )
}
function badMeasurement(measurement: SerializedSingleMeasurement) {
    console.error("Corrupted measurement lacks ID, simply rendering null...");
    Sentry.captureMessage(`Corrupted measurement? ${JSON.stringify(measurement)}`);
    return (
        <tr>
            Bad measurement info!!
        </tr>
    );
}

const DateTimeData = (props: {measurementtime: string}) => {
    /* Displays the measurement as if it were taken in the timezone where the user currently is. It's painful to adjust the timezone according to the google places time offset, so this works for now. */
    return (
        <td>{new Date(props.measurementtime).toLocaleString()}</td>
    );
}

function SingleMeasurementTableRow( props: {
    measurement: SerializedSingleMeasurement, 
    setShowMeasurementModal: React.Dispatch<React.SetStateAction<boolean>>,
    setSelectedMeasurement: React.Dispatch<React.SetStateAction<number | null>>,
    withDelete?: boolean | undefined,
    innerLocation?: InnerLocationDetails | undefined,
    deviceSerials?: SerializedSingleDeviceSerial[] | undefined,
    withDevice?: boolean | undefined}): JSX.Element {
    return ( 
        <tr key={measurementRowKey(props.measurement.id!)}>
            <ShowMeasurementButtonTableData id={props.measurement.id!} setSelectedMeasurement={props.setSelectedMeasurement} setShowMeasurementModal={props.setShowMeasurementModal} />
            {props.withDevice ? <DeviceIDOrSerialWithLink id={props.measurement.relationships.device.data.id} deviceSerials={props.deviceSerials} /> : null}

            <td>{props.measurement.attributes.co2ppm}</td>
            <DateTimeData measurementtime={props.measurement.attributes.measurementtime}/>
            <CrowdingOrRealtime measurement={props.measurement} />
            <Suspense fallback="loading translations...">
                <RiskRow co2ppm={props.measurement.attributes.co2ppm} />
            </Suspense>
            <RebreathedFraction co2ppm={props.measurement.attributes.co2ppm} />
            <MaybeInnerLocation measurement={props.measurement} innerLocation={props.innerLocation} />
            <MaybeDeleteButton measurement={props.measurement} withDelete={props.withDelete} />
        </tr>
    );
}

