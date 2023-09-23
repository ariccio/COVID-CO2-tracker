import * as fs from 'fs';




export function cleanIdsFromFile(file: string): String[] | null {
    if (file.length === 0) {
        console.warn("Empty file name");
        return null;
    }
    console.log(`Opening: ${file}`);
    const fileContentsAsBuffer = fs.readFileSync(file);
    if (fileContentsAsBuffer.length === 0) {
        console.warn("no IDs");
        return null;
    }
    console.log(fileContentsAsBuffer.subarray(0, 1000).toString());
    console.log(`Length of read file contents: ${fileContentsAsBuffer.byteLength}`);

    let ids = new Array<String>;
    function transform(this: any, key: string, value: any) {
        if (key === "google_place_id") {
            ids.push(value)
        }
        return value;
    }
    
    JSON.parse(fileContentsAsBuffer.toString(), transform );
    console.log(ids)
    return ids;

}


// main();