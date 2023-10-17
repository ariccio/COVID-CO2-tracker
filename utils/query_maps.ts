import * as fs from 'fs';

import { cleanIdsFromFile } from "./clean_places_google_ids";
import {AddressType, Client, PlaceDetailsRequest, PlaceDetailsResponse} from "@googlemaps/google-maps-services-js";
import { readAlreadySavedData } from './persistent_storage';
import { request } from 'http';
// import { AddressTypeWithMissingTypes } from './typescript_fucking_annoyances';

// type AddressTypeWithMissingTypes = AddressType;

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
    // types: AddressTypeWithMissingTypes[];
    types: AddressType[];

    // /**
    //  * contains the URL of the official Google page for this place.
    //  * This will be the Google-owned page that contains the best available information about the place.
    //  * Applications must link to or embed this page on any screen that shows detailed results about the place to the user.
    //  */
    // url: string;
}

type ArrayOfPlaceIDs = string[];

// type fancyMappedTypeForPlacesByType = {[placeType in AddressTypeWithMissingTypes] : string[]}
type fancyMappedTypeForPlacesByType = {[placeType in AddressType] : string[]}
interface SavedAllDataForPlacesOfflineAnalysisOnly {
    places_with_details_types: Map<string, OfflineSavedPlaceDetailsForAnalyticsOnly>;
    places_by_type: fancyMappedTypeForPlacesByType;
}
type serializedPlacesWithDetailsTypes = {
    [key: string]: OfflineSavedPlaceDetailsForAnalyticsOnly
}

interface SavedAllSerializedDataForPlacesOfflineAnalysisOnly {
    places_with_details_types: serializedPlacesWithDetailsTypes
    places_by_type: fancyMappedTypeForPlacesByType;
}


function dumpMap(map: Map<string, OfflineSavedPlaceDetailsForAnalyticsOnly>) {
    console.log(`Map values:`);
    map.forEach((value, key, theMap) => {
        console.log(`Map['${key}']: ${map.get(key)?.types}`)
    })
}

function dumpPlacesByType(places_by_type: fancyMappedTypeForPlacesByType) {
    // (Object.keys(places_by_type)as Array<keyof typeof AddressTypeWithMissingTypes>).forEach((key) => {
    (Object.keys(places_by_type)as Array<keyof typeof AddressType>).forEach((key) => {
        if ((places_by_type as fancyMappedTypeForPlacesByType)[key].length > 0) {
            console.log(`place type: ${String(key)}: ${(places_by_type as fancyMappedTypeForPlacesByType)[key]}`);
        }
    })
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


function successfulPlaceDetailsRequest(value: PlaceDetailsResponse, collectedPlacesData: SavedAllDataForPlacesOfflineAnalysisOnly, requestedPlaceID: string) {
    // console.log(`response succeeded, data:`);
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

        Object.entries(value.data.result).forEach(([key, entryValue]) => {
            if (Array.isArray(entryValue)) {
                console.log(`key '${key}' is an array. Values: ${entryValue.toString()}`);
            }
            else if (typeof(entryValue) === "object") {
                console.log(`key '${key}' has fancy types, object as JSON instead: ${JSON.stringify(entryValue)}`)
            }
            else {
                console.log(`key '${key}', value: '${entryValue}'`); // "a 5", "b 7", "c 9"
            }
        })
        if (value.data.result.place_id === undefined) {
            // Happens. I dunno why right now. Probably just not requesting it?
            // console.warn(`response for place request for ${requestedPlaceID} is missing... the place id`);
            // return;
        }
        if (value.data.result.place_id !== undefined) {
            if (value.data.result.place_id !== requestedPlaceID) {
                console.error(`response contains different place ID than request`);
                throw new Error(`response (${value.data.result.place_id}) contains different place ID than request (${requestedPlaceID}).`);
            }
        }

        if (value.data.result.types === undefined) {
            console.warn(`result.types of ${requestedPlaceID} is undefined!`)
            return;
        }
        if (!Array.isArray(value.data.result.types)) {
            console.warn(`response for place request for ${requestedPlaceID} contains non-array place types: ${typeof(value.data.result.types)}: as JSON: '${JSON.stringify(value.data.result.types)}'`);
            return;
        }
        if (value.data.result.types.length > 2) {
            value.data.result.types = value.data.result.types.slice(0, 2);
        }
        if (value.data.result.types.length === 0) {
            console.warn(`response for place request for ${requestedPlaceID} has empty place types array?`);
            return;
        }
        if (value.data.result.types.length === 1) {
            console.warn(`place ${requestedPlaceID} has only one place type?`);
        }
        if(collectedPlacesData.places_with_details_types.has(requestedPlaceID)) {
            console.warn(`map already has ${requestedPlaceID}??`);
        }
        else {
            // console.log(`new place for array`);
            collectedPlacesData.places_with_details_types.set(requestedPlaceID, {types: value.data.result.types})
            // console.log(`pushing first...`);
            collectedPlacesData.places_by_type[value.data.result.types[0]].push(requestedPlaceID);
            // console.log(`pushing second...`);
            // console.log(`value.data.result.types.length: ${value.data.result.types.length}`);
            // console.log(`The type to push: ${value.data.result.types[1]}`)
            // console.log(`typeof collectedPlacesData.places_by_type[value.data.result.types[1]]: ${typeof(collectedPlacesData.places_by_type[value.data.result.types[1]])}`);
            
            if (typeof(collectedPlacesData.places_by_type[value.data.result.types[1]]) === "undefined") {
                // console.log(`branch entry`)
                const newType = value.data.result.types[1] as string;
                console.log(`new type created ${newType}...`);
                const newObjFromJSON = JSON.parse(`{"${newType}": ["${requestedPlaceID}"]}`);
                // console.log(`JSON.stringify(newObjFromJSON): ${JSON.stringify(newObjFromJSON)}`)
                // const newObj = Object.assign({
                //     newType: [requestedPlaceID]
                // });
                console.log(`merging...`);
                collectedPlacesData.places_by_type = {
                    ...collectedPlacesData.places_by_type,
                    ...newObjFromJSON
                    
                } as fancyMappedTypeForPlacesByType;
            }
            else {
                // console.log("other branch")
                collectedPlacesData.places_by_type[value.data.result.types[1]].push(requestedPlaceID);
            }
            // console.log(`Added ${value.data.result.types[0]} and ${value.data.result.types[1]}`)
        }
        // console.log(`next`);

        // dumpMap(collectedPlacesData.places_with_details_types);
        // console.log(`collectedPlacesData.places_by_type: ${JSON.stringify(collectedPlacesData.places_by_type)}`)
        // dumpPlacesByType(collectedPlacesData.places_by_type);
        return;
    }

    if (value.data.result.length === 0) {
        console.log("empty result");
        return;
    }
    for (let i = 0; i < value.data.result[0].data.keys.length; ++i) {
        console.log(`-- what is this for? --`)
        console.log(`key ${i}: ${value.data.result[0].keys[i]}`);
    }
    // console.table(value.data);
    console.log(`---what gets here? ---`)
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

    console.log(`Output file name (saving not yet impl): '${outputFromCommandLineIfAny}'`);
    return outputFromCommandLineIfAny;
}


