import React from 'react';
import { Link } from 'react-router-dom';
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

export const renderSelectedPlaceInfo = (currentPlace: google.maps.places.PlaceResult, placesServiceStatus: google.maps.places.PlacesServiceStatus | null) => {
    if (currentPlace === defaultGooglePlacesState.selected) {
        return null;
        // return (
        //     <>
        //         No place selected.
        //     </>
        // );
    }
    if (placesServiceStatus === null) {
        return (
            <>
                Places service still loading response, null status...
            </>
        )
    }
    return (
        <>
            {renderPlacesServiceStatusWithHighlight(placesServiceStatus)}
            {renderLinkWithName(currentPlace.url, currentPlace.name)}
            {renderLinkToPlacesWithName(currentPlace.place_id, currentPlace.name)}
            {/* {renderPlaceId(currentPlace.place_id)} */}
            {renderFormattedAddress(currentPlace.formatted_address)}
            {/* {currentPlace.icon ? `currentPlace.icon: ${currentPlace.icon}` : null} 
            {currentPlace.icon ? <img src={currentPlace.icon} alt={`google supplied icon for ${currentPlace.name}`}/> : null}
            <br/> */}
            {renderTypes(currentPlace.types)}
            {renderVicinity(currentPlace.vicinity)}
            {renderName(currentPlace.name)}
            <br/>
        </>
    )
}
