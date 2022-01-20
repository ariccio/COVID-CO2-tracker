import {useEffect, useState} from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, PermissionsAndroid, Button } from 'react-native';

import { BleManager, Device, BleError, LogLevel, Service, Characteristic, BleErrorCode } from 'react-native-ble-plx';
import { Provider, useDispatch, useSelector } from 'react-redux'

import {Buffer} from 'buffer';

import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';

import { store } from './src/app/store';

import * as BLUETOOTH from '../co2_client/src/utils/BluetoothConstants';
import { Aranet4_3001CO2, selectDeviceBatterylevel, selectDeviceID, selectDeviceName, selectDeviceRSSI, selectDeviceSerialNumberString, selectHasBluetooth, selectScanningErrorStatusString, selectScanningStatusString, setDeviceBatteryLevel, setDeviceID, setDeviceName, setDeviceSerialNumber, setHasBluetooth, setRssi, setScanningErrorStatusString, setScanningStatusString } from './src/bluetooth/bluetoothSlice';

// 
// 

//https://github.com/thespacemanatee/Smart-Shef-IoT/blob/4782c95f383040f36e4ae7ce063166cce5c76129/smart_shef_app/src/utils/hooks/useMonitorHumidityCharacteristic.ts

const MaybeIfValue: React.FC<{text: string, value: any}> = ({text, value}) => {
  if (value === undefined) {
    console.error("value missing?");
    return null;
  }
  if (value === null) {
    return null;
  }
  return (
    <Text>
        {text}{value}
    </Text>
  );
}


const ValueOrLoading: React.FC<{text: string, value: any}> = ({text, value}) => {
  if (value === undefined) {
    console.error("value missing?");
    return null;
  }
  if (value === null) {
    return (
      <Text>
          Loading {text}...
      </Text>
    );
    }
  return (
    <Text>
        {text}{value}
    </Text>
  );
}

const BluetoothData: React.FC<{device: Device | null}> = ({device}) => {
  const id = useSelector(selectDeviceID);
  const name = useSelector(selectDeviceName);
  const rssi = useSelector(selectDeviceRSSI);
  const bluetoothScanningStatus = useSelector(selectScanningStatusString);
  const bluetoothScanningErrorStatus = useSelector(selectScanningErrorStatusString);
  const serialNumber = useSelector(selectDeviceSerialNumberString);
  const deviceBatteryLevel = useSelector(selectDeviceBatterylevel);

  return (
    <>
        <MaybeIfValue text={"bluetooth status: "} value={bluetoothScanningStatus}/>
        <MaybeIfValue text={"bluetooth errors: "} value = {(bluetoothScanningErrorStatus.length > 0) ? bluetoothScanningErrorStatus : null}/>
        <ValueOrLoading text={"id: "} value={id}/>
        <ValueOrLoading text={"name: "} value={name}/>
        <ValueOrLoading text={"rssi: "} value={rssi}/>
        <ValueOrLoading text={"Serial number: "} value={serialNumber}/>
        <ValueOrLoading text={"Battery: "} value={deviceBatteryLevel}/>

        <MaybeIfValue text={"localName: "} value={(device?.localName) ? device.localName : null}/>
        <MaybeIfValue text={"manufacturerData: "} value={(device?.manufacturerData) ? device?.manufacturerData : null}/>
        
    </>
  )
}


export const manager = new BleManager();
manager.setLogLevel(LogLevel.Debug);

// const BleManagerModule = NativeModules.BleManager;
// const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);

function checkKnownFunctionDescription(characteristic: Characteristic) {
  if (BLUETOOTH.aranet4KnownCharacteristicUUIDDescriptions.has(characteristic.uuid)) {
      console.log(`\t\t\t${characteristic.uuid}: Known Aranet4 characteristic! '${BLUETOOTH.aranet4KnownCharacteristicUUIDDescriptions.get(characteristic.uuid)}'`);
      return;
  }
  else if (BLUETOOTH.GENERIC_GATT_SERVICE_UUID_DESCRIPTIONS.has(characteristic.uuid)) {
    console.log(`\t\t\t${characteristic.uuid}: Known generic GATT characteristic! '${BLUETOOTH.GENERIC_GATT_SERVICE_UUID_DESCRIPTIONS.get(characteristic.uuid)}'`);
      return;
  }
  console.log(`\t\t\tUNKNOWN GATT characteristic! '${characteristic.uuid}'`);
}