function initializeCollectedPlacesData(): SavedAllDataForPlacesOfflineAnalysisOnly {
    const initializedPlacesByType = new Object();

    // (Object.keys(AddressTypeWithMissingTypes)as Array<keyof typeof AddressTypeWithMissingTypes>).forEach((key) => {
    (Object.keys(AddressType)as Array<keyof typeof AddressType>).forEach((key) => {
        (initializedPlacesByType as fancyMappedTypeForPlacesByType)[key] = new Array<string>;
    })
    
    
    const collectedPlacesData: SavedAllDataForPlacesOfflineAnalysisOnly = {
        places_with_details_types: new Map(),
        places_by_type: initializedPlacesByType as fancyMappedTypeForPlacesByType
    };
    // console.log(collectedPlacesData);
    return collectedPlacesData;
}

async function wrappedRequest(client: Client, request: PlaceDetailsRequest): Promise<PlaceDetailsResponse | null> {
    try {
        return await client.placeDetails(request);
    }
    catch (error) {
        console.error(`Error requesting place details: ${JSON.stringify(error)}`);
        return null;
    }
}


function saveDataSerialized(collectedPlacesData: SavedAllDataForPlacesOfflineAnalysisOnly, outputFile: string) {
    const initializedPlacesByType = new Object();


    /*
        (Object.keys(places_by_type)as Array<keyof typeof AddressType>).forEach((key) => {
        if ((places_by_type as fancyMappedTypeForPlacesByType)[key].length > 0) {
            console.log(`place type: ${String(key)}: ${(places_by_type as fancyMappedTypeForPlacesByType)[key]}`);
        }
    })

    */

    // (Object.keys(AddressTypeWithMissingTypes)as Array<keyof typeof AddressTypeWithMissingTypes>).forEach((key) => {
    (Object.keys(AddressType) as Array<keyof typeof AddressType>).forEach((key) => {
        if ((collectedPlacesData.places_by_type as fancyMappedTypeForPlacesByType)[key].length > 0) {
            (initializedPlacesByType as fancyMappedTypeForPlacesByType)[key] = (collectedPlacesData.places_by_type as fancyMappedTypeForPlacesByType)[key];
        }
    });
    console.log(`cursed iterator done`);

    const serializedData: SavedAllSerializedDataForPlacesOfflineAnalysisOnly = {
        places_with_details_types: {},
        places_by_type: initializedPlacesByType as fancyMappedTypeForPlacesByType
    };

    console.log(`walking each place`)

    collectedPlacesData.places_with_details_types.forEach((value, key, theMap) => {
        // console.log(`Map['${key}']: ${theMap.get(key)?.types}`)
        const values = theMap.get(key);
        if (values === undefined) {
            console.warn("missing values in map - cannot persist?!?");
            return;
        }
        // console.log(`key: ${key}`);
        // console.log(JSON.stringify(serializedData.places_with_details_types));
        // console.log(Object.keys(serializedData.places_with_details_types));
        // console.log(`serializedData.places_with_details_types[key]: ${serializedData.places_with_details_types[key]}`);
        // if (Object.keys(serializedData.places_with_details_types).length === 0) {

        // }
        const newTypes = values.types;

        let newTypesAsJSON = `[`;
        for (let i = 0; i < newTypes.length; ++i) {
            newTypesAsJSON += `"${newTypes[i]}",`;
        }
        newTypesAsJSON = newTypesAsJSON.slice(0, -1);
        newTypesAsJSON += "]"

        const newKey = `{
            "${key}": {
                "types": 
                    ${newTypesAsJSON}
                
            }
        }`
        // console.log(`newkey as json: ${newKey}`);
        serializedData.places_with_details_types = {
            ...serializedData.places_with_details_types,
            ...JSON.parse(newKey)
        }
        // serializedData.places_with_details_types[key].types = values.types;
    })

    try {
        fs.writeFileSync(outputFile, JSON.stringify(serializedData));
    }
    catch (error) {
        console.error(`Failed to write data!! ${JSON.stringify(error)}, err.message: ${(error as any)?.message}, stack: ${(error as any)?.stack}`);
    }


}


