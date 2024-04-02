import * as Sentry from "@sentry/browser"; // for manual error reporting.


import { HighestMeasurementsResponse, basicMeasurement, basicPlace, basicSublocation } from "../stats/HighestMeasurements";
import { DeviceIDOrSerialWithLink } from "./MeasurementsTable";
import { Link } from "react-router-dom";
import { placesPath } from "../../paths/paths";
import { Suspense } from "react";
import { useTranslation } from "react-i18next";
import { Table } from "react-bootstrap";



const HighestMeasurementTableHeader = () => {
    const [translate] = useTranslation();
    return (
        <thead>
            <tr>
                <th>&#128219;</th>
                <th>{translate('Device')}</th>
                <th>CO2&#8346;&#8346;&#8344;</th>
                {/* https://decodeunicode.org/en/u+02282 */}
                <th>&#8834;</th>
                <th>Place</th>
                <th>&#9202;</th>                
            </tr>
        </thead>
    );
}

function measurementRowKey(measurement_id: number): string {
    return `profile-highest-measurement-entry-key-${measurement_id}`;
}

function sublocationIDToSublocation(sublocation_id: number, sublocationsList: basicSublocation[]): basicSublocation | null {
    const found = sublocationsList.find((sublocation) => sublocation.id === sublocation_id);
    if (found === undefined) {
        Sentry.captureMessage(`sublocation with id ${sublocation_id} not found in sublocationsList ${JSON.stringify(sublocationsList)}`);
        return null;
    }
    return found;
}

function sublocationWithPlaceIDToPlace(sublocation: basicSublocation, placesList: basicPlace[]): basicPlace | null {
    const found = placesList.find((place) => place.id === sublocation.place_id);
    if (found === undefined) {
        Sentry.captureMessage(`place with place_id ${sublocation.place_id} not found in placesList ${JSON.stringify(placesList)}`);
        return null;
    }
    return found;
}

function copilotSublocationNotInList(measurement: basicMeasurement): JSX.Element {
    if (measurement === undefined) {
        console.log("measurement is undefined");
        return <></>;
    }
    return (
        <tr key={measurementRowKey(measurement.id)}>
            <td>ID (for now): {measurement.id}</td>
            <td><DeviceIDOrSerialWithLink id={measurement.device_id} /></td>
            <td>{measurement.co2ppm}</td>
            <td>Sublocation not found</td>
            <td>N/A</td>
        </tr>
    );
}

function copilotPlaceNotInList(measurement: basicMeasurement, sublocation: basicSublocation): JSX.Element {
    return (
        <tr key={measurementRowKey(measurement.id)}>
            <td>ID (for now): {measurement.id}</td>
            <td><DeviceIDOrSerialWithLink id={measurement.device_id} /></td>
            <td>{measurement.co2ppm}</td>
            <td>{sublocation.description}</td>
            <td>place not found</td>
        </tr>
    );
}



// | null because some typescript fuckwittery?
function measurementCallback(measurement: basicMeasurement, placesList: basicPlace[] | null, sublocationsList: basicSublocation[] | null): JSX.Element | null {

    if (placesList === null) {
        debugger;
        console.warn(placesList);
        console.warn(sublocationsList);
        console.warn(measurement);
        Sentry.captureMessage(`placesList not supposed to be null here.`);
        return null;
    }

    if (sublocationsList === null) {
        debugger;
        console.warn(placesList);
        console.warn(measurement);
        Sentry.captureMessage(`sublocationsList not supposed to be null here.`);
        return null;
    }

    const sublocation = sublocationIDToSublocation(measurement.sub_location_id, sublocationsList);
    if (sublocation === null) {
        debugger;
        return copilotSublocationNotInList(measurement)
    }

    const place = sublocationWithPlaceIDToPlace(sublocation, placesList);
    if (place === null) {
        debugger;
        return copilotPlaceNotInList(measurement, sublocation);
    }

    return (
        <tr key={measurementRowKey(measurement.id)}>
            <td>ID (for now): {measurement.id}</td>
            <td><DeviceIDOrSerialWithLink id={measurement.device_id}/></td>
            <td>{measurement.co2ppm}</td>
            {/* <td>{sublocationsList.find((sublocation) => sublocation.id === measurement.sub_location_id)?.description}</td> */}
            <td>{sublocation.description}</td>
            <td>
                <Link to={`${placesPath}/${place.google_place_id}`}>
                    <b>Link for place (TODO)</b>
                </Link>
            </td>
            <td>{measurement.measurementtime}</td>
        </tr>
    )
}

export const HighestMeasurementsTable = (props: {highestMeasurementsResponse: HighestMeasurementsResponse, errorState: string | null}) => {
    
    if (props.highestMeasurementsResponse.ten_measurements === null) {
        return null;
    }

    if (props.highestMeasurementsResponse.ten_places === null) {
        return null;
    }

    if (props.highestMeasurementsResponse.ten_sublocations === null) {
        return null;
    }

    return (
        <div>
            <Suspense fallback="Loading translations...">
                <Table striped bordered hover>
                    <HighestMeasurementTableHeader/>
                    <tbody>
                        {props.highestMeasurementsResponse.ten_measurements.map((measurement) => measurementCallback(measurement, props.highestMeasurementsResponse.ten_places, props.highestMeasurementsResponse.ten_sublocations)) }
                    </tbody>
                </Table>
            </Suspense>
        </div>
    )
}

