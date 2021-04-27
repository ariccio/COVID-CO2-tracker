import React, { useEffect, useState, useRef } from 'react';
import {Modal} from 'react-bootstrap';
import { formatErrors } from '../../utils/ErrorObject';
import { fetchSingleDeviceName, SerializedSingleDeviceSerial } from '../../utils/QueryDeviceInfo';
import { Link } from 'react-router-dom';
import { devicesPath } from '../../paths/paths';

// import {SerializedSingleMeasurement} from '../../utils/QueryDeviceInfo';

import {ShowMeasurementResponse, queryMeasurementInfo, defaultShowMeasurementResponse} from '../../utils/QueryMeasurementInfo';
import { useSelector } from 'react-redux';
import { selectMapsAPIKey, selectMapsAPIKeyErrorState } from '../google/googleSlice';
// import { PlaceDetails } from '../places/PlaceDetails';
import {placesPath} from '../../paths/paths';

interface ShowMeasurementModalProps {
    showMeasurementModal: boolean,
    setShowMeasurementModal: React.Dispatch<React.SetStateAction<boolean>>,
    selectedMeasurement: string,
    setSelectedMeasurement: React.Dispatch<React.SetStateAction<string>>,
}
const ModalHeader = (props: {measurementID: string}) =>
    <Modal.Header closeButton>
        <Modal.Title>Measurement #{props.measurementID}</Modal.Title>
    </Modal.Header>

const renderDeviceIDOrSerial = (measurementInfo: ShowMeasurementResponse, deviceSerials: Array<SerializedSingleDeviceSerial>, deviceSerialsErrorState: string) => {
    const id = measurementInfo.data.data.relationships.device.data.id;
    if (deviceSerialsErrorState !== '') {
        return (
            <>
                Error getting serial # for device # <Link to={`${devicesPath}/${id}`}>{id}</Link>
                Error details: {deviceSerialsErrorState}
            </>
        );
    }
    if (deviceSerials.length > 0) {
        // debugger;
        return (
            <>
                Measurement taken by device # <Link to={`${devicesPath}/${id}`}>{id}</Link>, serial # {deviceSerials[0].attributes.serial}
            </>
        )
    }
    return (
        <>
            Measurement taken by device # <Link to={`${devicesPath}/${id}`}>{id}</Link>, loading serial #...
        </>
    )
}

const DivElem = (props: {elementRef: React.MutableRefObject<HTMLDivElement | null>}) => {
    return (
        <div id='ghost-map' ref={props.elementRef}>
        </div>
    );
}

const renderPlaceDetails = (measurementInfo: ShowMeasurementResponse, elementRef: React.MutableRefObject<HTMLDivElement | null>, mapsAPIKey: string, mapsAPIKeyErrorState: string) => {
    if (mapsAPIKey === '') {
        if (mapsAPIKeyErrorState !== '') {
            return (
                <>
                    Error loading google maps/places API key. Error details: {mapsAPIKeyErrorState}
                    (Can't show place details)
                </>
            )
        }
        return (
            <>
                Google maps/places API key not loaded at this point in program. Sorry! TODO: just load it. Duh. (It probably should be loaded here)
            </>
        )
    }
    if (elementRef === null) {
        return (
            <>
                elementRef is null. Cannot render place details! (google requires a div element to maybe render a map, for whatever reason)
            </>
        )
    }
    return (
        <>
            Will have PROPER place data here when I fix the damn bug.
            In mean time, here's a link to it: <Link to={`${placesPath}/${measurementInfo.place_id}`}>{measurementInfo.place_id}</Link>
            {/* <PlaceDetails mapsAPIKey={mapsAPIKey} placeId={measurementInfo.place_id} divRef={elementRef}/> */}
        </>
    )
}

const renderModalBody = (errors: string, measurementInfo: ShowMeasurementResponse, deviceSerials: Array<SerializedSingleDeviceSerial>, deviceSerialsErrorState: string, elementRef: React.MutableRefObject<HTMLDivElement | null>, mapsAPIKey: string, mapsAPIKeyErrorState: string) => {
    if (errors !== '') {
        return (
            <>
                Error while loading measurement info. Details: {errors}
            </>
        )
    }

    if (measurementInfo === defaultShowMeasurementResponse) {
        return (
            <>
                Loading info for measurement...
            </>
        )
    }
    // debugger;
    console.log("hello");
    return (
        <>
            <Modal.Body>
                Measurement taken by: {measurementInfo.taken_by}
                <br/>
                <br/>
                {renderDeviceIDOrSerial(measurementInfo, deviceSerials, deviceSerialsErrorState)}
                <br/>
                <br/>
                Recorded CO2: {measurementInfo.data.data.attributes.co2ppm}
                <br/>
                <br/>
                Crowding (1-5): {measurementInfo.data.data.attributes.crowding}
                <br/>
                <br/>
                Measurement taken date and time: {new Date(measurementInfo.data.data.attributes.measurementtime).toString()}
                <br/>
                <br/>
                Measurement created in database time: {new Date(measurementInfo.data.data.attributes.created_at).toString()}
                <br/>
                <br/>
                Measurement last updated in database: {new Date(measurementInfo.data.data.attributes.updated_at).toString()}
                {/* <br/> */}
                {/* <br/> */}
                {/* Measurement place_id: {measurementInfo.place_id} */}
                <br/>
                <br/>
                {renderPlaceDetails(measurementInfo, elementRef, mapsAPIKey, mapsAPIKeyErrorState)}
            </Modal.Body>

        </>
    )
}

export const ShowMeasurementModal: React.FC<ShowMeasurementModalProps> = (props: ShowMeasurementModalProps) => {

    const mapsAPIKey = useSelector(selectMapsAPIKey);
    const mapsAPIKeyErrorState = useSelector(selectMapsAPIKeyErrorState);

    const [measurementInfo, setMeasurementInfo] = useState(defaultShowMeasurementResponse);

    const [errors, setErrors] = useState('');

    const [deviceSerialsErrorState, setDeviceSerialsErrorState] = useState('');
    const [deviceSerials, setDeviceSerials] = useState([] as Array<SerializedSingleDeviceSerial>);
    const elementRef = useRef(null as HTMLDivElement | null);

    useEffect(() => {
        if (props.selectedMeasurement === '') {
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
            setErrors(String(error));
            setMeasurementInfo(defaultShowMeasurementResponse);
            return;
        })

    }, [props.selectedMeasurement]);

    useEffect(() => {
        if (measurementInfo === defaultShowMeasurementResponse) {
            return;
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
        <>
            <Modal show={props.showMeasurementModal} onHide={() => {props.setShowMeasurementModal(false);} }>
                <ModalHeader measurementID={props.selectedMeasurement}/>
                <DivElem elementRef={elementRef}/>
                {renderModalBody(errors, measurementInfo, deviceSerials, deviceSerialsErrorState, elementRef, mapsAPIKey, mapsAPIKeyErrorState)}
            </Modal>

        </>
    )
}