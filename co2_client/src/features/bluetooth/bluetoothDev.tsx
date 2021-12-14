/// <reference types="web-bluetooth" />
import { Button } from "react-bootstrap";


export function BluetoothTesting(): JSX.Element {
    const onClickButton = () => {
        console.log(navigator.bluetooth);
        navigator.bluetooth.getAvailability().then((available) => {
            console.log("bluetooth: ", available);
        });
        // navigator.bluetooth.getDevices().then()
        debugger;
    }
    return (
        <div>
            Cool things are in progress...
            <br/>
            <Button onClick={onClickButton}>Do something secret</Button>
        </div>
    )
}