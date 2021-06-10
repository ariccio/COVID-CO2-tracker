import React, {FunctionComponent, useEffect, useState, useRef, Suspense} from 'react';
import { useTranslation } from 'react-i18next';


import { formatErrors } from '../../utils/ErrorObject';
import { AppStatsResponse, defaultAppStatsResponse, queryAppStats } from '../../utils/QueryAppStats';


const AppStats = (props: {appStatsResponse: AppStatsResponse, errorState: string}) => {
    const [translate] = useTranslation();

    if (props.errorState !== '') {
        return (
            <>
                {translate('error-loading-app-stats')}: {props.errorState}
            </>
        )
    }

    if (props.appStatsResponse === defaultAppStatsResponse) {
        return (
            <>
                Loading...
            </>
        )
    }

    return (
        <>
            {props.appStatsResponse}
        </>
    )

}

const AppStatsContainer: FunctionComponent<{}> = (props: any) => {
    const [appStatsResponse, setAppStatsResponse] = useState(defaultAppStatsResponse);
    const [errorState, setErrorState] = useState('');

    useEffect(() => {
        const result = queryAppStats();
        result.then((resultValue) => {
            if (resultValue.errors !== undefined) {
                setErrorState(formatErrors(resultValue.errors));
                setAppStatsResponse(defaultAppStatsResponse);
                return;
            }
            setAppStatsResponse(resultValue);
        }).catch((error) => {
            console.warn("some kind of unexpected error fetching app stats");
            setErrorState(String(error));
            setAppStatsResponse(defaultAppStatsResponse);
            return;
        })
    })

    return (
        <>
            <Suspense fallback="Loading translations...">

            </Suspense>

        </>
    );
}

