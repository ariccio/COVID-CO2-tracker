import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { DeviceId, Base64, UUID } from 'react-native-ble-plx';


export interface BluetoothDevice {
    //Just the interesting bits from class Device in co2_native_client/node_modules/react-native-ble-plx/index.d.ts
    /**
     * Device identifier: MAC address on Android and UUID on iOS.
     */
     id: DeviceId

     /**
      * Device name if present
      */
     name: string | null
 
     /**
      * Current Received Signal Strength Indication of device
      */
     rssi: number | null
 
     /**
      * Current Maximum Transmission Unit for this device. When device is not connected
      * default value of 23 is used.
      */
     mtu: number
 
     // Advertisement
 
     /**
      * Device's custom manufacturer data. Its format is defined by manufacturer.
      */
     manufacturerData: Base64 | null
 
     /**
      * Map of service UUIDs (as keys) with associated data (as values).
      */
     serviceData: { [uuid: string]: Base64 } | null
 
     /**
      * List of available services visible during scanning.
      */
     serviceUUIDs: UUID[] | null
 
     /**
      * User friendly name of device.
      */
     localName: string | null
 
     /**
      * Transmission power level of device.
      */
     txPowerLevel: number | null
 
}

export interface BluetoothState {

}

const initialState: BluetoothState = {

};


export const bluetoothSlice = createSlice({
    name: 'bluetooth',
    initialState,
    reducers: {

    }
})

export const {} = bluetoothSlice.actions;

export const bluetoothReducer = bluetoothSlice.reducer;


