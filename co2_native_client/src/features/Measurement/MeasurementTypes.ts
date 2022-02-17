/*
Web measurement request looks like this:

    measurement: {
        device_id: selectedDevice,
        co2ppm: enteredCO2,
        google_place_id: placeId,
        crowding: enteredCrowding,
        location_where_inside_info: enteredLocationDetails,
        sub_location_id: selectedSubLocation,
        // measurementtime: new Date().toUTCString()
        ...dateTimeIfCustom(userTimeRadioValue, dateTime)
    }

(also)

    const dateTimeIfCustom = (userTimeRadioValue: ToggleButtonUserRadios, dateTime: Date) => {
        if (userTimeRadioValue === ToggleButtonUserRadios.Now) {
            return undefined;
        }
        return {
            measurementtime: dateTime
        }
    }

...where datetTime is constructed as:
    const [dateTime, setDateTime] = useState(new Date());

...and is only changed by DatePicker.

Date::Date is:
    "No parameters When no parameters are provided, the newly-created Date object represents the current date and time as of the time of instantiation."

In database, looks like this:

    t.bigint "device_id", null: false
    t.integer "co2ppm", null: false
    t.datetime "measurementtime", null: false
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.integer "crowding"
    t.bigint "sub_location_id"

*/

export interface MeasurementDataForUpload {
    device_id: number,
    co2ppm: number,
    measurementtime: Date,
    // google_place_id: string,
    // sub_location_id: number
};


