import * as fs from 'fs';




export function cleanIdsFromFile(file: string): string[] | null {
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
    console.log(`dump of beginning of file: '${fileContentsAsBuffer.subarray(0, 400).toString()}'`);
    console.log(`Length of read file contents: ${fileContentsAsBuffer.byteLength}`);

    let ids = new Array<string>;
    function transform(this: any, key: string, value: any) {
        if (key === "google_place_id") {
            ids.push(value)
        }
        return value;
    }
    
    const unused = JSON.parse(fileContentsAsBuffer.toString(), transform );
    console.log("first ten IDs extracted:")
    console.log(ids.slice(0, 10))
    return ids;
}


// main();