function dumpCharacteristics(characteristics: Characteristic[]) {
  for (let characteristicIndex = 0; characteristicIndex < characteristics.length; ++characteristicIndex) {
    const thisCharacteristic = characteristics[characteristicIndex];
    checkKnownFunctionDescription(thisCharacteristic);
  }
}

async function dumpServiceDescriptions(services: Service[]) {
  for (let serviceIndex = 0; serviceIndex < services.length; ++serviceIndex) {
    const thisService = services[serviceIndex];
    console.log(`\tservice ${serviceIndex}:`)

    const short_uuid = thisService.uuid.substring(4, 8).toUpperCase();
    if (BLUETOOTH.GENERIC_GATT_SERVICE_UUID_DESCRIPTIONS.has(thisService.uuid)) {
      const serviceName = BLUETOOTH.GENERIC_GATT_SERVICE_UUID_DESCRIPTIONS.get(thisService.uuid);
      console.log(`\t\tservices[${serviceIndex}].uuid: ${thisService.uuid}... Known service! ${serviceName}`);
    }
    else if (BLUETOOTH.GENERIC_GATT_SERVICE_SHORT_ID_DESCRIPTIONS.has(short_uuid)) {
      const serviceName = BLUETOOTH.GENERIC_GATT_SERVICE_SHORT_ID_DESCRIPTIONS.get(short_uuid);
      console.log(`\t\tservices[${serviceIndex}].uuid: ${thisService.uuid}... Known service! ${serviceName}`);
  }

    // console.log(`\t\tid: ${thisService.id}`);
    const characteristics = await thisService.characteristics();
    dumpCharacteristics(characteristics);

  }
}

const scanCallback = async (error: BleError | null, scannedDevice: Device | null, setDevice: React.Dispatch<React.SetStateAction<Device | null>>, dispatch: ReturnType<typeof useDispatch>) => {
  if (error) {
    console.error(`error scanning: ${error}`);
    dispatch(setScanningErrorStatusString(`error scanning: ${error}`));
    debugger;
    // Handle error (scanning will be stopped automatically)
    return
    }

    console.log("New device!");
    
    dumpNewScannedDeviceInfo(scannedDevice);
    if (!scannedDevice) {
      dispatch(setScanningErrorStatusString(`scannedDevice is null?: Something's wrong.`));
      return;
    }
    if (scannedDevice.name === null) {
      dispatch(setScanningStatusString(`scannedDevice has no name. ID: ${scannedDevice.id}`));
      return;
    }
    if ((scannedDevice.name.startsWith('Aranet4'))) {
      await foundAranet4(scannedDevice, dispatch, setDevice);
      // if (withRSSI.txPowerLevel) {
      //   dispatch(setTxPower(withRSSI.txPowerLevel));
      // }
      // else {
      //   console.error("No txPowerLevel?");
      // }

    }
    else {
      dispatch(setScanningStatusString(`found non-aranet device: ${scannedDevice.name}`));
    }
    
    // debugger;
}

const scanAndConnect = (setDevice: React.Dispatch<React.SetStateAction<Device | null>>, dispatch: ReturnType<typeof useDispatch>) => {
  console.log("fartipelago!");
  dispatch(setScanningStatusString('Beginning device scan...'));
  manager.startDeviceScan(null, null, (error, scannedDevice) => scanCallback(error, scannedDevice, setDevice, dispatch));
}

const requestLocationPermission = async (dispatch: ReturnType<typeof useDispatch>) => {
  dispatch(setScanningStatusString('Need permission to use bluetooth first.'));

  //https://reactnative.dev/docs/permissionsandroid
  const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);

  if (result === PermissionsAndroid.RESULTS.GRANTED) {
    console.log("good");
    dispatch(setHasBluetooth(true));
    dispatch(setScanningStatusString('Bluetooth permission granted!'));
    // Do something
  } else {
    console.log(`no good: ${result}`);
    dispatch(setScanningStatusString(`Bluetooth permission denied by user: ${result}`));
    dispatch(setHasBluetooth(false));
    debugger;
    // Denied
    // Do something
  }
}

