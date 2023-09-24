import { AddressType } from "@googlemaps/google-maps-services-js";

export declare enum MissingTypes {
    grocery_or_supermarket = "grocery_or_supermarket"
}

export declare const AddressTypeWithMissingTypes: typeof AddressType & typeof MissingTypes;
export type AddressTypeWithMissingTypes = AddressType | MissingTypes;
