/// <reference types="web-bluetooth" />
import { Button } from "react-bootstrap";
import {useDispatch} from 'react-redux';
import {useSelector} from 'react-redux';



import { selectCO2, selectDebugText, selectBluetoothAvailableError, setCO2, setDebugText, setBluetoothAvailableError, selectBluetoothAvailable, setBluetoothAvailable } from "./bluetoothSlice";

declare module BluetoothUUID {
    export function getService(name: BluetoothServiceUUID ): string;
    export function getCharacteristic(name: BluetoothCharacteristicUUID): string;
    export function getDescriptor(name: BluetoothDescriptorUUID): string;
    export function canonicalUUID(alias: number): string;
}

const SENSOR_SERVICE_UUID = 'f0cd1400-95da-4f4b-9ac8-aa55d312af0c'


const ARANET_CO2_MEASUREMENT_CHARACTERISTIC_UUID = "f0cd1503-95da-4f4b-9ac8-aa55d312af0c";

const characteristicUUIDDescriptions = new Map([
    [ARANET_CO2_MEASUREMENT_CHARACTERISTIC_UUID, "Aranet4: CO2 measurements"],
    ["f0cd3001-95da-4f4b-9ac8-aa55d312af0c", "Aranet4: CO2 measurements, interval, time since measurements"],
    ["f0cd2002-95da-4f4b-9ac8-aa55d312af0c", "Aranet4: measurement interval"],
    ["f0cd2004-95da-4f4b-9ac8-aa55d312af0c", "Aranet4: seconds since last update"],
    ["f0cd2001-95da-4f4b-9ac8-aa55d312af0c", "Aranet4: total number of measurements"],
    ["00002a00-0000-1000-8000-00805f9b34fb", "Aranet4: Device name"],
    ["00002a19-0000-1000-8000-00805f9b34fb", "Aranet4: Battery level"],
    ["00002a24-0000-1000-8000-00805f9b34fb", "Aranet4: Model number"],
    ["00002a25-0000-1000-8000-00805f9b34fb", "Aranet4: Serial number"],
    ["00002a27-0000-1000-8000-00805f9b34fb", "Aranet4: Hardware revision"],
    ["00002a28-0000-1000-8000-00805f9b34fb", "Aranet4: Software revision"],
    ["00002a29-0000-1000-8000-00805f9b34fb", "Aranet4: Manufacturer name (?)"]
]);


function aranet4DeviceRequestOptions(): RequestDeviceOptions {
    const filter: BluetoothLEScanFilter = {
        services: [SENSOR_SERVICE_UUID]
    }
    const services: BluetoothServiceUUID[] = [
        'device_information',
        'battery_service',
      ];

    const deviceRequestOptions: RequestDeviceOptions = {
        filters: [filter],
        optionalServices: services,
        acceptAllDevices: false
    }
    return deviceRequestOptions;

}

function dumpBluetoothCharacteristicProperties(properties: BluetoothCharacteristicProperties, serviceIndex: number, characteristicIndex: number): void {
    // readonly broadcast: boolean;
    // readonly read: boolean;
    // readonly writeWithoutResponse: boolean;
    // readonly write: boolean;
    // readonly notify: boolean;
    // readonly indicate: boolean;
    // readonly authenticatedSignedWrites: boolean;
    // readonly reliableWrite: boolean;
    // readonly writableAuxiliaries: boolean;

    
    console.log(`\tservices[${serviceIndex}], characteristics[${characteristicIndex}].properties:`);
    if (properties.broadcast) {
        console.log(`\t\tbroadcast: ${properties.broadcast}`);
    }
    if (properties.read) {
        console.log(`\t\tread: ${properties.read}`);
    }
    if (properties.writeWithoutResponse) {
        console.log(`\t\twriteWithoutResponse: ${properties.writeWithoutResponse}`);
    }
    if (properties.write) {
        console.log(`\t\twrite: ${properties.write}`);
    }
    if (properties.notify) {
        console.log(`\t\tnotify: ${properties.notify}`);
    }
    if (properties.indicate) {
        console.log(`\t\tindicate: ${properties.indicate}`);
    }
    if (properties.authenticatedSignedWrites) {
        console.log(`\t\tauthenticatedSignedWrites: ${properties.authenticatedSignedWrites}`);
    }
    if (properties.reliableWrite) {
        console.log(`\t\treliableWrite: ${properties.reliableWrite}`);
    }
    if (properties.writableAuxiliaries) {
        console.log(`\t\twritableAuxiliaries: ${properties.writableAuxiliaries}`);
    }
}

