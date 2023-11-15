import { Link } from 'react-router-dom';

// import { useTranslation } from 'react-i18next';

import { placesPath } from '../../paths/paths';
import { defaultGooglePlacesState } from '../google/googleSlice';
import { useEffect, useState } from 'react';
import { Accordion, Col, Container, Row } from 'react-bootstrap';
import AccordionBody from 'react-bootstrap/esm/AccordionBody';
import { ChoosePlaceAsDefault } from '../nativeClientInterfaces/ChoosePlaceAsDefault';

const RenderPlacesServiceStatus = (props: {placesServiceStatus: google.maps.places.PlacesServiceStatus}) => {
    return (
        <>
            <span>
                Google Places service status: {props.placesServiceStatus}
                <br/>
            </span>
        </>
    );
}


const RenderPlacesServiceStatusWithHighlight = (props: {placesServiceStatus: google.maps.places.PlacesServiceStatus}) => {
    if (props.placesServiceStatus !== google.maps.places.PlacesServiceStatus.OK) {
        return (
            <div>
                <b><i><u>
                    <RenderPlacesServiceStatus placesServiceStatus={props.placesServiceStatus}/>
                </u></i></b>
            </div>
        )
    }
    return (
        <div>
            <RenderPlacesServiceStatus placesServiceStatus={props.placesServiceStatus}/>
        </div>
    );
}

const MaybeRenderPlacesServiceStatusWithHighlight = (props: {placesServiceStatus: google.maps.places.PlacesServiceStatus}) => {
    if (props.placesServiceStatus === google.maps.places.PlacesServiceStatus.OK) {
        return null;
    }
    return (
        <>
            <b><i><u>
                <RenderPlacesServiceStatus placesServiceStatus={props.placesServiceStatus}/>
            </u></i></b>
        </>
    );
}

const RenderName = (props: {name?: string}) => {
    if (props.name === undefined) {
        return (
            <div>
                Missing place name!
                <br/>
            </div>
        );
    }
    //this is duplicate
    // return (
    //     <>
    //         currentPlace.name: <i>{name}</i>
    //         <br/>
    //     </>
    // );
    return null;
}

const RenderNameAccordionHeader = (props: {placeName?: string, types?: string[]}) => {
    if (props.placeName === undefined) {
        return (
            <>
                Missing place name!
            </>
        );
    }
    if (props.types === undefined) {
        return (
            <>
                Missing place types!
            </>
        );
    }
    // const style = {justifyContent: 'center', display: }
    return (
        <i>{props.placeName}<RenderFirstType types={props.types}/></i>
    );
    return null;
}


const RenderFormattedAddress = (props: {formatted_address?: string}) => {
    if (props.formatted_address === undefined) {
        return (
            <div>
                Formatted address missing!
                <br/>
            </div>
        );
    }
    return (
        <div>
            address: <i>{props.formatted_address}</i>
            <br/>
        </div>
    );
}

function typesToShortStr(types?: string[]): string {
    if (types === undefined) {
        return "No types! Types undefined.";
    }
    if (types.length === 0) {
        return "No types! Types empty.";
    }
    return types[0];
}

function typesToLongStr(types?: string[]): string {
    if (types === undefined) {
        return "No types! Types undefined.";
    }
    if (types.length === 0) {
        return "No types! Types empty.";
    }
    return types.join(', ');
}

const MaybeRenderFirstType = (props: {types?: string[]}) => {
    const [shortStr, setShortStr] = useState(typesToShortStr(props.types));
    useEffect(() => {
        setShortStr(typesToShortStr(props.types));
    }, [props.types])
    return <>
        type: {shortStr}
    </>;
}


const RenderFirstType = (props: {types: string[]}) => {
    const [shortStr, setShortStr] = useState(typesToShortStr(props.types));
    useEffect(() => {
        setShortStr(typesToShortStr(props.types));
    }, [props.types])
    if (props.types.length === 0) {
        return null;
    }
    if (props.types[0] === "premise") {
        return null;
    }
    return <>
        , type: {shortStr}
    </>;
}


