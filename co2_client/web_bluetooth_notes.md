Ok, so, looking at aranet4 sample code by @kasparsd, it seems like aranet4 has several characteristic IDs:
```javascript
    'f0cd3001-95da-4f4b-9ac8-aa55d312af0c': // Sensor values.
    'f0cd2004-95da-4f4b-9ac8-aa55d312af0c': // Seconds since the last sensor update.
    'f0cd2002-95da-4f4b-9ac8-aa55d312af0c': // Configured interval in seconds between the updates.
```
(see this file: https://github.com/kasparsd/sensor-pilot/blob/master/src/components/Devices/Aranet4.js)

The aranet4 service id looks like this:
```javascript
    const SENSOR_SERVICE_UUID = 'f0cd1400-95da-4f4b-9ac8-aa55d312af0c'
```

First, with the service characteristic IDs, he calls `getCharacteristic` for each UUID in the list (used as "name" here):
```javascript
        const characteristicUuids = Object.keys(characteristicResolvers)
            .map(name => BluetoothUUID.getCharacteristic(name))
```
(see https://github.com/kasparsd/sensor-pilot/blob/master/src/ble-device.js - serviceCharacteristics)

(see api docs here: https://developer.mozilla.org/en-US/docs/Web/API/BluetoothUUID/getCharacteristic)

Now, `characteristicUuids` contains an array of "UUID representing a registered characteristic when passed a name or the 16- or 32-bit UUID alias."



Then the fun starts with this crazy function, `serviceCharacteristics`:
```javascript
    return this.getGATTServer()
      .then(server => server.getPrimaryService(serviceUuid))
      .then(service => service.getCharacteristics())
      .then(characteristics => {
        return Promise.all(
          characteristics
            .filter(characteristic => characteristicUuids.includes(characteristic.uuid))
            .map(async (characteristic) => {
              const mapped = {
                uuid: characteristic.uuid,
                value: await characteristic.readValue(),
              }
              return mapped
            }
            ),
        )
      })
      .then(values => values.map(value => ({
        uuid: value.uuid,
        value: characteristicResolvers[value.uuid](value.value),
      })))
  }
```

First, `this.getGATTServer()` looks like this:

```javascript
  getGATTServer () {
    if (this.isConnected()) {
      return Promise.resolve(this.server)
    }

    return this.getDevice()
      .then(server => {
        this.server = server

        return server
      })
  }
```

`isConnected` looks like this:
```javascript
  isConnected () {
    return (this.server && this.server.connected)
  }
```

and `getDevice` looks like this:
```javascript
  getDevice () {
    return this.bluetoothApi.requestDevice(this.deviceOptions)
      .then(device => device.gatt.connect())
  }
```

What happens in that first call to `this.getGATTServer()`, is that `isConnected` is false (since `this.server` is null), so it skips to `getDevice`. `getDevice`. For some reason, he assigns the global `navigator.bluetooth` to `this.bluetoothApi`, so in `getDevice`, this is in fact a call to [`Bluetooth.requestDevice`](https://developer.mozilla.org/en-US/docs/Web/API/Bluetooth/requestDevice).

From the docs for `Bluetooth.requestDevice`:
    ```
    The Bluetooth.requestDevice() method of the Bluetooth interface returns a Promise to a BluetoothDevice object with the specified options. If there is no chooser UI, this method returns the first device matching the criteria.
    ```
...where the syntax looks like:

    ```javascript
    Bluetooth.requestDevice([options])
        .then(function(bluetoothDevice) { /* ... */ })
    ```
...and where options is described as:

    ```
    options Optional
        An object that sets options for the device request. The available options are:

            filters[]: An array of BluetoothScanFilters. This filter consists of an array of BluetoothServiceUUIDs, a name parameter, and a namePrefix parameter.
            optionalServices[]: An array of BluetoothServiceUUIDs.
            acceptAllDevices: A boolean value indicating that the requesting script can accept all Bluetooth devices. The default is false.
    ```

Here, the call to `requestDevice` gets this as `options` (`this.deviceOptions` is set in Aranet4.js when `aranet4Device` is created ):

    ```javascript
        {
            filters: [
                {
                services: [SENSOR_SERVICE_UUID],
                },
                ],
            optionalServices: [
                'device_information',
                'battery_service',
                ],
        }

    ```

Now it's starting to make sense!
    - `filters[]` is `{services: [SENSOR_SERVICE_UUID]}`
    - `optionalServices[]` is `['device_information', 'battery_service']`
    - `acceptAllDevices` is not supplied!

So `requestDevice` returns `A Promise to a BluetoothDevice object`, [which is a simple object](https://developer.mozilla.org/en-US/docs/Web/API/BluetoothDevice) that looks like this:
    ```
        BluetoothDevice.id Read only
            A DOMString that uniquely identifies a device.

        BluetoothDevice.name Read only
            A DOMString that provices a human-readable name for the device.

        BluetoothDevice.gatt Read only
            A reference to the device's BluetoothRemoteGATTServer.
    ```

@kasparsd is only interested in the `gatt` field, which is a [`BluetoothRemoteGATTServer`](https://developer.mozilla.org/en-US/docs/Web/API/BluetoothRemoteGATTServer). This object has several fields and methods, of which he uses [`BluetoothRemoteGATTServer.connect()`](https://developer.mozilla.org/en-US/docs/Web/API/BluetoothRemoteGATTServer/connect) to setup the device. `connect` simply connects, returning `A Promise that resolves to a BluetoothRemoteGATTServer.`, which is then bubbled back out of `getDevice`.

Here, we return to `getGATTServer`, with the `Promise<BluetoothRemoteGATTServer>` in hand:
    ```javascript
        return this.getDevice()
            .then(server => {
                this.server = server
                return server
                })
    ```
...here `getGATTServer` refers to the object simply as `server` (not a named field here, grr), and assigns it to `BleDevice.server`. Then it also returns it so `getGATTServer` now returns `Promise<BluetoothRemoteGATTServer>`.

Now we return to `serviceCharacteristics` here: 
    ```javascript
        .then(server => server.getPrimaryService(serviceUuid))
    ```
...the object we're dealing with is a `Promise<BluetoothRemoteGATTServer>`, so we are in effect calling [`BluetoothRemoteGATTServer.getPrimaryService`](https://developer.mozilla.org/en-US/docs/Web/API/BluetoothRemoteGATTServer/getPrimaryService). Here, `serviceUuid` refers to `aranetServices.sensor.serviceUuid` in Aranet4.js (passed to `serviceCharacteristics` as the first parameter).

`BluetoothRemoteGATTServer.getPrimaryService` returns yet another object-promise, `a promise to the primary BluetoothRemoteGATTService offered by the bluetooth device for a specified BluetoothServiceUUID.`, a `Promise<BluetoothRemoteGATTService>`. [`BluetoothRemoteGATTService`](https://developer.mozilla.org/en-US/docs/Web/API/BluetoothRemoteGATTService) is where we're finally getting to the meat of the aranet4. The docs say:
    ```
    The BluetoothRemoteGATTService interface of the Web Bluetooth API represents a service provided by a GATT server, including a device, a list of referenced services, and a list of the characteristics of this service.
    ```

`BluetoothRemoteGATTService` has three properties:
    ```
    BluetoothRemoteGATTService.device Read only
        Returns information about a Bluetooth device through an instance of BluetoothDevice.

    BluetoothRemoteGATTService.isPrimary Read only
        Returns a boolean value indicating whether this is a primary or secondary service.

    BluetoothRemoteGATTService.uuid Read only
        Returns a DOMString representing the UUID of this service.
    ```
...and two methods:
    ```
    BluetoothRemoteGATTService.getCharacteristic()
        Returns a Promise to an instance of BluetoothRemoteGATTCharacteristic for a given universally unique identifier (UUID).

    BluetoothRemoteGATTService.getCharacteristics()
        Returns a Promise to an Array of BluetoothRemoteGATTCharacteristic instances for an optional universally unique identifier (UUID).
    ```
...@kasparsd calls [`BluetoothRemoteGATTService.getCharacteristics()`](https://developer.mozilla.org/en-US/docs/Web/API/BluetoothRemoteGATTService/getCharacteristics), which returns `a Promise to a list of BluetoothRemoteGATTCharacteristic instances for a given universally unique identifier (UUID).`, so `Promise<Array<BluetoothRemoteGATTCharacteristic>>`. The parameter appears to be optional, though *this* doc page doesn't explicitly say it.


Now we return to `serviceCharacteristics`... here I've formatted it reasonably:
    ```javascript
        .then(characteristics => {
            return Promise.all(
                characteristics
                    .filter(characteristic => characteristicUuids.includes(characteristic.uuid))
                    .map(async (characteristic) => {
                        const mapped = {
                            uuid: characteristic.uuid,
                            value: await characteristic.readValue(),
                            }
                        return mapped
                        }
                    ),
            )
        })
    ```

...The code is confusing, because @kasparsd is calling `Promise.all` on a mapped value. The observed value of this variable/object `characteristics` is as seen in the dev tools, an array of [`BluetoothRemoteGATTCharacteristic`](https://developer.mozilla.org/en-US/docs/Web/API/BluetoothRemoteGATTCharacteristic):
    ```
    0: BluetoothRemoteGATTCharacteristic {service: BluetoothRemoteGATTService, uuid: 'f0cd1401-95da-4f4b-9ac8-aa55d312af0c', properties: BluetoothCharacteristicProperties, value: null, oncharacteristicvaluechanged: null}
    1: BluetoothRemoteGATTCharacteristic {service: BluetoothRemoteGATTService, uuid: 'f0cd1402-95da-4f4b-9ac8-aa55d312af0c', properties: BluetoothCharacteristicProperties, value: null, oncharacteristicvaluechanged: null}
    2: BluetoothRemoteGATTCharacteristic {service: BluetoothRemoteGATTService, uuid: 'f0cd1502-95da-4f4b-9ac8-aa55d312af0c', properties: BluetoothCharacteristicProperties, value: null, oncharacteristicvaluechanged: null}
    3: BluetoothRemoteGATTCharacteristic {service: BluetoothRemoteGATTService, uuid: 'f0cd1503-95da-4f4b-9ac8-aa55d312af0c', properties: BluetoothCharacteristicProperties, value: null, oncharacteristicvaluechanged: null}
    4: BluetoothRemoteGATTCharacteristic {service: BluetoothRemoteGATTService, uuid: 'f0cd2001-95da-4f4b-9ac8-aa55d312af0c', properties: BluetoothCharacteristicProperties, value: null, oncharacteristicvaluechanged: null}
    5: BluetoothRemoteGATTCharacteristic {service: BluetoothRemoteGATTService, uuid: 'f0cd2002-95da-4f4b-9ac8-aa55d312af0c', properties: BluetoothCharacteristicProperties, value: null, oncharacteristicvaluechanged: null}
    6: BluetoothRemoteGATTCharacteristic {service: BluetoothRemoteGATTService, uuid: 'f0cd2003-95da-4f4b-9ac8-aa55d312af0c', properties: BluetoothCharacteristicProperties, value: null, oncharacteristicvaluechanged: null}
    7: BluetoothRemoteGATTCharacteristic {service: BluetoothRemoteGATTService, uuid: 'f0cd2004-95da-4f4b-9ac8-aa55d312af0c', properties: BluetoothCharacteristicProperties, value: null, oncharacteristicvaluechanged: null}
    8: BluetoothRemoteGATTCharacteristic {service: BluetoothRemoteGATTService, uuid: 'f0cd2005-95da-4f4b-9ac8-aa55d312af0c', properties: BluetoothCharacteristicProperties, value: null, oncharacteristicvaluechanged: null}
    9: BluetoothRemoteGATTCharacteristic {service: BluetoothRemoteGATTService, uuid: 'f0cd3001-95da-4f4b-9ac8-aa55d312af0c', properties: BluetoothCharacteristicProperties, value: null, oncharacteristicvaluechanged: null}
    length: 10
    [[Prototype]]: Array(0)
    ```
So now, he filters through this array looking for any `uuid` that matches any one from `characteristicUuids` earlier in the function (an array of "UUID representing a registered characteristic").

Sidenote, the fuck is the trailing comma after `.map()`?

Now we're here, at the `.map()` call, with only the characteristics we're interested in:

    ```javascript
                        .map(async (characteristic) => {
                            const mapped = {
                                uuid: characteristic.uuid,
                                value: await characteristic.readValue(),
                                }
                            return mapped
                            }
                        ),
    ```

...Here, `(characteristic)` is a single `BluetoothRemoteGATTCharacteristic`:

    ```javascript
    {
        service: BluetoothRemoteGATTService,
        uuid: 'f0cd1401-95da-4f4b-9ac8-aa55d312af0c',
        properties: BluetoothCharacteristicProperties,
        value: null,
        oncharacteristicvaluechanged: null
    }
    ```

...apparently, here, he is only interested in the {`uuid`, [`readValue`/`value`](https://developer.mozilla.org/en-US/docs/Web/API/BluetoothRemoteGATTCharacteristic/readValue) pair.} The `readValue` function `returns a Promise that resolves to a DataView holding a duplicate of the value property if it is available and supported.`.

In essence, the `Promise.all` is trying to resolve on those pairs. Now the `.then(characteristics =>` lambda returns, and we proceed to the next block:

    ```javascript
        .then(values => values.map(value => ({
            uuid: value.uuid,
            value: characteristicResolvers[value.uuid](value.value),
        })))
    ```
This is the last block in `serviceCharacteristics`. Let's reformat it a bit.

    ```javascript
        .then(values => 
            values.map(value => (
                    {
                        uuid: value.uuid,
                        value: characteristicResolvers[value.uuid](value.value),
                    })///anonymous object return
                )//.map close parenthesis
            )//.then close parenthesis
    ```

I dislike this style of code. We are three layers deep in callbacks.


Ok, so remember, `characteristicResolvers` was the second parameter to `serviceCharacteristics`. It's an object mapping the UUID characteristic strings to functions that parse the raw data from those characteristics. `values` should be the array of those unnamed {`uuid`/`value`} pairs from eariler. We're then re-parsing them into the same shape, but with the fully parsed values in `value`. Here, `value` gets the parsed value by looking up the resolver by UUID (`characteristicResolvers[value.uuid]`), which *should* always work, since we filtered for them (as a C++ programmer, I'll say that @kasparsd is clever here!), and calling that function with the raw  [`DataView`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DataView) returned by `readValue`. Thus, we should now have an array of uuids and values here. 




...We're not done yet!

`aranet4Device.serviceCharacteristics` was called from `Aranet4.toggleConnection`. The promise to the array of values here now gets passed to setState:

    ```javascript
        then(sensorReadings => {
            this.setState({
                error: null,
                connected: true,
                sensorValues: {
                    co2: String(sensorReadings[2].value.co2), // TODO: Don't assume the order of things -- lookup by the UUID instead.
                    temperature: String(sensorReadings[2].value.temperature),
                    pressure: String(sensorReadings[2].value.pressure),
                    humidity: String(sensorReadings[2].value.humidity),
                    battery: String(sensorReadings[2].value.battery),
                    },
                lastUpdated: new Date(sensorReadings[1].value * 1000),
                updateInterval: sensorReadings[0].value,
                })
            })    
    ```
...this is kinda an ugly way to do it tbh, since it's raw accessing the array :)