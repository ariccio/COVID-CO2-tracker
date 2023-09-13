import * as fs from 'fs';




export function cleanFile(file: string): any {
    console.log(`Opening: ${file}`);
    const fileContentsAsBuffer = fs.readFileSync(file);
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