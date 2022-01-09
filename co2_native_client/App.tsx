import {useEffect, useState} from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, PermissionsAndroid } from 'react-native';

import { BleManager, Device, BleError } from 'react-native-ble-plx';

export const manager = new BleManager();

// const BleManagerModule = NativeModules.BleManager;
// const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);

const scanCallback = async (error: BleError | null, scannedDevice: Device | null, setDevice: React.Dispatch<React.SetStateAction<Device | null>>) => {
  if (error) {
    console.log("error!");
    debugger;
    // Handle error (scanning will be stopped automatically)
    return
    }

    // // Check if it is a device you are looking for based on advertisement data
    // // or other criteria.
    // if (device.name === 'TI BLE Sensor Tag' || 
    //     device.name === 'SensorTag') {
        
    //     // Stop scanning as it's not necessary if you are scanning for one device.
        
    //     // Proceed with connection.
    //   }

    /*
      Device {serviceUUIDs: null, isConnectable: null, overflowServiceUUIDs: null, txPowerLevel: null, serviceData: null, …}
      id: "8C:79:F5:88:9A:BE"
      isConnectable: null
      localName: null
      manufacturerData: "dQBCBAGAYIx59Yiavo559YiavQEAAAAAAAA="
      mtu: 23
      name: null
      overflowServiceUUIDs: null
      rssi: -79
      serviceData: null
      serviceUUIDs: null
      solicitedServiceUUIDs: null
      txPowerLevel: null
      _manager: BleManager
      _eventEmitter: NativeEventEmitter {_subscriber: EventSubscriptionVendor, _disableCallsIntoModule: false}
      _scanEventSubscription: null
      _uniqueId: 0
    */
    console.log("New device!");

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
    if (scannedDevice && (scannedDevice.name?.startsWith('Aranet4'))) {
      console.log("Connecting to aranet4...");
      manager.stopDeviceScan();
      // debugger;
      const connectedDevice = await scannedDevice.connect();
      const deviceWithServicesAndCharacteristics = await connectedDevice.discoverAllServicesAndCharacteristics();
      setDevice(deviceWithServicesAndCharacteristics);
      console.log("Connected!")

    }
    
    // debugger;
}

const scanAndConnect = (setDevice: React.Dispatch<React.SetStateAction<Device | null>>) => {
  console.log("fartipelago!");
  manager.startDeviceScan(null, null, (error, scannedDevice) => scanCallback(error, scannedDevice, setDevice));
}

const requestLocationPermission = async (setHasBluetooth: React.Dispatch<React.SetStateAction<boolean>>) => {
  //https://reactnative.dev/docs/permissionsandroid
  const result = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
  );
  if (result === PermissionsAndroid.RESULTS.GRANTED) {
    console.log("good");
    setHasBluetooth(true);
    // Do something
  } else {
    console.log(`no good: ${result}`);
    setHasBluetooth(false);
    debugger;
    // Denied
    // Do something
  }
}

// https://expo.canny.io/feature-requests/p/bluetooth-1


const useBluetoothConnect = () => {
  const [hasBluetooth, setHasBluetooth] = useState(false);
  const [device, setDevice] = useState(null as (Device | null));

  useEffect(() => {
    requestLocationPermission(setHasBluetooth);
  }, [])

  useEffect(() => {
    if (hasBluetooth) {
      scanAndConnect(setDevice);
    }
  }, [hasBluetooth]);

  return device;
}
export default function App() {
  const device = useBluetoothConnect();

  useEffect(() => {
    if (device === null) {
      return;
    }
    // device.
    console.log("has device!");
    console.table(device);
    
  }, [device]);

  return (
    <View style={styles.container}>
      <Text>Open up App.tsx to start working on your app!</Text>
      <Text>Fartipelago!</Text>
      <Text>ID: {device?.id}</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
