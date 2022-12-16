import { FormEvent, RefObject, useRef, useState, Dispatch, SetStateAction } from 'react';
import { Col, Row } from 'react-bootstrap';
import Card from 'react-bootstrap/Card';
import { percentRebreathedFromPPM, rebreathedToString } from '../../utils/Rebreathed';
// import Nav from 'react-bootstrap/Nav';

const CAC = () =>
    <Card>
        <Card.Title>
            <a href="https://cleanaircrew.org/">#CleanAirCrew</a>
        </Card.Title>
        <Card.Text>
            <i>A collection of tips & tools for an airborne pandemic.</i>
        </Card.Text>
    </Card>

const CO2Map = () =>
    <Card>
        <Card.Title>
            <a href="https://umap.openstreetmap.fr/en/map/co2-monitoring-for-covid-19-prevention_666337#">CO2_map</a>
        </Card.Title>
        <Card.Text>
            <i>See where and how CO₂ monitoring is being deployed, to help limit airborne transmission of COVID19 via better ventilation. A project with Aireamos and other #COVIDCO2 groups.</i>
        </Card.Text>
    </Card>

const AIREAMOS = () =>
    <Card>
        <Card.Title>
            <a href="https://www.aireamos.org/">AIREAMOS</a>
        </Card.Title>
        <Card.Text>
            <i>(via google translate) We are a group of researchers and non-profit social agents that promote ventilation and CO2 measurement to reduce the spread of COVID-19.</i>
        </Card.Text>
    </Card>


const CovidStraightTalk = () =>
    <Card>
        <Card.Title>
            <a href="https://covidstraighttalk.org/">COVID Straight Talk</a>
        </Card.Title>
        <Card.Text>
            <i>COVID Straight Talk is a public health campaign raising awareness that COVID-19 is airborne and encouraging people to adopt harm reduction measures to keep themselves and their communities safe.</i>
        </Card.Text>
    </Card>


// interface MoreInfoProps {}

function handleCO2CalcSubmit(event: FormEvent<HTMLElement>, fieldNumberCo2Value: RefObject<HTMLInputElement>, setEnteredCO2: Dispatch<SetStateAction<number | null>>, setErrorMessage: Dispatch<SetStateAction<string | null>>) {
    event.preventDefault();
    // console.log(event);
    // console.log(fieldNumberCo2Value.current?.value);
    if (fieldNumberCo2Value.current === null) {
        setErrorMessage('Unexpected null ref current value for fieldNumberCo2Value');
        return;
    }
    setEnteredCO2(parseInt(fieldNumberCo2Value.current.value, 10));
}

const EnteredToRebreathedPercent = (props: {currentCo2Entered: (null | number)}) => {
    if(props.currentCo2Entered === null) {
        return null;
    }
    const percent = percentRebreathedFromPPM(props.currentCo2Entered);
    const displayRebreathed = rebreathedToString(percent);
    return (
        <>
            {displayRebreathed} other people's air.
        </>
    )
}

const CalculateRebreathedCO2 = () => {
    const fieldNumberCo2Value = useRef<HTMLInputElement>(null);
    const [enteredCO2, setEnteredCO2] = useState(null as (number | null));
    const [errorMessage, setErrorMessage] = useState(null as (string | null));
    return (
        <>
            <form onSubmit={(event) => {handleCO2CalcSubmit(event, fieldNumberCo2Value, setEnteredCO2, setErrorMessage)}} id={'co2-calc'}>
                <label>Calculate rebreated fraction from a CO2 PPM:
                    <input type={'number'} form='co2-calc' inputMode='decimal' min={420} id='co2-calc-field' ref={fieldNumberCo2Value}/>
                </label>
                <input type="submit" value={"submit"}/>

            </form>
            <EnteredToRebreathedPercent currentCo2Entered={enteredCO2}/>
            {errorMessage}
        </>
    )
}

export const MoreInfo = () => {
    return (
        <>
            <h4>
                All kinds of other info!
            </h4>
            <p>
                I work with a worldwide group of scientists, experts, engineers, and activists to make the world a safer place from COVID. We&apos;re loosely organized, and go by many different names!
            </p>
            <Row md={2}>
                <Col>
                    <CAC/>
                </Col>
                <Col>
                    <CO2Map/>
                </Col>
                <Col>
                    <AIREAMOS/>
                </Col>
                <Col>
                    <CovidStraightTalk/>
                </Col>
            </Row>
            <h4>
                Tools
            </h4>
            <Row md={2}>
                <Col>
                    <CalculateRebreathedCO2/>
                </Col>
            </Row>
        </>
    )
}