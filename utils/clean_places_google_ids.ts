import * as fs from 'fs';




function main() {
    console.log(`Opening: ${process.argv[2]}`);
    const fileContentsAsBuffer = fs.readFileSync(process.argv[2]);
    console.log(fileContentsAsBuffer.subarray(0, 1000).toString());
    console.log(`Length of read file contents: ${fileContentsAsBuffer.byteLength}`);

    let ids = new Array<String>;
    function transform(this: any, key: string, value: any) {
        if (key === "google_place_id") {
            ids.push(value)
        }
        return value;
    }
    
    const parsed = JSON.parse(fileContentsAsBuffer.toString(), transform );
    console.log(ids)

}


main();