function parseUTF8StringBuffer(data: Buffer): string {
  let chars = new Array(data.byteLength);
  for (let i = 0; i < (data.byteLength); i++) {
      chars[i] = data.readUInt8(i);
  }
  const converted = String.fromCharCode.apply(null, chars);
  return converted;
}

function parseUint8Buffer(data: Buffer): number {
  if (data.byteLength > 1) {
    throw new Error("Only for parsing single byte buffers?")
  }

  const value = data.readUInt8(0);
  return value;
}


// async function readDataFromAranet4(dispatch: ReturnType<typeof useDispatch>, deviceID: string) {
//   const rawSerialNumberCharacteristicValue = await manager.readCharacteristicForDevice(deviceID, BLUETOOTH.DEVICE_INFORMATION_SERVICE_UUID, BLUETOOTH.GENERIC_GATT_SERIAL_NUMBER_STRING_UUID);
//   if (rawSerialNumberCharacteristicValue.value === null) {
//     console.error("bug");
//     debugger;
//     return;
//   }
//   const deviceSerialNumberCharacteristicAsBuffer = Buffer.from(rawSerialNumberCharacteristicValue.value, 'base64');
//   const deviceSerialNumberCharacteristicAsString = parseUTF8StringBuffer(deviceSerialNumberCharacteristicAsBuffer);
//   dispatch(setDeviceSerialNumber(deviceSerialNumberCharacteristicAsString));
// }


async function readStringCharacteristicFromDevice(deviceID: string, serviceUUID: string, characteristicUUID: string, serviceName: string, characteristicName: string): Promise<string> {
  const rawStringCharacteristicValue = await manager.readCharacteristicForDevice(deviceID, serviceUUID, characteristicUUID);
  if (rawStringCharacteristicValue.value === null) {
    debugger;
    throw new Error(`${serviceName}: ${characteristicName} value is null?`);
  }
  const stringCharacteristicAsBuffer = Buffer.from(rawStringCharacteristicValue.value, 'base64');
  const stringCharacteristicAsString = parseUTF8StringBuffer(stringCharacteristicAsBuffer);
  return stringCharacteristicAsString;
}

async function readSerialNumberFromBluetoothDevice(deviceID: string): Promise<string> {
  return readStringCharacteristicFromDevice(deviceID, BLUETOOTH.DEVICE_INFORMATION_SERVICE_UUID, BLUETOOTH.GENERIC_GATT_SERIAL_NUMBER_STRING_UUID, "DEVICE_INFORMATION_SERVICE_UUID", "GENERIC_GATT_SERIAL_NUMBER_STRING_UUID");

  // const rawSerialNumberCharacteristicValue = await manager.readCharacteristicForDevice(deviceID, BLUETOOTH.DEVICE_INFORMATION_SERVICE_UUID, BLUETOOTH.GENERIC_GATT_SERIAL_NUMBER_STRING_UUID);
  // if (rawSerialNumberCharacteristicValue.value === null) {
  //   debugger;
  //   throw new Error("GENERIC_GATT_SERIAL_NUMBER_STRING_UUID.value is null?");
  // }
  // const deviceSerialNumberCharacteristicAsBuffer = Buffer.from(rawSerialNumberCharacteristicValue.value, 'base64');
  // const deviceSerialNumberCharacteristicAsString = parseUTF8StringBuffer(deviceSerialNumberCharacteristicAsBuffer);
  // return deviceSerialNumberCharacteristicAsString; 
}

async function readUint8CharacteristicFromDevice(deviceID: string, serviceUUID: string, characteristicUUID: string, serviceName: string, characteristicName: string): Promise<number> {
  const rawUint8CharacteristicValue = await manager.readCharacteristicForDevice(deviceID, serviceUUID, characteristicUUID);
  if (rawUint8CharacteristicValue.value === null) {
    debugger;
    throw new Error(`${serviceName}: ${characteristicName} value is null?`);
  }
  const uint8CharacteristicAsBuffer = Buffer.from(rawUint8CharacteristicValue.value, 'base64');
  const uint8CharacteristicAsUint8 = parseUint8Buffer(uint8CharacteristicAsBuffer);
  return uint8CharacteristicAsUint8;
}

