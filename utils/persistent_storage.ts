import * as fs from 'fs';



export function readAlreadySavedData(savefile: string) {
    if (savefile.length === 0) {
        console.warn("Empty file name");
        return null;
    }
    console.log(`Opening: ${savefile}`);
    const fileContentsAsBuffer = fs.readFileSync(savefile);
    if (fileContentsAsBuffer.length === 0) {
        console.warn(`nothing saved in ${savefile}`);
        return null;
    }
    console.log(`savefile read! Some of the contents:`)
    console.log(fileContentsAsBuffer.subarray(0, 1000).toString());
    console.log(`Length of savefile contents: ${fileContentsAsBuffer.byteLength}`);

}