// async function hasGetDevices() {
//     const devices = await navigator.bluetooth.getDevices()
//     console.log("bluetooth devices:");
//     console.table(devices);
//     if (devices.length === 0) {
//         debugger;
//     }
// }

function messages(messagesString: string, objectOrString: string, dispatch: ReturnType<typeof useDispatch>): string {
    let newMessagesString = messagesString + `${objectOrString}\r\n`;
    console.log(objectOrString);
    dispatch(setDebugText(newMessagesString))
    return `${objectOrString}\r\n`;
}

async function checkBluetooth(dispatch: ReturnType<typeof useDispatch>) {
    console.log(navigator.bluetooth);
    if (navigator.bluetooth === undefined) {
        dispatch(setBluetoothAvailableError('bluetooth is unavailable on your platform. (navigator.bluetooth undefined)'));
        dispatch(setBluetoothAvailable(false));
        alert('bluetooth is unavailable on your platform. (navigator.bluetooth undefined)');
        return;
    }
    const available = await navigator.bluetooth.getAvailability();
    console.log("bluetooth available: ", available);
    dispatch(setBluetoothAvailable(available));
    if (!available) {
        alert("bluetooth may not be available.");
        dispatch(setBluetoothAvailableError('bluetooth may not be available. navigator.bluetooth.getAvailability() returned false.'));
        return;
    }
    dispatch(setBluetoothAvailableError(null));
}