async function readDeviceNameFromBluetoothDevice(deviceID: string): Promise<string> {
  return readStringCharacteristicFromDevice(deviceID, BLUETOOTH.GENERIC_ACCESS_SERVICE_UUID, BLUETOOTH.GENERIC_GATT_DEVICE_NAME_UUID, "GENERIC_ACCESS_SERVICE_UUID", "GENERIC_GATT_DEVICE_NAME_UUID");

  // const rawDeviceNameCharacteristicValue = await manager.readCharacteristicForDevice(deviceID, BLUETOOTH.GENERIC_ACCESS_SERVICE_UUID, BLUETOOTH.GENERIC_GATT_DEVICE_NAME_UUID);
  // if (rawDeviceNameCharacteristicValue.value === null) {
  //   debugger;
  //   throw new Error("GENERIC_GATT_DEVICE_NAME_UUID.value is null?");
  // }
  // const deviceNameCharacteristicAsBuffer = Buffer.from(rawDeviceNameCharacteristicValue.value, 'base64');
  // const deviceNameCharacteristicAsString = parseUTF8StringBuffer(deviceNameCharacteristicAsBuffer);
  // return deviceNameCharacteristicAsString;
}

async function readBatteryLevelFromBluetoothDevice(deviceID: string): Promise<number> {
  return readUint8CharacteristicFromDevice(deviceID, BLUETOOTH.GENERIC_ACCESS_SERVICE_UUID, BLUETOOTH.GENERIC_GATT_DEVICE_BATTERY_LEVEL_UUID, "GENERIC_ACCESS_SERVICE_UUID", "GENERIC_GATT_DEVICE_BATTERY_LEVEL_UUID");
}

function noDevice(deviceID: string | null, device: Device | null): boolean {
  if (device === null) {
    return true;
  }
  if (deviceID === null) {
    return true;
  }
  return false;
}

const useBluetoothSerialNumber = (deviceID: string | null, device: Device | null) => {
  const dispatch = useDispatch();
  const [serialNumberError, setError] = useState(null as (Error | null));
  const [serialNumberString, setSerialNumberString] = useState(null as (string | null));

  useEffect(() => {
    if (noDevice(deviceID, device)) {
      return;
    }
    // dispatch(setScanningStatusString(`Beginning serial number read...`));
    
    readSerialNumberFromBluetoothDevice(deviceID!).then((serialNumberString) => {
      // dispatch(setDeviceSerialNumber(serialNumberString));
      setSerialNumberString(serialNumberString);
      if (serialNumberString.length === 0) {
        console.warn(`Device ${deviceID} has an empty serial number string?`);
        setError(new Error(`Device ${deviceID} has an empty serial number string?`));
      }
      // dispatch(setScanningStatusString(`Got serial number! ('${serialNumberString}')`));
      // dispatch(setScanningStatusString(null));
    }).catch((error) => {
      if (error.code === BleErrorCode.DeviceNotConnected) {
        dispatch(setScanningStatusString(`Device ${deviceID} not connected. Serial number not available.`))
        console.warn(`Device ${deviceID} not connected. Serial number not available.`);
        device!.connect();
        return;
      }

      // console.error(error);

      setError(error);
      debugger;
    });
  }, [device, deviceID]);

  return {serialNumberString, serialNumberError};
}

const useBluetoothDeviceName = (deviceID: string | null, device: Device | null) => {
  const dispatch = useDispatch();
  const [deviceNameError, setDeviceNameError] = useState(null as (Error | null));
  const [deviceNameString, setDeviceNameString] = useState(null as (string | null));
  
  useEffect(() => {
    if (noDevice(deviceID, device)) {
      return;
    }
    console.table(device);
    // dispatch(setScanningStatusString(`Beginning device name read...`));
    readDeviceNameFromBluetoothDevice(deviceID!).then((deviceNameString) => {
      setDeviceNameString(deviceNameString);
      if (deviceNameString.length === 0) {
        console.warn(`Device ${deviceID} has an empty name?`);
        setDeviceNameError(new Error(`Device ${deviceID} has an empty name?`));
      }
      // dispatch(`Got device name! ('${deviceNameString}')`);
      // dispatch(setScanningStatusString(null));
    }).catch( (error) => {
      if (error.code === BleErrorCode.DeviceNotConnected) {
        dispatch(setScanningStatusString(`Device ${deviceID} not connected. Name not available.`))
        console.warn(`Device ${deviceID} not connected. Name not available.`);
        device!.connect();
        return;
      }
      // console.error(error);
      setDeviceNameError(error);
      debugger;
    })

  }, [device, deviceID]);
  return {deviceNameString, deviceNameError};
}

