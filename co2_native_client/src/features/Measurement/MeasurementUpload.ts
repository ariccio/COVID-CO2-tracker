import * as Sentry from 'sentry-expo';

import { postRequestOptions } from "../../../../co2_client/src/utils/DefaultRequestOptions";
import { formatErrors, withErrors } from "../../../../co2_client/src/utils/ErrorObject";
import { UserSettings } from "../../../../co2_client/src/utils/UserSettings";
import { AppDispatch } from '../../app/store';
import { withAuthorizationHeader } from "../../utils/NativeDefaultRequestHelpers";
import { fetchJSONWithChecks } from "../../utils/NativeFetchHelpers";
import { REAL_TIME_UPLOAD_URL_NATIVE } from "../../utils/UrlPaths";
import { MeasurementDataForUpload } from "./MeasurementTypes";
import {setUploadStatus} from "../Uploading/uploadSlice";
import {incrementFailedUploads, incrementSuccessfulUploads} from "../../app/globalSlice";
import { unknownNativeErrorTryFormat } from '../../utils/FormatUnknownNativeError';

export function initRealtimeMeasurement(jwt: string, measurement: MeasurementDataForUpload, userSettings: UserSettings): RequestInit {
    const defaultOptions = postRequestOptions();
    const options = {
        ...defaultOptions,
        headers: {
            ...withAuthorizationHeader(jwt),
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            measurement: {
                device_id: measurement.device_id,
                co2ppm: measurement.co2ppm,
                google_place_id: userSettings.setting_place_google_place_id,
                sub_location_id: userSettings.realtime_upload_sub_location_id,
                measurementtime: measurement.measurementtime,
                realtime: true
            }
        })
    }
    return options;
}

export async function realtimeUpload(jwt: string, measurement: MeasurementDataForUpload, userSettings: UserSettings): Promise<withErrors> {
    const options = initRealtimeMeasurement(jwt, measurement, userSettings);
  
    const uploadCallback = async (awaitedResponse: Response): Promise<unknown> => {
        const response = awaitedResponse.json();
        return response;
    }
    const result = fetchJSONWithChecks(REAL_TIME_UPLOAD_URL_NATIVE, options, 203, true, uploadCallback, uploadCallback) as Promise<withErrors>;
    return result;
}

export function uploadMeasurementHeadless(measurement: MeasurementDataForUpload | null, userSettings: UserSettings | null | undefined, jwt: string | null, shouldUpload: boolean, dispatch: AppDispatch) {
    // console.log(`Measurement changed! ${JSON.stringify(measurement)}`);
  
    // dispatch(addMeasurement())
    if (!userSettings) {
        // console.log("No user settings, nothing to upload.");
        return;
    }
    if (!(userSettings.setting_place_google_place_id)) {
        console.log("No place to upload to.");
        return;
    }
  
    if (!(userSettings.realtime_upload_sub_location_id)) {
        console.log("No sublocation to upload to.");
        return;
    }
  
    if (jwt === null) {
        console.log("cannot upload, not logged in.");
        return;
    }
    if (measurement === null) {
        // console.log("measurement is null?");
        return;
    }
    if (!shouldUpload) {
        console.log("User has not requested to begin uploading.");
        return;
    }
    // dispatch(setUploadStatus(`Uploading new measurement (${measurement.co2ppm})...`));
    realtimeUpload(jwt, measurement, userSettings).then((response) => {
        if (response.errors) {
            // debugger;
            const str = `Headless upload errors: ${formatErrors(response.errors)}`;
            console.error(str);
            Sentry.Native.captureMessage(str);
            dispatch(setUploadStatus(`Uploading failed: ${formatErrors(response.errors)}`));
            dispatch(incrementFailedUploads());
            // dispatch(setUploadStatus(`Error uploading measurement: ${formatErrors(response.errors)}`));
            // eslint-disable-next-line no-useless-return
            return;
        }
        // eslint-disable-next-line no-useless-return
        console.log('SUCESSFUL MEASUREMENT UPLOAD!');
        dispatch(incrementSuccessfulUploads());
        // eslint-disable-next-line no-useless-return
        return;
    //   dispatch(setUploadStatus(`Successful at ${(new Date(Date.now())).toLocaleTimeString()}`));
    //   dispatch(incrementSuccessfulUploads());
    }).catch((error) => {
        Sentry.Native.captureException(error);
        console.error(`Headless upload error: ${unknownNativeErrorTryFormat(error)}`);
        dispatch(setUploadStatus(`Uploading failed, app error: ${unknownNativeErrorTryFormat(error)}`));
        dispatch(incrementFailedUploads());
    //   dispatch(setUploadStatus(`Error uploading measurement: ${String(error)}`));
        // debugger;
    });
  }
  