async function bluetoothTestingStuffFunc(dispatch: ReturnType<typeof useDispatch>) {

    // if ((navigator.bluetooth.getDevices as any)) {
    //     hasGetDevices();
    // }

    const options = aranet4DeviceRequestOptions();

    //https://developer.mozilla.org/en-US/docs/Web/API/Bluetooth/requestDevice
    const device = await navigator.bluetooth.requestDevice(options);
    // const co2_descriptor = BluetoothUUID.getCharacteristic('f0cd3001-95da-4f4b-9ac8-aa55d312af0c');
    // console.log(co2_descriptor);
    // debugger;

    let bluetoothMessages = "";

    bluetoothMessages += messages(bluetoothMessages, `device.id: ${device.id}`, dispatch);
    bluetoothMessages += messages(bluetoothMessages, `device.name: ${device.name}`, dispatch);
    bluetoothMessages += messages(bluetoothMessages, `device.uuids: ${device.uuids}`, dispatch);

    if (device.gatt === undefined) {
        debugger;
        return;
    }
    const deviceServer = await device.gatt.connect();


    const services = await deviceServer.getPrimaryServices();
    bluetoothMessages += messages(bluetoothMessages, `Got services (length: ${services.length}):`, dispatch)
    for (let serviceIndex = 0; serviceIndex < services.length; serviceIndex++) {
        bluetoothMessages += messages(bluetoothMessages, `services[${serviceIndex}].uuid: ${services[serviceIndex].uuid}`, dispatch);
        bluetoothMessages += messages(bluetoothMessages, `services[${serviceIndex}].isPrimary: ${services[serviceIndex].isPrimary}`, dispatch);
        // debugger;
        const characteristics = await services[serviceIndex].getCharacteristics();

        bluetoothMessages += messages(bluetoothMessages, `Got characteristics (length ${characteristics.length}):`, dispatch)
        for (let characteristicIndex = 0; characteristicIndex < characteristics.length; characteristicIndex++) {
            bluetoothMessages += messages(bluetoothMessages, `\tservices[${serviceIndex}], characteristics[${characteristicIndex}].uuid: ${characteristics[characteristicIndex].uuid}`, dispatch);
            if (characteristicUUIDDescriptions.has(characteristics[characteristicIndex].uuid)) {
                bluetoothMessages += messages(bluetoothMessages, `\t\tKnown characteristic! ${characteristicUUIDDescriptions.get(characteristics[characteristicIndex].uuid)}`, dispatch);
            }
            bluetoothMessages += messages(bluetoothMessages, `\tservices[${serviceIndex}], characteristics[${characteristicIndex}].value: ${characteristics[characteristicIndex].value}`, dispatch);
            dumpBluetoothCharacteristicProperties(characteristics[characteristicIndex].properties, serviceIndex, characteristicIndex);
            if (characteristics[characteristicIndex].properties.read) {
                try {
                    const data = await characteristics[characteristicIndex].readValue();
                    bluetoothMessages += messages(bluetoothMessages, `\t\tdata: ${data.buffer}`, dispatch);
                    if (characteristics[characteristicIndex].uuid === ARANET_CO2_MEASUREMENT_CHARACTERISTIC_UUID) {
                        // debugger;
                        const co2 = data.getUint16(0, true);
                        dispatch(setCO2(co2))
                    }
                            
                }
                catch(e) {
                    if (e instanceof DOMException) {
                        bluetoothMessages += messages(bluetoothMessages, `\t\tCannot read from ${characteristics[characteristicIndex].uuid}!`, dispatch)
                    }
                    else {
                        throw e;
                    }
                }
            }
            bluetoothMessages += messages(bluetoothMessages, '\n', dispatch);
        }
        bluetoothMessages += messages(bluetoothMessages, '\n', dispatch);
    }
}

function maybeCO2(co2: number | null) {
    if (co2 === null) {
        return (
            <div>
                No CO2 value.
            </div>
        );
    }
    return (
        <div>
            CO2: {co2}
        </div>
    )
}

function maybeBluetoothAvailableError(bluetoothAvailableError: string | null) {
    if (bluetoothAvailableError === null) {
        return (
            <div></div>
        );
    }
    return (
        <div style={{color: 'red'}}>
            Bluetooth might not be available. Error: {bluetoothAvailableError}
        </div>
    )
}

function maybeBluetoothAvailable(bluetoothAvailable: boolean | null) {
    if (bluetoothAvailable === null) {
        return (
            <div></div>
        );
    }
    if (bluetoothAvailable) {
        return (
            <div>
                Bluetooth available.
            </div>
        );
    }
    return (
        <div style={{color: 'red'}}>
            Bluetooth not available.
        </div>
    );
}

export function BluetoothTesting(): JSX.Element {
    const debugText = useSelector(selectDebugText);
    const co2 = useSelector(selectCO2);
    const bluetoothAvailableError = useSelector(selectBluetoothAvailableError);
    const bluetoothAvailable = useSelector(selectBluetoothAvailable);

    const dispatch = useDispatch();

    const checkBluetoothAvailable = () => {
        checkBluetooth(dispatch);
    }

    const queryDeviceOverBluetooth = () => {
        bluetoothTestingStuffFunc(dispatch);
    }


    return (
        <div>
            <h3>Experimental Bluetooth support</h3>
            <Button onClick={checkBluetoothAvailable}>Check bluetooth availability</Button>
            {maybeBluetoothAvailable(bluetoothAvailable)}
            {maybeBluetoothAvailableError(bluetoothAvailableError)}<br/>
            {maybeCO2(co2)}<br/>
            <br/>
            <Button onClick={queryDeviceOverBluetooth}>Query device</Button>
            <pre>{debugText}</pre>
        </div>
    )
}