const useBluetoothBatteryLevel = (deviceID: string | null, device: Device | null) => {
  const dispatch = useDispatch();
  const [deviceBatteryError, setDeviceBatteryError] = useState(null as (Error | null));
  const [deviceBattery, setDeviceBattery] = useState(null as (number | null));

  useEffect(() => {
    if (noDevice(deviceID, device)) {
      return;
    }
    readBatteryLevelFromBluetoothDevice(deviceID!).then((deviceBatteryLevel) => {
      setDeviceBattery(deviceBatteryLevel);
      if (deviceBatteryLevel < 20) {
        console.warn(`Device ${deviceID} has a low battery! (${deviceBatteryLevel}%)`);
      }
    }).catch( (error) => {
      // console.error(error);
      setDeviceBatteryError(error);
      // debugger;
    })
  }, [device, deviceID])

  return {deviceBattery, deviceBatteryError};
}



const useGenericBluetoothInformation = (deviceID: string | null, device: Device | null) => {
  const {serialNumberString, serialNumberError} = useBluetoothSerialNumber(deviceID, device);
  const {deviceNameString, deviceNameError} = useBluetoothDeviceName(deviceID, device);
  return {serialNumberString, serialNumberError, deviceNameString, deviceNameError};
}

const useAranet4Co2Characteristic = (deviceID: string | null, device: Device | null) => {
  const dispatch = useDispatch();
  const [co2Characteristic, setCo2Characteristic] = useState(null as (Aranet4_3001CO2 | null));
  const [co2CharacteristicError, setCo2CharacteristicError] = useState(null as (Error | null));

  useEffect(() => {
    if (noDevice(deviceID, device)) {
      return;
    }
  }, [device, deviceID])


  
}

const useAranet4SpecificInformation = (deviceID: string | null, device: Device | null) => {

}




const useBluetoothConnectAranet = () => {
  // const [hasBluetooth, setHasBluetooth] = useState(false);
  const [device, setDevice] = useState(null as (Device | null));
  const hasBluetooth = useSelector(selectHasBluetooth);
  const deviceID = useSelector(selectDeviceID);
  const dispatch = useDispatch();

  // const {serialNumberString, serialNumberError} = useBluetoothSerialNumber(deviceID, device);
  // const {deviceNameString, deviceNameError} = useBluetoothDeviceName(deviceID, device);
  // const {deviceBattery, deviceBatteryError} = useBluetoothBatteryLevel(deviceID, device);
  const {serialNumberString, serialNumberError, deviceNameString, deviceNameError} = useGenericBluetoothInformation(deviceID, device);

  useEffect(() => {
    requestLocationPermission(dispatch);
  }, [])

  useEffect(() => {
    if (hasBluetooth) {
      scanAndConnect(setDevice, dispatch);
    }
  }, [hasBluetooth]);

  useEffect(() => {
    if (serialNumberError) {
      console.error(serialNumberError);
      dispatch(setScanningErrorStatusString(`Error loading serial number: ${String(serialNumberError)}`));
      debugger;
    }
    if (serialNumberString !== null) {
      dispatch(setDeviceSerialNumber(serialNumberString));
    }

  }, [serialNumberError, serialNumberString]);

  useEffect(() => {
    if (deviceNameError) {
      console.error(deviceNameError);
      dispatch(setScanningErrorStatusString(`Error loading device name: ${String(deviceNameError)}`));
      debugger;
    }
    if (deviceNameString !== null) {
      dispatch(setDeviceName(deviceNameString));
    }
  }, [deviceNameString, deviceNameError]);

  // useEffect(() => {
  //   if (deviceBatteryError) {
  //     console.error(deviceBatteryError);
  //     dispatch(setScanningErrorStatusString(`Error loading device battery: ${String(deviceBatteryError)}`));
  //     // debugger;
  //   }
  //   if (deviceBattery !== null) {
  //     dispatch(setDeviceBatteryLevel(deviceBattery));
  //   }
  // })

  return {device};
}

async function attemptConnectScannedDevice(scannedDevice: Device, dispatch: ReturnType<typeof useDispatch>): Promise<Device | null> {
  try {

    const connectedDevice = await scannedDevice.connect();
    return connectedDevice;
  }
  catch (error) {
    dispatch(setScanningErrorStatusString(`Error connecting to aranet4! Error: ${String(error)}`))
    debugger;
    return null;
  }

}


