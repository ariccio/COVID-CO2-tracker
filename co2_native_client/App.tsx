import {useEffect, useState} from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, PermissionsAndroid, Button } from 'react-native';

import { BleManager, Device, BleError, LogLevel, Service, Characteristic } from 'react-native-ble-plx';
import { Provider, useDispatch, useSelector } from 'react-redux'

import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';

import { store } from './src/app/store';

import * as BLUETOOTH from '../co2_client/src/utils/BluetoothConstants';
import { selectDeviceID, selectDeviceName, selectDeviceRSSI, selectHasBluetooth, setDeviceID, setDeviceName, setHasBluetooth, setRssi } from './src/bluetooth/bluetoothSlice';

// 
// 


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

  return (
    <>
        <ValueOrLoading text={"id: "} value={id}/>
        <ValueOrLoading text={"name: "} value={name}/>
        <ValueOrLoading text={"rssi: "} value={rssi}/>

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
    debugger;
    // Handle error (scanning will be stopped automatically)
    return
    }

    console.log("New device!");

    dumpNewScannedDeviceInfo(scannedDevice);
    if (scannedDevice && (scannedDevice.name?.startsWith('Aranet4'))) {
      console.log("Connecting to aranet4...");
      if (scannedDevice.id) {
        dispatch(setDeviceID(scannedDevice.id));
      }
      else {
        //TODO: bubble error up?
        console.error("No ID?");
      }
      if (scannedDevice.name) {
        dispatch(setDeviceName(scannedDevice.name))
      }
      else {
        console.error("No name?");
      }

      manager.stopDeviceScan();
      // debugger;
      const connectedDevice = await scannedDevice.connect();
      const deviceWithServicesAndCharacteristics = await connectedDevice.discoverAllServicesAndCharacteristics();
      console.log("Connected!")
      const services = await deviceWithServicesAndCharacteristics.services();
      console.log("services:");
      console.table(services);
      dumpServiceDescriptions(services);
      const withRSSI = await deviceWithServicesAndCharacteristics.readRSSI();
      setDevice(withRSSI);
      if (withRSSI.rssi) {
        dispatch(setRssi(withRSSI.rssi));
      }
      else {
        console.error("No rssi?");
      }
      // if (withRSSI.txPowerLevel) {
      //   dispatch(setTxPower(withRSSI.txPowerLevel));
      // }
      // else {
      //   console.error("No txPowerLevel?");
      // }

    }
    
    // debugger;
}

const scanAndConnect = (setDevice: React.Dispatch<React.SetStateAction<Device | null>>, dispatch: ReturnType<typeof useDispatch>) => {
  console.log("fartipelago!");
  manager.startDeviceScan(null, null, (error, scannedDevice) => scanCallback(error, scannedDevice, setDevice, dispatch));
}

const requestLocationPermission = async (dispatch: ReturnType<typeof useDispatch>) => {
  //https://reactnative.dev/docs/permissionsandroid
  const result = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
  );
  if (result === PermissionsAndroid.RESULTS.GRANTED) {
    console.log("good");
    dispatch(setHasBluetooth(true));
    // Do something
  } else {
    console.log(`no good: ${result}`);
    dispatch(setHasBluetooth(false));
    debugger;
    // Denied
    // Do something
  }
}



const useBluetoothConnectAranet = () => {
  // const [hasBluetooth, setHasBluetooth] = useState(false);
  const [device, setDevice] = useState(null as (Device | null));
  const hasBluetooth = useSelector(selectHasBluetooth);
  const deviceID = useSelector(selectDeviceID);
  const dispatch = useDispatch();


  useEffect(() => {
    requestLocationPermission(dispatch);
  }, [])

  useEffect(() => {
    if (hasBluetooth) {
      scanAndConnect(setDevice, dispatch);
    }
  }, [hasBluetooth]);

  useEffect(() => {
    if (device === null) {
      return;
    }
    if (deviceID) {
      manager.readCharacteristicForDevice(deviceID, BLUETOOTH.DEVICE_INFORMATION_SERVICE_UUID, BLUETOOTH.GENERIC_GATT_SERIAL_NUMBER_STRING_UUID).then((characteristic) => {
        console.log(`got serial characteristic`);
        console.table(characteristic);
      })
    }

    
  }, [device, deviceID]);

  return device;
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

function App_() {
  const device = useBluetoothConnectAranet();

  useEffect(() => {
    if (device === null) {
      return;
    }
    // device.
    console.log("has device! Device object:");
    console.table(device);
    
  }, [device]);


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
      <App_/>
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
