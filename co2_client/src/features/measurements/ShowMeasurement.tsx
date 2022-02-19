import React, { useEffect, useState, useRef, Suspense } from 'react';
import {Modal} from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { devicesPath } from '../../paths/paths';

// import {SerializedSingleMeasurement} from '../../utils/QueryDeviceInfo';
import { formatErrors } from '../../utils/ErrorObject';
import { fetchSingleDeviceName } from '../../utils/QueryDeviceInfo';
import {SerializedSingleDeviceSerial} from '../../utils/DeviceInfoTypes';


import {queryMeasurementInfo} from '../../utils/QueryMeasurementInfo';
import {ShowMeasurementResponse, defaultShowMeasurementResponse} from '../../utils/MeasurementInfoTypes';

import { useSelector } from 'react-redux';
import { selectMapsAaPeEyeKey, selectMapsAaaPeeEyeKeyErrorState } from '../google/googleSlice';
// import { PlaceDetails } from '../places/PlaceDetails';
import {placesPath} from '../../paths/paths';
import { percentRebreathedFromPPM, rebreathedToString } from '../../utils/Rebreathed';

interface ShowMeasurementModalProps {
    showMeasurementModal: boolean,
    setShowMeasurementModal: React.Dispatch<React.SetStateAction<boolean>>,
    selectedMeasurement: number | null,
    setSelectedMeasurement: React.Dispatch<React.SetStateAction<number | null>>,
}
const ModalHeader = (props: {measurementID: number | null}) => {
    if (props.measurementID === null) {
        console.warn("Rendering null measureement modal header?");
        return (
            <Modal.Header closeButton>
                <Modal.Title>Measurement (null?)</Modal.Title>
            </Modal.Header>
        );
    }
    return (
        <Modal.Header closeButton>
            <Modal.Title>Measurement #{props.measurementID}</Modal.Title>
        </Modal.Header>
    );
}

const DeviceIDOrSerial = (props: {measurementInfo: ShowMeasurementResponse, deviceSerials: Array<SerializedSingleDeviceSerial>, deviceSerialsErrorState: string}) => {
    const [translate] = useTranslation();
    const id = props.measurementInfo.data.data.relationships.device.data.id;
    if (id === null) {
        throw new Error("rendering empty device??");
    }
    if (props.deviceSerialsErrorState !== '') {
        return (
            <div>
                Error getting serial # for device # <Link to={`${devicesPath}/${id}`}>{id}</Link>
                Error details: {props.deviceSerialsErrorState}
            </div>
        );
    }
    if (props.deviceSerials.length > 0) {
        // debugger;
        return (
            <div>
                {translate("measurement-by-device")} <Link to={`${devicesPath}/${id}`}>{id}</Link>, {translate("Serial #")} {props.deviceSerials[0].attributes.serial}
            </div>
        )
    }
    return (
        <div>
            {translate("measurement-by-device")} <Link to={`${devicesPath}/${id}`}>{id}</Link>, loading {translate("Serial #")}...
        </div>
    )
}

const DivElem = (props: {elementRef: React.MutableRefObject<HTMLDivElement | null>}) => {
    return (
        <div id='ghost-map' ref={props.elementRef}>
        </div>
    );
}

