import {useEffect, useState, Suspense} from 'react';
import { useTranslation } from 'react-i18next';


import { formatErrors } from '../../utils/ErrorObject';
import { AppStatsResponse, defaultAppStatsResponse, queryAppStats } from '../../utils/QueryAppStats';


const AppStats: React.FC<{appStatsResponse: AppStatsResponse, errorState: string}> = (props) => {
    const [translate] = useTranslation();

    if (props.errorState !== '') {
        return (
            <div>
                {translate('error-loading-app-stats')}: {props.errorState}
            </div>
        )
    }

    if (props.appStatsResponse === defaultAppStatsResponse) {
        return (
            <div>
                Loading...
            </div>
        )
    }

    return (
        <div>
            <details>
                <summary>
                    {translate('total-measurements')}: {props.appStatsResponse.measurements}        
                </summary>
                {translate('total-users')}: {props.appStatsResponse.users}
                <br/>
                {translate('total-devices')}: {props.appStatsResponse.devices}
                <br/>
                {translate('total-manufacturers')}: {props.appStatsResponse.manufacturers}
                <br/>
                {translate('total-models')}: {props.appStatsResponse.models}
                <br/>
                {translate('total-places')}: {props.appStatsResponse.places}
                <br/>
                {translate('total-sublocations')}: {props.appStatsResponse.sublocations}

            </details>
        </div>
    )

}

export const AppStatsContainer = () => {
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
            setErrorState(JSON.stringify(error));
            setAppStatsResponse(defaultAppStatsResponse);
            return;
        })
    }, [])

    return (
        <div>
            <Suspense fallback="Loading translations...">
                <AppStats appStatsResponse={appStatsResponse} errorState={errorState}/>
            </Suspense>

        </div>
    );
}

