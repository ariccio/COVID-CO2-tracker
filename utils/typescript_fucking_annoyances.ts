import { AddressType } from "@googlemaps/google-maps-services-js";

export declare enum MissingTypes {
    grocery_or_supermarket = "grocery_or_supermarket",
}
// export declare const AddressType: typeof PlaceType1 & typeof PlaceType2;
// export type AddressType = PlaceType1 | PlaceType2;

export declare const AddressTypeWithMissingTypes: typeof AddressType & typeof MissingTypes;
export type AddressTypeWithMissingTypes = AddressType | MissingTypes;
