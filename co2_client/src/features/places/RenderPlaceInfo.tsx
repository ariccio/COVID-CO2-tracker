import React from 'react';
import { Link } from 'react-router-dom';

// import { useTranslation } from 'react-i18next';

import { placesPath } from '../../paths/paths';
import { defaultGooglePlacesState } from '../google/googleSlice';

const renderPlacesServiceStatus = (placesServiceStatus: google.maps.places.PlacesServiceStatus) => {
    return (
        <div>
            <span>
                Google Places service status: {placesServiceStatus}
                <br/>
            </span>
        </div>
    );
}


const renderPlacesServiceStatusWithHighlight = (placesServiceStatus: google.maps.places.PlacesServiceStatus) => {
    if (placesServiceStatus !== google.maps.places.PlacesServiceStatus.OK) {
        return (
            <div>
                <b><i><u>
                    {renderPlacesServiceStatus(placesServiceStatus)}
                </u></i></b>
            </div>
        )
    }
    return (
        <div>
            {renderPlacesServiceStatus(placesServiceStatus)}
        </div>
    )
}

const renderName = (name?: string) => {
    if (name === undefined) {
        return (
            <div>
                Missing place name!
                <br/>
            </div>
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
            <div>
                Formatted address missing!
                <br/>
            </div>
        );
    }
    return (
        <div>
            address: <i>{formatted_address}</i>
            <br/>
        </div>
    );
}

const renderTypes = (types?: Array<string>) => {
    if (types === undefined) {
        return (
            <div>
                Missing types!
                <br/>
            </div>
        );
    }
    return (
        <div>
            types: <i>{types.join(', ')}</i>
            <br/>
        </div>
    );
}

const renderLinkWithName = (url?: string, name?: string) => {
    if (url === undefined) {
        return (
            <div>
                Missing url!
                <br/>
            </div>
        );
    }
    if (name === undefined) {
        return (
            <div>
                Missing name!
                <br/>
            </div>
        );
    }
    return (
        <div>
            <a href={url}>
                <b>{name} in Google Maps</b>
            </a>
            <br/>
        </div>
    );
}


const renderLinkToPlacesWithName = (place_id?: string, name?: string) => {
    if (place_id === undefined) {
        return (
            <div>
                Missing place_id!
                <br/>
            </div>
        );
    }
    if (name === undefined) {
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
            <Link to={`${placesPath}/${place_id}`}>
                <b>See detailed info for {name}</b>
            </Link>
            <br/>
        </div>
    );
}


const renderVicinity = (vicinity?: string) => {
    if (vicinity === undefined) {
        return (
            <div>
                Missing vicinity!
                <br/>
            </div>
        );
    }
    return (
        <div>
            currentPlace.vicinity <i>{vicinity}</i>
            <br/>
        </div>
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
            <div>
                Places service still loading response, null status...
            </div>
        )
    }
    // if (props.placesServiceStatus !== google.maps.places.PlacesServiceStatus.OK) {
    //     return (
    //         <>

    //         </>
    //     )
    // }
    return (
        <div>
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
        </div>
    )
}