async function queryAllDataAndSaveAsync(key: string, client: Client, collectedPlacesData: SavedAllDataForPlacesOfflineAnalysisOnly, ids: string[], outputFile: string) {
    for (let i = 0; i < ids.length; ++i) {
        console.log(`${i}/${ids.length}`)
        const thisID = ids[i];

        if (collectedPlacesData.places_with_details_types.has(thisID)) {
            const thisIDDetails = collectedPlacesData.places_with_details_types.get(thisID);
            if (thisIDDetails === undefined) {
                console.error('thisIDDetails === undefined')
                throw new Error("OK, this makes no sense.");
            }

            // I could do this, but it seems slow. Leave for now.
            // if (collectedPlacesData.places_by_type[thisIDDetails.types[0]])
            continue;
        }

        const request: PlaceDetailsRequest = placeDetailsRequestForPlace(key, thisID);
    
        // console.log(`querying ${thisID}...`);
        const requestResult = await wrappedRequest(client, request);
        if (requestResult === null) {
            continue;
        }
        if (requestResult.status !== 200) {
            console.error(`request response is NOT OK: ${requestResult.status}`);
            console.error(`Request status: ${requestResult.statusText}`);
        }
        // console.log(`parsing...`);

        // https://developers.google.com/maps/documentation/places/web-service/details
        try {
            successfulPlaceDetailsRequest(requestResult, collectedPlacesData, thisID)
        }
        catch ( error ) {
            console.error(`Some kind of error parsing the place response?: ${JSON.stringify(error)}`);
            // throw error;
        }
        
        // .then((value) => 
        //     .catch((e) => {
        //         console.log(e.response.data.error_message);
        //     });

    }
    try {
        console.log(`Trying to save...`)
        saveDataSerialized(collectedPlacesData, outputFile);
    }
    catch (error) {
        console.error(`Failed to save data: ${JSON.stringify(error)}, message: ${(error as any)?.message}, stack: ${(error as any)?.stack}`);
    }
    
    // dumpMap(collectedPlacesData.places_with_details_types);
    // dumpPlacesByType(collectedPlacesData.places_by_type);

}




function main() {
    const originalFile = process.argv[ORIGINAL_INPUT_FILE_ARGV_POSITION];
    console.log(`Supplied '${originalFile}' as input file in argv[${ORIGINAL_INPUT_FILE_ARGV_POSITION}]`);
    const ids = cleanIdsFromFile(originalFile);
    if (ids === null) {
        return -1;
    }
    if (ids.length < 1) {
        console.error(`No IDs to query.`);
        return -1;
    }

    // console.log(`first ten IDs from input file: ${ids.slice(0, 10)}`);


    const key = fs.readFileSync(`analysis_key.key`).toString();
    if (key.length === 0) {
        console.error(`no API key!`);
        return -1;
    }

    // console.log(ids[0]);
    // const firstID = String(ids[0]);

    const outputFile = defaultOutputFileOrChosenFile(originalFile);
    if (outputFile === null) {
        return -1;
    }

    const collectedPlacesData = initializeCollectedPlacesData();
    const alreadySavedData = readAlreadySavedData(outputFile);
    let needsNewSavefile = false;
    if (alreadySavedData === undefined) {
        needsNewSavefile = true;
    }

    const client = new Client({});
    queryAllDataAndSaveAsync(key, client, collectedPlacesData, ids, outputFile).then((result) => {
        console.log("Done writing data.");
        return;
    }).catch((error) => {
        console.error(`query data and save failed! ${JSON.stringify(error)}`);
    });

    
}


main()

