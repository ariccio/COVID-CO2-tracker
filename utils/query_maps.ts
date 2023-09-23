import * as fs from 'fs';

import { cleanIdsFromFile } from "./clean_places_google_ids";
import {AddressType, Client, PlaceDetailsRequest, PlaceDetailsResponse} from "@googlemaps/google-maps-services-js";
import { readAlreadySavedData } from './persistent_storage';

const SUGGESTED_FILE_POSTFIX = "_places_types_mapping_for_offline_analytics_only";
// TODO: If this gets complicated, just use any of:
//  https://www.npmjs.com/package/meow
//  https://www.npmjs.com/package/commander
//  https://www.npmjs.com/package/minimist

const ORIGINAL_INPUT_FILE_ARGV_POSITION = 2;
const OUTPUT_FILE_ARGV_POSITION = 3;


interface OfflineSavedPlaceDetailsForAnalyticsOnly {
    // many comments below are from @googlemaps/google-maps-services-js/dist/common.d.ts
    // See also: https://developers.google.com/maps/documentation/places/web-service/details#PlaceDetailsResponses
    // /**
    //  * contains the human-readable name for the returned result.
    //  * For establishment results, this is usually the canonicalized business name.
    //  */
    // name: string;
    /**
     * contains an array of feature types describing the given result.
     * XML responses include multiple `<type>` elements if more than one type is assigned to the result.
     */
    types: AddressType[];

    // /**
    //  * contains the URL of the official Google page for this place.
    //  * This will be the Google-owned page that contains the best available information about the place.
    //  * Applications must link to or embed this page on any screen that shows detailed results about the place to the user.
    //  */
    // url: string;
}

type ArrayOfPlaceIDs = string[];

interface SavedAllDataForPlacesOfflineAnalysisOnly {
    places_with_details_types: OfflineSavedPlaceDetailsForAnalyticsOnly[]
    places_by_type: Map<AddressType, ArrayOfPlaceIDs>;
}



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

function defaultNewOutputFileName(originalFile: string) {

    const outputFile = originalFile + `${SUGGESTED_FILE_POSTFIX}.json`;
    return outputFile;
}



function defaultOutputFileOrChosenFile(originalInputFile: string): string | null {    
    const defaultOutputFile = defaultNewOutputFileName(originalInputFile);
    if (process.argv.length <= OUTPUT_FILE_ARGV_POSITION) {
        console.log('No output file specified. Will use default.');
        return defaultOutputFile;
    }
    const outputFromCommandLineIfAny = process.argv[OUTPUT_FILE_ARGV_POSITION]
    console.log(`Supplied '${outputFromCommandLineIfAny}' as output file in argv[${OUTPUT_FILE_ARGV_POSITION}]`);
    if (outputFromCommandLineIfAny.length === 0) {
        console.warn(`specified output file name length is zero, will use default`);
        return defaultOutputFile;
    }

    if (!outputFromCommandLineIfAny.includes(SUGGESTED_FILE_POSTFIX)) {
        console.warn(`The specified output file does not end in the recommended postfix.`);
        return null;
    }

    return outputFromCommandLineIfAny;
}


function main() {
    const originalFile = process.argv[ORIGINAL_INPUT_FILE_ARGV_POSITION];
    console.log(`Supplied '${originalFile}' as input file in argv[${ORIGINAL_INPUT_FILE_ARGV_POSITION}]`);
    const ids = cleanIdsFromFile(originalFile);
    if (ids === null) {
        return -1;
    }

    console.log(`first ten IDs from input file: ${ids.slice(0, 10)}`);


    const key = fs.readFileSync(`analysis_key.key`).toString();
    if (key.length === 0) {
        console.error(`no API key!`);
        return -1;
    }

    // console.log(ids[0]);
    const id = String(ids[0]);
    console.log(`querying ${id}...`);

    const outputFile = defaultOutputFileOrChosenFile(originalFile);
    if (outputFile === null) {
        return -1;
    }
    console.log(`Output file name (saving not yet impl): '${outputFile}'`);

    const alreadySavedData = readAlreadySavedData(outputFile);

    const client = new Client({});
    const request: PlaceDetailsRequest = placeDetailsRequestForPlace(key, id);
    
    // https://developers.google.com/maps/documentation/places/web-service/details
    client.placeDetails(request).then(successfulPlaceDetailsRequest)
    .catch((e) => {
        console.log(e.response.data.error_message);
    });
}


main()