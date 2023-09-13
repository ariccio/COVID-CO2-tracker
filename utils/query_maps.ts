import { cleanFile } from "./clean_places_google_ids";
import {Client} from "@googlemaps/google-maps-services-js";



function main() {
    const ids = cleanFile(process.argv[2]);
    console.log(ids);
}


main()