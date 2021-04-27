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
        return (
            <>
                Measurement taken by device # <Link to={`${devicesPath}/${id}`}>{id}</Link>, serial # {deviceSerials[0]}
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


const renderModalBody = (errors: string, measurementInfo: ShowMeasurementResponse, deviceSerials: Array<SerializedSingleDeviceSerial>, deviceSerialsErrorState: string) => {
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
    debugger;
    console.log("hello");
    return (
        <>
            <Modal.Body>
                Measurement taken by: {measurementInfo.taken_by}
                {renderDeviceIDOrSerial(measurementInfo, deviceSerials, deviceSerialsErrorState)}
                Recorded CO2: {measurementInfo.data.data.attributes.co2ppm}
                Crowding (1-5): {measurementInfo.data.data.attributes.crowding}
                Measurement taken date and time: {measurementInfo.data.data.attributes.measurementtime}
                Measurement created in database time: {measurementInfo.data.data.attributes.created_at}
                Measurement last updated in database: {measurementInfo.data.data.attributes.updated_at}
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
            debugger;
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
            <Modal show={props.showMeasurementModal} onHide={() => {props.setShowMeasurementModal(false); props.setSelectedMeasurement('');} }>
                <ModalHeader measurementID={props.selectedMeasurement}/>
                <DivElem elementRef={elementRef}/>
                {renderModalBody(errors, measurementInfo, deviceSerials, deviceSerialsErrorState)}
            </Modal>

        </>
    )
}