async function foundAranet4(scannedDevice: Device, dispatch: ReturnType<typeof useDispatch>, setDevice: React.Dispatch<React.SetStateAction<Device | null>>) {
  dispatch(setScanningStatusString(`Found aranet4! (${scannedDevice.id}) Connecting...`));
  console.log("Connecting to aranet4...");
  if (scannedDevice.id) {
    dispatch(setDeviceID(scannedDevice.id));
  }
  else {
    //TODO: bubble error up?
    console.error("No ID?");
  }
  if (scannedDevice.name) {
    dispatch(setDeviceName(scannedDevice.name));
  }
  else {
    console.error("No name?");
  }
  manager.stopDeviceScan();
  // debugger;

  const connectedDevice = await attemptConnectScannedDevice(scannedDevice, dispatch);

  if (connectedDevice === null) {
    console.error("Connection failed.")
    return;
  }
  dispatch(setScanningStatusString(`Connected to aranet4 ${scannedDevice.id}). Discovering services and characteristics...`));
  const deviceWithServicesAndCharacteristics = await connectedDevice.discoverAllServicesAndCharacteristics();

  console.log("Connected!");
  const services = await deviceWithServicesAndCharacteristics.services();
  console.log("services:");
  console.table(services);
  dumpServiceDescriptions(services);
  const withRSSI = await deviceWithServicesAndCharacteristics.readRSSI();
  if (scannedDevice != withRSSI) {
    debugger;
  }
  setDevice(withRSSI);
  if (withRSSI.rssi) {
    dispatch(setRssi(withRSSI.rssi));
    if (withRSSI.rssi < -80) {
      dispatch(setScanningErrorStatusString(`${deviceWithServicesAndCharacteristics.name} has a very weak signal! (RSSI: ${withRSSI.rssi}) You may have connection problems!`))
    }
  }
  else {
    console.error("No rssi?");
  }
  dispatch(setScanningStatusString(null));
}

function dumpNewScannedDeviceInfo(scannedDevice: Device | null) {
  if (scannedDevice) {
    if (scannedDevice.id) {
      console.log(`\tscannedDevice.id: ${scannedDevice.id}`);
    }
    if (scannedDevice.localName) {
      console.log(`\tscannedDevice.localName ${scannedDevice.localName}`);
    }
    if (scannedDevice.name) {
      console.log(`\tscannedDevice.name: ${scannedDevice.name}`);
    }
    if (scannedDevice.serviceData) {
      console.log(`\tscannedDevice.serviceData: ${scannedDevice.serviceData}`);
    }
  }
}

/*
    await queryAranet4BasicInformation(deviceServer, dispatch);


    console.log("Getting device information service...")
    const deviceInformationService = await deviceServer.getPrimaryService(BLUETOOTH.DEVICE_INFORMATION_SERVICE_UUID);


    await queryDeviceInformationService(deviceInformationService, dispatch);

*/

function Main() {
  const {device} = useBluetoothConnectAranet();
  

  useEffect(() => {
    if (device === null) {
      return;
    }
    // device.
    console.log("has device! Device object:");
    console.table(device);
    
  }, [device]);

  useEffect(() => {
    console.log("Note to self (TODO): there's really nothing sensitive about the client ID, but I'd like to obfuscate it anyways.");
  }, []);


  const [request, response, promptAsync] = Google.useAuthRequest({
    // expoClientId: 'GOOGLE_GUID.apps.googleusercontent.com',
    // iosClientId: 'GOOGLE_GUID.apps.googleusercontent.com',
    androidClientId: '460477494607-vslsidjdslivkafohmt992tls0dh6cf5.apps.googleusercontent.com',
    // webClientId: 'GOOGLE_GUID.apps.googleusercontent.com',
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      console.log(authentication);
      console.table(authentication);
      }
  }, [response]);

  return (
    
      <View style={styles.container}>
        
        <BluetoothData device={device}/>
        <Button disabled={!request} title="Login" onPress={() => {promptAsync();}}/>
        <StatusBar style="auto" />
      </View>
  );
}

export default function App() {

  return (
    <Provider store={store}>
      <Main/>
    </Provider>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