const renderPlaceDetails = (measurementInfo: ShowMeasurementResponse, elementRef: React.MutableRefObject<HTMLDivElement | null>, mapsAaaPeeEyeKey: string, mapsAaaPeeEyeKeyErrorState: string) => {
    if (mapsAaaPeeEyeKey === '') {
        if (mapsAaaPeeEyeKeyErrorState !== '') {
            return (
                <div>
                    Error loading google maps/places API key. Error details: {mapsAaaPeeEyeKeyErrorState}
                    (Can't show place details)
                </div>
            )
        }
        return (
            <div>
                Google maps/places API key not loaded at this point in program. Sorry! TODO: just load it. Duh. (It probably should be loaded here)
            </div>
        )
    }
    if (elementRef === null) {
        return (
            <div>
                elementRef is null. Cannot render place details! (google requires a div element to maybe render a map, for whatever reason)
            </div>
        )
    }
    return (
        <div>
            Will have PROPER place data here when I fix the damn bug.
            In mean time, here's a link to it: <Link to={`${placesPath}/${measurementInfo.place_id}`}>{measurementInfo.place_id}</Link>
            {/* <PlaceDetails placeId={measurementInfo.place_id} divRef={elementRef}/> */}
        </div>
    )
}

const RenderModalBody = (props: {errors: string, measurementInfo: ShowMeasurementResponse, deviceSerials: Array<SerializedSingleDeviceSerial>, deviceSerialsErrorState: string, elementRef: React.MutableRefObject<HTMLDivElement | null>, mapsAaaPeeEyeKey: string, mapsAaaPeeEyeKeyErrorState: string}) => {
    const [translate] = useTranslation();
    const percent = percentRebreathedFromPPM(props.measurementInfo.data.data.attributes.co2ppm);
    const displayRebreathed = rebreathedToString(percent);
    if (props.errors !== '') {
        return (
            <div>
                Error while loading measurement info. Details: {props.errors}
            </div>
        )
    }

    if (props.measurementInfo === defaultShowMeasurementResponse) {
        return (
            <div>
                Loading info for measurement...
            </div>
        )
    }
    // debugger;
    // console.log("hello");
    return (
        <div>
            <Modal.Body>
                {translate("Measurement taken by")}: {props.measurementInfo.taken_by}
                <br/>
                <br/>
                <Suspense fallback="Loading translations...">
                    <DeviceIDOrSerial measurementInfo={props.measurementInfo} deviceSerials={props.deviceSerials} deviceSerialsErrorState={props.deviceSerialsErrorState}/>
                </Suspense>
                <br/>
                {translate("Recorded CO2")}: {props.measurementInfo.data.data.attributes.co2ppm}
                <br/>
                <br/>
                {translate("crowding-level")}: {props.measurementInfo.data.data.attributes.crowding}
                <br/>
                <br/>
                {translate("Measurement taken date and time")}: {new Date(props.measurementInfo.data.data.attributes.measurementtime).toString()}
                <br/>
                <br/>
                {translate("Measurement created in database time")}: {new Date(props.measurementInfo.data.data.attributes.created_at).toString()}
                <br/>
                <br/>
                {translate("Measurement last updated in database")}: {new Date(props.measurementInfo.data.data.attributes.updated_at).toString()}
                {/* <br/> */}
                {/* <br/> */}
                {/* Measurement place_id: {measurementInfo.place_id} */}
                <br/>
                <br/>
                {translate('rebreathed fraction')}: {displayRebreathed}
                
                <br/>
                <br/>
                {renderPlaceDetails(props.measurementInfo, props.elementRef, props.mapsAaaPeeEyeKey, props.mapsAaaPeeEyeKeyErrorState)}
            </Modal.Body>

        </div>
    )
}

export const ShowMeasurementModal: React.FC<ShowMeasurementModalProps> = (props: ShowMeasurementModalProps) => {

    const mapsAaPeeEyeKey = useSelector(selectMapsAaPeEyeKey);
    const mapsAaaPeeEyeKeyErrorState = useSelector(selectMapsAaaPeeEyeKeyErrorState);

    const [measurementInfo, setMeasurementInfo] = useState(defaultShowMeasurementResponse);

    const [errors, setErrors] = useState('');

    const [deviceSerialsErrorState, setDeviceSerialsErrorState] = useState('');
    const [deviceSerials, setDeviceSerials] = useState([] as Array<SerializedSingleDeviceSerial>);
    const elementRef = useRef(null as HTMLDivElement | null);

    useEffect(() => {
        if (props.selectedMeasurement === null) {
            return;
        }
        const result = queryMeasurementInfo(props.selectedMeasurement);
        result.then((resultValue) => {
            if (resultValue.errors !== undefined) {
                console.warn(`Failed to query measurement info for ${props.selectedMeasurement}!`);
                setErrors(formatErrors(resultValue.errors));
                setMeasurementInfo(defaultShowMeasurementResponse);
                return;
            }
            setMeasurementInfo(resultValue);
        }).catch((error) => {
            console.error("some kind of error in fetch");
            // debugger;
            setErrors(JSON.stringify(error));
            setMeasurementInfo(defaultShowMeasurementResponse);
            return;
        })

    }, [props.selectedMeasurement]);

    useEffect(() => {
        if (measurementInfo === defaultShowMeasurementResponse) {
            return;
        }
        if (measurementInfo.data.data.relationships.device.data.id === null) {
            throw new Error("showing measurement with a null device ID? Shouldn't happen, should not get to this point with a default response.");
        }
        const result = fetchSingleDeviceName(measurementInfo.data.data.relationships.device.data.id);
        result.then((promiseResult) => {
            if (promiseResult.errors !== undefined) {
                console.error(`Failed to get device serial for device ${measurementInfo.data.data.relationships.device.data.id}`);
                setDeviceSerialsErrorState(formatErrors(promiseResult.errors));
                setDeviceSerials([]);
                return;
            }
            // debugger;
            setDeviceSerials(promiseResult.devices.data);
            return;
        }).catch((error) => {
            console.error("some kind of error fetching device serial");
            setDeviceSerialsErrorState(String(error));
            setDeviceSerials([]);
            return;
        })
    }, [measurementInfo])

    // if (errors !== '') {
    //     return (
    //         <Modal show={props.showMeasurementModal} onHide={() => {props.setShowMeasurementModal(false); props.setSelectedMeasurement('');} }>
    //             <ModalHeader measurementID={props.selectedMeasurement}/>
                
    //         </Modal>
    //     );
    // }
    return (
        <div>
            <Modal show={props.showMeasurementModal} onHide={() => {props.setShowMeasurementModal(false);} }>
                <ModalHeader measurementID={props.selectedMeasurement}/>
                <DivElem elementRef={elementRef}/>
                <Suspense fallback="Loading translation">
                    <RenderModalBody errors={errors} measurementInfo={measurementInfo} deviceSerials={deviceSerials} deviceSerialsErrorState={deviceSerialsErrorState} elementRef={elementRef} mapsAaaPeeEyeKey={mapsAaPeeEyeKey} mapsAaaPeeEyeKeyErrorState={mapsAaaPeeEyeKeyErrorState}/>
                </Suspense>
            </Modal>

        </div>
    )
}