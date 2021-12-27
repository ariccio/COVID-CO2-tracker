From [DeviceID_SPEC_V13.pdf](https://www.bluetooth.org/docman/handlers/DownloadDoc.ashx?doc_id=75536), "DEVICE IDENTIFICATION PROFILE SPECIFICATION"

The Device ID Service Record attributes:

SpecificationID 0x0200 Uint16 M 5.1
VendorID 0x0201 Uint16 M 5.2
ProductID 0x0202 Uint16 M 5.3
Version 0x0203 Uint16 M 5.4
PrimaryRecord 0x0204 Boolean M 5.5
VendorIDSource 0x0205 Uint16 M 5.6
ClientExecutableURL 0x000B URL O Note 3
ServiceDescription 0x0001 Note 1 String O Note 3
DocumentationURL 0x000A URL O Note 3


Endianness:
Some data may be in the wrong order. For example:

	services[0], characteristics[5].uuid: f0cd2002-95da-4f4b-9ac8-aa55d312af0c
		Known Aranet4 characteristic! 'Aranet4: measurement interval'
	services[0], characteristics[5].properties:
		read: true
		DataView length: 2 bytes
		Trying to parse data as UTF-8 string: '<'
		Trying to parse data as uint8 array: '60,0'
		Trying to parse data as uint16 array: '15360'


	services[0], characteristics[7].uuid: f0cd2004-95da-4f4b-9ac8-aa55d312af0c
		Known Aranet4 characteristic! 'Aranet4: seconds since last update'
	services[0], characteristics[7].properties:
		read: true
		DataView length: 2 bytes
		Trying to parse data as UTF-8 string: ';'
		Trying to parse data as uint8 array: '59,0'
		Trying to parse data as uint16 array: '15104'


See also: https://stackoverflow.com/a/55163224
(quotes the spec): 
    "Multi-octet fields within the GATT Profile shall be sent least significant octet first (little endian)."



'f0cd2005-95da-4f4b-9ac8-aa55d312af0c' may contain many things (when parsed as little endian unt16):
    total number of measurements?
    Also may contain humidity?
    And battery? 


12/25/2021, reverse engineering the aranet4 app to understand more.
    It's a react native app!
    Can find relevant strings easily:
        k = 'F0CD1400-95DA-4F4B-9AC8-AA55D312AF0C',
        C = 'f0cd1402-95da-4f4b-9ac8-aa55d312af0c',
    Some defaults:
            var F = (n = {}, (0, p.default)(n, A.CO2, 4), (0, p.default)(n, A.TEMPERATURE, 1), (0, p.default)(n, A.HUMIDITY, 2), (0, p.default)(n, A.PRESSURE, 3), n),
                L = (u = {}, (0, p.default)(u, A.CO2, 1), (0, p.default)(u, A.TEMPERATURE, .05), (0, p.default)(u, A.HUMIDITY, 1), (0, p.default)(u, A.PRESSURE, .1), u),
                M = (s = {}, (0, p.default)(s, A.CO2, 1e4), (0, p.default)(s, A.TEMPERATURE, 200), (0, p.default)(s, A.HUMIDITY, 101), (0, p.default)(s, A.PRESSURE, 2500), s);
            e.INSANITY_THRESHOLD = M;
    Some parsing functions:
        var N = function (t) {
                return y.default.Buffer.from(t).toString()
            },
            O = function (t) {
                return ('0'.repeat(8) + t.toString(2)).slice(-8).split('').map(parseFloat).reverse()
            },
            B = function (t, n) {
                var u = [];
                do {
                    var s = 255 & t;
                    u.push(s), t = (t - s) / Math.pow(2, 8)
                } while (isNaN(n) ? t : n > u.length);
                return u
            },
            H = function () {
                for (var t = arguments.length, n = new Array(t), u = 0; u < t; u++) n[u] = arguments[u];
                return n.reduce(function (t, n, u) {
                    return t + n * Math.pow(2, 8 * u)
                }, 0)
            },

    "O" is called by parseCalibrationState:
        var n = O(t);
        return n[3] ? n[2] ? U.InErrorState : U.EndRequest : n[2] ? U.InProgress : U.NotActive
    ...and several others: parseManufacturerData, getSensorReadings, loadSensorState, 


    More interesting things:
        "f0cd1502-95da-4f4b-9ac8-aa55d312af0c" is the first characteristic read in loadLastCalibration. It is parsed as:
            var n = H.apply(void 0, (0, c.default)(t));
            switch (n) {
            case 0x10000000000000000:
                return {
                    atFactory: !0
                };
            case 0x10000000000000000:
                return {
                    error: 'unstable'
                };
            case 0x10000000000000000:
                return {
                    error: 'unexpected'
                };
            default:
                return n < 1514764800 ? {
                    before: (0, T.default)().subtract(n, 'seconds').valueOf()
                } : {
                    timestamp: 1e3 * n
                }
        ...the way I interpret this, it makes sense that the 8 byte value is all 255s when read as uint8s. As a fun side note, 1514764800 is 192 "quarter" (quarter years), or 48 years.
        1514764800 is the Unix time for Monday, 1 January 2018 00:00:00 UTC. 0x10000000000000000 is 2^60. So, 
        getSensorReadings dispatches a few different things. In case 0, it reads the current CO2 measurement:
            return c.next = 2, o.default.awrap(w.default.read(t, k, "F0CD1503-95DA-4F4B-9AC8-AA55D312AF0C"));
        In case 2, it does something fancy:
            return n = c.sent, u = y.default.Buffer.from(n), (s = {
                takenAt: Date.now()
            })[A.CO2] = u.readUInt16LE(0) * L[A.CO2], s[A.TEMPERATURE] = u.readInt16LE(2) * L[A.TEMPERATURE], s[A.PRESSURE] = u.readUInt16LE(4) * L[A.PRESSURE], s[A.HUMIDITY] = u.readUInt8(6) * L[A.HUMIDITY], s.battery = u.readUInt8(7), l = O(n[8]), s.color = l[1] ? l[0] ? R.default.red : R.default.yellow : l[0] ? R.default.green : R.default.text, s.calibrationState = this.parseCalibrationState(n[8]), c.abrupt("return", s);

---
        Note to self: is "case 0", "case 2", "case 9"/"case end" part of the async reentrency implementation?
---

        "F0CD2004-95DA-4F4B-9AC8-AA55D312AF0C" may return the time since the last update, AND the interval:
            return u = c.sent, s = y.default.Buffer.from(u), l = s.readUInt16LE(0), c.abrupt("return", {
                readingsInterval: n,
                timePassed: l
            });
        
        "f0cd1401-95da-4f4b-9ac8-aa55d312af0c" appears to hold the WHOLE sensor state! I'll copy & paste the code here:
            key: "loadSensorState",
            value: function (t) {
                var n, u, s, l;
                return o.default.async(function (c) {
                    for (;;) switch (c.prev = c.next) {
                    case 0:
                        return c.next = 2, o.default.awrap(w.default.read(t.id, k, "f0cd1401-95da-4f4b-9ac8-aa55d312af0c"));
                    case 2:
                        return n = c.sent, D.default.log('good?', 241 === n[0], n), u = O(n[1]), s = O(n[2]), l = {
                            buzzerSetting: u[0] ? u[1] ? 'each' : 'once' : 'off',
                            calibrationState: this.parseCalibrationState(n[1]),
                            calibrationProgress: n[3],
                            isRadioOn: !!u[4],
                            temperatureUnit: u[5] ? 'C' : 'F',
                            isUsingCustomThreshold: !u[6],
                            isAutomaticCalibrationEnabled: !!u[7],
                            isLoRaEnabled: !!u[4],
                            isBuzzerAvailable: !!s[0],
                            bluetoothRange: s[1] ? 'extended' : 'normal',
                            isOpenForIntegration: !!s[7],
                            customRedThreshold: H(n[10], n[11]),
                            customYellowThreshold: H(n[8], n[9]),
                            defaultRedThreshold: H(n[6], n[7]),
                            defaultYellowThreshold: H(n[4], n[5])
                        }, b.default.dispatch({
                            type: 'updateSensorState',
                            device: t,
                            payload: l
                        }), c.abrupt("return", l);
                    case 9:
                    case "end":
                        return c.stop()
                    }
                }, null, this, null, Promise)
        "F0CD2005-95DA-4F4B-9AC8-AA55D312AF0C" likely contains all logged data? Done in a super complex multi-step async function in readLogData:
            value: function (t, n) {
                var u, s, c, f, h, v, b, x, I, R, T, C, S, P, U, M, N = this;
                return o.default.async(function (O) {
                    for (;;) switch (O.prev = O.next) {
                    case 0:
                        return O.next = 2, o.default.awrap(w.default.read(t.id, k, "F0CD2005-95DA-4F4B-9AC8-AA55D312AF0C"));
                    case 2:
                        if (u = O.sent, s = Math.floor(Date.now() / 1e3), c = y.default.Buffer.from(u), 0 !== (f = c.readUInt8(0))) {
                            O.next = 8;
                            break
                        }
                        throw 'error in parameters';
                    case 8:
                        if (129 !== f) {
                            O.next = 11;
                            break
                        }
                        return D.default.log('reading in progresss. schedule reading logs after 1 second'), O.abrupt("return", (0, E.delayed)(1e3).then(function () {
                            return N.readLogData(t, n)
                        }));
                    case 11:
                        if (h = Object.keys(F).find(function (t) {
                                return F[t] === f
                            })) {
                            O.next = 14;
                            break
                        }
                        throw "unknown measurement " + f;
                    case 14:
                        v = c.readUInt16LE(1), b = c.readUInt16LE(3), x = c.readUInt16LE(5), I = c.readUInt16LE(7), R = c.readUInt8(9), T = s - (x + b * v), C = 0;
                    case 21:
                        if (!(C < R)) {
                            O.next = 32;
                            break
                        }
                        if (0 !== (S = I + C)) {
                            O.next = 25;
                            break
                        }
                        return O.abrupt("continue", 29);
                    case 25:
                        P = h === A.HUMIDITY ? c.readUInt8(10 + C) : h === A.TEMPERATURE ? c.readInt16LE(10 + 2 * C) : c.readUInt16LE(10 + 2 * C), U = P * L[h], n[M = T + S * v] = (0, l.default)({}, n[M], (0, p.default)({}, h, U));
                    case 29:
                        C++, O.next = 21;
                        break;
                    case 32:
                        if (0 === R) {
                            O.next = 34;
                            break
                        }
                        return O.abrupt("return", this.readLogData(t, n));
                    case 34:
                    case "end":
                        return O.stop()
                    }

        There's also a loadDataLogV2, which is curious, since it also writes to the "set history parameter":
            var n, u, s, f, h, p, v, y, x, A, I, R, T, C, S, P, U, L, M, N, O = this;
            return o.default.async(function (H) {
                for (;;) switch (H.prev = H.next) {
                case 0:
                    return u = (0, l.default)({}, null == (n = b.default.getState().logs) ? void 0 : n[t.id]), s = Date.now() / 1e3, Object.keys(u).forEach(function (t) {
                        s - t > 1209600 && delete u[t]
                    }), H.next = 5, o.default.awrap((0, E.retry)(5, function () {
                        return O.connectToDevice(t)
                    }));
                case 5:
                    return H.prev = 5, H.next = 8, o.default.awrap((0, E.retry)(5, function () {
                        return O.retrieveServices(t)
                    }));
                case 8:
                    return H.next = 10, o.default.awrap(this.getReadingsIntervalAndTimePassed(t.id));
                case 10:
                    return f = H.sent, h = f.readingsInterval, p = f.timePassed, v = Math.round(Date.now() / 1e3) - p, H.next = 16, o.default.awrap(this.getLoggedRecordCount(t));
                case 16:
                    y = H.sent, x = v - y * h, A = Object.keys(u), I = A.length, R = A[I - 1] - A[I - 2] > h ? 0 : Object.keys(u).reduce(function (t, n) {
                        return isNaN(n) || t > n ? t : parseInt(n)
                    }, 0), T = 3, C = Math.max(0, Math.floor((R - x) / h) - T), S = B(C, 2), P = 0, U = Object.values(F);
                case 25:
                    if (!(P < U.length)) {
                        H.next = 34;
                        break
                    }
                    return L = U[P], H.next = 29, o.default.awrap(w.default.write(t.id, k, "F0CD1402-95DA-4F4B-9AC8-AA55D312AF0C", [97, L].concat((0, c.default)(S))));
                case 29:
                    return H.next = 31, o.default.awrap(this.readLogData(t, u));
                case 31:
                    P++, H.next = 25;
                    break;
                case 34:
                    return H.prev = 34, H.next = 37, o.default.awrap(this.disconnectFromDevice(t).catch(D.default.log));
                case 37:
                    return H.finish(34);
                case 38:
                    M = Object.keys(u), N = M.shift() % 60, M.forEach(function (t) {
                        var n = t % 60;
                        if (n !== N) {
                            var s = t - n + N;
                            u[s] = u[s] || {}, Object.keys(F).forEach(function (n) {
                                var o;
                                u[s][n] = u[s][n] || (null == (o = u[t]) ? void 0 : o[n]) || null
                            }), delete u[t]
                        }
                    }), b.default.dispatch({
                        type: 'setLogs',
                        device: t,
                        payload: u
                    });
                case 42:
                case "end":
                    return H.stop()
                }

    So, I guess now we know something:
        "f0cd1401-95da-4f4b-9ac8-aa55d312af0c" is the sensor settings state, packed into a small struct.
        "f0cd1502-95da-4f4b-9ac8-aa55d312af0c" is the sensor calibration.
        "f0cd2003-95da-4f4b-9ac8-aa55d312af0c" appears to be unused - no reference to it in the entire app. Maybe that's why it contains all zeros?
        "F0CD2005-95DA-4F4B-9AC8-AA55D312AF0C" appears to be the characteristic for the sensor logs.