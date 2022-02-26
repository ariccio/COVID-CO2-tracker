import { useEffect, useState } from 'react';
import { Text, Linking } from 'react-native';

export const useOpenableLink = (url: string, setNativeErrors: React.Dispatch<React.SetStateAction<string | null>>): {openable: (boolean | null)} => {
    const [openable, setOpenable] = useState(null as (boolean | null));

    useEffect(() => {
        Linking.canOpenURL(url).then((canOpen) => {
            setOpenable(canOpen);
        }).catch((errors) => {
            setNativeErrors(`canOpenUrl error: ${String(errors)}`);
        })
    }, [])

    return {openable};
}

export const IfNotOpenable = (props: {openable: (boolean | null) }) => {
    if (props.openable === null) {
        return (
            <>
                <Text>Checking whether you can open the web console...</Text>
            </>
        )
    }
    if (!props.openable) {
        return (
            <>
                <Text>Warning: may not be able to open link. Will report automatically in the future.</Text>
            </>
        )
    }
    return null;
}
