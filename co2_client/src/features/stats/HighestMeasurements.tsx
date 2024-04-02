import * as Sentry from "@sentry/browser"; // for manual error reporting.

import React, {useEffect, useState, Suspense, Dispatch, SetStateAction} from 'react';
import { useTranslation } from 'react-i18next';


import { formatErrors } from '../../utils/ErrorObject';
import { fetchJSONWithChecks } from '../../utils/FetchHelpers';
import { API_V2_URL } from '../../utils/UrlPath';
import { unknownErrorTryFormat } from "../../utils/FormatUnknownObject";
import { HighestMeasurementsTable } from "../measurements/HighestMeasurementsTable";

/*

    # {
    # "ten_places"=>[
        # {"id"=>2, "google_place_id"=>"ChIJbVog-MFYwokRDS9_fOijV2U"}
    # ],
    # "ten_sublocations"=> [
        # {"id"=>2, "description"=>"Ugh lo-fi semiotics cleanse normcore craft beer gluten-free banjo.", "place_id"=>2},
        # {"id"=>1, "description"=>"Next level pour-over scenester.", "place_id"=>2}
    # ],
    # "ten_measurements"=>[
        # {"id"=>2, "co2ppm"=>5693, "device_id"=>2, "measurementtime"=>"2024-03-20T02:27:25.575Z", "sub_location_id"=>2},
    #   {"id"=>1, "co2ppm"=>495, "device_id"=>2, "measurementtime"=>"2024-03-20T02:27:25.534Z", "sub_location_id"=>1}
    # ]
    # }


    table header: co2ppm, device id, sublocation name, place name, measurement time
*/

export type basicPlace = {id: number, google_place_id: string};
export type basicSublocation = {id: number, description: string, place_id: number};
export type basicMeasurement = {id: number, co2ppm: number, device_id: number, measurementtime: string, sub_location_id: number};

export interface HighestMeasurementsResponse {
    ten_places: basicPlace[] | null;
    ten_sublocations: basicSublocation[] | null;
    ten_measurements: basicMeasurement[] | null;
}

export const defaultHighestMeasurementsResponse: HighestMeasurementsResponse = {
    ten_places: null,
    ten_sublocations: null,
    ten_measurements: null
}



function testScoreboardRequestOptions(): RequestInit {
    const requestOptions = {
        method: 'get',
        headers: {
            'Content-Type': 'application/json'
        },
    }
    return requestOptions;
  }
  

const fetchSuccessCallback = async (awaitedResponse: Response): Promise<HighestMeasurementsResponse> => {
    const rawJSONResponse = (await awaitedResponse.json());
    return rawJSONResponse;
    }


function fetchHighestScores(setErrorState: React.Dispatch<React.SetStateAction<string|null>>, setHighestMeasurementsResponse: React.Dispatch<React.SetStateAction<HighestMeasurementsResponse>>) {
    console.warn("TODO: don't load until html details opened?");
    const fetchFailedCallback = async (awaitedResponse: Response): Promise<null> => {
        const rawJSONResponse = (await awaitedResponse.json());
        debugger;
        Sentry.captureMessage(`Highest measurements fetch failed, body: ${JSON.stringify(rawJSONResponse)}`);
        setErrorState(`body of failed fetch: ${unknownErrorTryFormat(rawJSONResponse)}`);
        return null;
        }
    
    fetchJSONWithChecks(API_V2_URL + '/highest_measurement/index', testScoreboardRequestOptions(), 200, true, fetchFailedCallback, fetchSuccessCallback).then((rawResponse) => {
        if (rawResponse === null) {
            return;
        }

        const response = rawResponse as HighestMeasurementsResponse;
        setErrorState(null);
        setHighestMeasurementsResponse(response);
        // console.table(response);
        // if (!response) {
        //     return;
        // }
        // if ((response as { ten_places?: any; }).ten_places) {
        //     console.table((response as { ten_places?: any; }).ten_places);
        // }
        // if ((response as { ten_sublocations?: any; }).ten_sublocations) {
        //     console.table((response as { ten_sublocations?: any; }).ten_sublocations);
        // }
        // if ((response as { ten_measurements?: any; }).ten_measurements) {
        //     console.table((response as { ten_measurements?: any; }).ten_measurements);
        // }
        return response;
    }).catch((error) => {
        console.error(error);
        setErrorState(unknownErrorTryFormat(error))
        debugger;
    });
}

const HighestMeasurements: React.FC<{highestMeasurementsResponse: HighestMeasurementsResponse, errorState: string | null}> = (props) => {
    const [translate] = useTranslation();

    if (props.errorState !== null) {
        return (
            <div>
                {translate('error-loading-app-stats')} (measurements): {props.errorState}
            </div>
        );
    }

    if (props.highestMeasurementsResponse === defaultHighestMeasurementsResponse) {
        return (
            <div>
                Loading...
            </div>
        );
    }

    return (
        <div>
            <HighestMeasurementsTable highestMeasurementsResponse={props.highestMeasurementsResponse} errorState={props.errorState}/>
        </div>
    )

}

const HighestMeasurementPreview: React.FC<{highestMeasurementsResponse: HighestMeasurementsResponse}> = (props) => {

    if (props.highestMeasurementsResponse.ten_measurements === null) {
        return null;
    }

    if (props.highestMeasurementsResponse.ten_measurements[0] === undefined) {
        debugger;
        return <>some bug?</>;
    }
    return (
        <>- ({props.highestMeasurementsResponse.ten_measurements[0].co2ppm}&#8346;&#8346;&#8344;!)</>
    )

}

export const HighestMeasurementsContainer = () => {
    const [translate] = useTranslation();
    const [errorState, setErrorState] = useState(null as string | null);
    const [highestMeasurementsResponse, setHighestMeasurementsResponse] = useState(defaultHighestMeasurementsResponse);

    useEffect(() => {
        fetchHighestScores(setErrorState, setHighestMeasurementsResponse);
      }, []);
    
    return (
        <div>
            <Suspense fallback="Loading translations...">
            <details>
                <summary>
                    {translate('largest-measurements')} <HighestMeasurementPreview highestMeasurementsResponse={highestMeasurementsResponse}/>
                </summary>
                    <HighestMeasurements highestMeasurementsResponse={highestMeasurementsResponse} errorState={errorState}/>
                </details>
            </Suspense>

        </div>
    );
}

// export const HighestMeasurementsContainer = () => {
//     const [translate] = useTranslation();

//     return (
//         <Suspense fallback="Loading translations...">
//             <details>
//                 <summary>
//                     {translate('largest-measurements')} - (${})
//                 </summary>
//                 <HighestMeasurementsContainerDetails/>
//             </details>
//         </Suspense>
//     )
// }