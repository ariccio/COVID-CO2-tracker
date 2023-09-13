import * as fs from 'fs';

import { cleanFile } from "./clean_places_google_ids";
import {Client, PlaceDetailsRequest, PlaceDetailsResponse} from "@googlemaps/google-maps-services-js";


function placeDetailsRequestForPlace(key: string, id: string): PlaceDetailsRequest {
    return {
        params: {
            key: key,
            place_id: id,
            fields: ['type']
        }
    };
}


function successfulPlaceDetailsRequest(value: PlaceDetailsResponse) {
    console.log(`response succeeded, data:`);
    if (value.data.result === undefined) {
        console.log("resutls undefined");
        return;
    }
    if (!Array.isArray(value.data.result)) {
        // console.log(`result ${JSON.stringify(value.data.result)} not array.`);
        if (value.data.result.address_components !== null) {
            delete value.data.result.address_components;
        }
        if (value.data.result.photos !== null) {
            delete value.data.result.photos;
        }
        if (value.data.result.reviews !== null) {
            delete value.data.result.reviews;
        }

        Object.entries(value.data.result).forEach(([key, value]) => {
            if (typeof(value) === "object") {
                console.log(`key ${key}, object as JSON instead: ${JSON.stringify(value)}`)
            }
            else {
                console.log(`key '${key}', value: '${value}'`); // "a 5", "b 7", "c 9"
            }
        })

        return;
    }

    if (value.data.result.length === 0) {
        console.log("empty result");
        return;
    }
    for (let i = 0; i < value.data.result[0].data.keys.length; ++i) {
        console.log(`key ${i}: ${value.data.result[0].keys[i]}`);
    }
    // console.table(value.data);
    console.log(`response succeeded, data: ${JSON.stringify(value.data)}`);

}


function main() {
    const originalFile = process.argv[2];
    
    const ids = cleanFile(originalFile);
    console.log(ids);

    // console.log(ids[0]);
    const id = String(ids[0]);
    console.log(`querying ${id}...`);

    const key = fs.readFileSync(`analysis_key.key`).toString();
    
    const outputFile = originalFile + "_places_types.json";
    
    const client = new Client({});
    const request: PlaceDetailsRequest = placeDetailsRequestForPlace(key, id);
    
    // https://developers.google.com/maps/documentation/places/web-service/details
    client.placeDetails(request).then(successfulPlaceDetailsRequest)
    .catch((e) => {
        console.log(e.response.data.error_message);
    });
}


main()