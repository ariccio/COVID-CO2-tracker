import React from 'react';
import { Link } from 'react-router-dom';

// import { useTranslation } from 'react-i18next';

import { placesPath } from '../../paths/paths';
import { defaultGooglePlacesState } from '../google/googleSlice';

const renderPlacesServiceStatus = (placesServiceStatus: google.maps.places.PlacesServiceStatus) => {
    return (
        <>
            <>
                Google Places service status: {placesServiceStatus}
                <br/>
            </>
        </>
    );
}


const renderPlacesServiceStatusWithHighlight = (placesServiceStatus: google.maps.places.PlacesServiceStatus) => {
    if (placesServiceStatus !== google.maps.places.PlacesServiceStatus.OK) {
        return (
            <>
                <b><i><u>
                    {renderPlacesServiceStatus(placesServiceStatus)}
                </u></i></b>
            </>
        )
    }
    return (
        <>
            {renderPlacesServiceStatus(placesServiceStatus)}
        </>
    )
}

const renderName = (name?: string) => {
    if (name === undefined) {
        return (
            <>
                Missing place name!
                <br/>
            </>
        );
    };
    //this is duplicate
    // return (
    //     <>
    //         currentPlace.name: <i>{name}</i>
    //         <br/>
    //     </>
    // );
    return null;
}

const renderFormattedAddress = (formatted_address?: string) => {
    if (formatted_address === undefined) {
        return (
            <>
                Formatted address missing!
                <br/>
            </>
        );
    }
    return (
        <>
            address: <i>{formatted_address}</i>
            <br/>
        </>
    );
}

const renderTypes = (types?: Array<string>) => {
    if (types === undefined) {
        return (
            <>
                Missing types!
                <br/>
            </>
        );
    }
    return (
        <>
            types: <i>{types.join(', ')}</i>
            <br/>
        </>
    );
}

const renderLinkWithName = (url?: string, name?: string) => {
    if (url === undefined) {
        return (
            <>
                Missing url!
                <br/>
            </>
        );
    }
    if (name === undefined) {
        return (
            <>
                Missing name!
                <br/>
            </>
        );
    }
    return (
        <>
            <a href={url}>
                <b>{name} in Google Maps</b>
            </a>
            <br/>
        </>
    );
}


const renderLinkToPlacesWithName = (place_id?: string, name?: string) => {
    if (place_id === undefined) {
        return (
            <>
                Missing place_id!
                <br/>
            </>
        );
    }
    if (name === undefined) {
        return (
            <>
                Missing name!
                <br/>
            </>
        );
    }
    return (
        <>
            {/* <a href={url}>
                <b>{name}</b>
            </a> */}
            <Link to={`${placesPath}/${place_id}`}>
                <b>See detailed info for {name}</b>
            </Link>
            <br/>
        </>
    );
}


const renderVicinity = (vicinity?: string) => {
    if (vicinity === undefined) {
        return (
            <>
                Missing vicinity!
                <br/>
            </>
        );
    }
    return (
        <>
            currentPlace.vicinity <i>{vicinity}</i>
            <br/>
        </>
    );
}

export const RenderSelectedPlaceInfo = (props: {currentPlace: google.maps.places.PlaceResult, placesServiceStatus: google.maps.places.PlacesServiceStatus | null}) => {
    if (props.currentPlace === defaultGooglePlacesState.selected) {
        return null;
        // return (
        //     <>
        //         No place selected.
        //     </>
        // );
    }
    if (props.placesServiceStatus === null) {
        return (
            <>
                Places service still loading response, null status...
            </>
        )
    }
    // if (props.placesServiceStatus !== google.maps.places.PlacesServiceStatus.OK) {
    //     return (
    //         <>

    //         </>
    //     )
    // }
    return (
        <>
            {renderPlacesServiceStatusWithHighlight(props.placesServiceStatus)}
            {renderLinkWithName(props.currentPlace.url, props.currentPlace.name)}
            {renderLinkToPlacesWithName(props.currentPlace.place_id, props.currentPlace.name)}
            {/* {renderPlaceId(currentPlace.place_id)} */}
            {renderFormattedAddress(props.currentPlace.formatted_address)}
            {/* {currentPlace.icon ? `currentPlace.icon: ${currentPlace.icon}` : null} 
            {currentPlace.icon ? <img src={currentPlace.icon} alt={`google supplied icon for ${currentPlace.name}`}/> : null}
            <br/> */}
            {renderTypes(props.currentPlace.types)}
            {renderVicinity(props.currentPlace.vicinity)}
            {renderName(props.currentPlace.name)}
            <br/>
        </>
    )
}