const RenderTypes = (props: {types?: string[]}) => {
    const [longStr, setLongStr] = useState(typesToLongStr(props.types));

    useEffect(() => {
        setLongStr(typesToLongStr(props.types));
    }, [props.types])


    if (props.types === undefined) {
        return (
            <div>
                Missing types!
                <br/>
            </div>
        );
    }
    return (
        <div>
            types: <i>{props.types.join(', ')}</i>
            <br/>
        </div>
    );
}

const RenderLinkToGoogleMapsWithName = (props: {url?: string, name?: string}) => {
    if (props.url === undefined) {
        return (
            <div>
                Missing url!
                <br/>
            </div>
        );
    }
    if (props.name === undefined) {
        return (
            <div>
                Missing name!
                <br/>
            </div>
        );
    }
    return (
        <>
            <a href={props.url}>
                <b>{props.name} in Google Maps</b>
            </a>
            <br/>
        </>
    );
}


const RenderLinkToPlacesWithName = (props: {place_id?: string, name?: string}) => {
    if (props.place_id === undefined) {
        return (
            <div>
                Missing place_id!
                <br/>
            </div>
        );
    }
    if (props.name === undefined) {
        return (
            <div>
                Missing name!
                <br/>
            </div>
        );
    }
    return (
        <div>
            {/* <a href={url}>
                <b>{name}</b>
            </a> */}
            <Link to={`${placesPath}/${props.place_id}`}>
                <b>See detailed info for {props.name}</b>
            </Link>
            <br/>
        </div>
    );
}


const RenderVicinity = (props: {vicinity?: string}) => {
    if (props.vicinity === undefined) {
        return (
            <div>
                Missing vicinity!
                <br/>
            </div>
        );
    }
    return (
        <div>
            currentPlace.vicinity <i>{props.vicinity}</i>
            <br/>
        </div>
    );
}


export const RenderSelectedPlaceInfo = (props: {currentPlace: google.maps.places.PlaceResult, placesServiceStatus: google.maps.places.PlacesServiceStatus | null}) => {
    if (props.currentPlace === defaultGooglePlacesState.selected) {
        return null;
    }
    if (props.placesServiceStatus === null) {
        return (
            <div>
                Places service still loading response, null status...
            </div>
        )
    }
    return (
        <div>
            <Accordion >
                <Accordion.Item eventKey="0">
                    <Accordion.Header>
                        <RenderNameAccordionHeader placeName={props.currentPlace.name} types={props.currentPlace.types}/>
                    </Accordion.Header>
                    <AccordionBody>
                        <RenderLinkToPlacesWithName place_id={props.currentPlace.place_id} name={props.currentPlace.name}/>
                        <RenderFormattedAddress formatted_address={props.currentPlace.formatted_address}/>
                        <MaybeRenderPlacesServiceStatusWithHighlight placesServiceStatus={props.placesServiceStatus}/>
                        <ChoosePlaceAsDefault place_id={props.currentPlace.place_id}/>
                        <Accordion>
                            <Accordion.Item eventKey="0">
                                <Accordion.Header>
                                    Google places details:
                                </Accordion.Header>
                                <AccordionBody>
                                    <RenderTypes types={props.currentPlace.types} />
                                    <RenderVicinity vicinity={props.currentPlace.vicinity}/>
                                    <RenderLinkToGoogleMapsWithName url={props.currentPlace.url} name={props.currentPlace.name}/>
                                    <RenderPlacesServiceStatusWithHighlight placesServiceStatus={props.placesServiceStatus}/>
                                </AccordionBody>
                            </Accordion.Item>
                        </Accordion>
                    </AccordionBody>
                </Accordion.Item>
            </Accordion>
            {/* {props.currentPlace.icon ? <img src={props.currentPlace.icon} alt={`google supplied icon for ${props.currentPlace.name}`}/> : null} */}
            <br/>
        </div>
    )
}
