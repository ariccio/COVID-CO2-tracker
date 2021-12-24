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