import { Link } from 'react-router-dom';

// import { useTranslation } from 'react-i18next';

import { placesPath } from '../../paths/paths';
import { defaultGooglePlacesState } from '../google/googleSlice';

const RenderPlacesServiceStatus = (props: {placesServiceStatus: google.maps.places.PlacesServiceStatus}) => {
    return (
        <div>
            <span>
                Google Places service status: {props.placesServiceStatus}
                <br/>
            </span>
        </div>
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
    )
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

const RenderTypes = (props: {types?: string[]}) => {
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

const RenderLinkWithName = (props: {url?: string, name?: string}) => {
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
        <div>
            <a href={props.url}>
                <b>{props.name} in Google Maps</b>
            </a>
            <br/>
        </div>
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
            <RenderPlacesServiceStatusWithHighlight placesServiceStatus={props.placesServiceStatus}/>
            <RenderLinkWithName url={props.currentPlace.url} name={props.currentPlace.name}/>
            <RenderLinkToPlacesWithName place_id={props.currentPlace.place_id} name={props.currentPlace.name}/>
            {/* {renderPlaceId(currentPlace.place_id)} */}
            <RenderFormattedAddress formatted_address={props.currentPlace.formatted_address}/>
            {/* {currentPlace.icon ? `currentPlace.icon: ${currentPlace.icon}` : null} 
            {currentPlace.icon ? <img src={currentPlace.icon} alt={`google supplied icon for ${currentPlace.name}`}/> : null}
            <br/> */}
            <RenderTypes types={props.currentPlace.types}/>
            <RenderVicinity vicinity={props.currentPlace.vicinity}/>
            <RenderName name={props.currentPlace.name}/>
            <br/>
        </div>
    )
}
