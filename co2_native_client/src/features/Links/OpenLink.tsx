import { useEffect, useState } from 'react';
import { Text, Linking, Button } from 'react-native';
import * as Sentry from 'sentry-expo';

import { unknownNativeErrorTryFormat } from '../../utils/FormatUnknownNativeError';
import { MaybeIfValue } from '../../utils/RenderValues';

export const useOpenableLink = (url: string, setNativeErrors: React.Dispatch<React.SetStateAction<string | null>>): {openable: (boolean | null)} => {
    const [openable, setOpenable] = useState(null as (boolean | null));

    useEffect(() => {
        Linking.canOpenURL(url).then((canOpen) => {
            setOpenable(canOpen);
            // eslint-disable-next-line no-useless-return
            return;
        }).catch((errors) => {
            setNativeErrors(`canOpenUrl error: ${unknownNativeErrorTryFormat(errors)}`);
            Sentry.Native.captureException(errors);
        })
    }, [setNativeErrors, url])

    return {openable};
}

export const IfNotOpenable = (props: {openable: (boolean | null), url: string }) => {
    if (props.openable === null) {
        return (
            <>
                <Text>Checking whether you can open the web console...</Text>
            </>
        )
    }
    if (!props.openable) {
        Sentry.Native.captureMessage(`URL: ${props.url} reported as NOT openable`);
        return (
            <>
                <Text>Warning: may not be able to open link. Will report automatically in the future.</Text>
            </>
        )
    }
    return null;
}

export async function openLink(url: string, setNativeErrors: React.Dispatch<React.SetStateAction<string | null>>) {
    try {
        Linking.openURL(url);
    }
    catch (exception) {
        setNativeErrors(`Error opening URL: ${String(exception)}`)
    }
}



export const LinkButton = (props: {url: string, title: string}) => {
    const [nativeErrors, setNativeErrors] = useState(null as (string | null));
    const {openable} = useOpenableLink(props.url, setNativeErrors);

    return (
        <>
            <IfNotOpenable openable={openable} url={props.url}/>
            <MaybeIfValue text="Native errors: " value={nativeErrors}/>
            <Button title={props.title} onPress={() => openLink(props.url, setNativeErrors)}/>
        </>
    )
}
