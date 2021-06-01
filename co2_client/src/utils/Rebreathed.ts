export function percentRebreathedFromPPM(co2ppm: number): number {
    // For math, see:
    //  https://docs.google.com/spreadsheets/d/1AjFzhqM_NILYvZjgE8n0CvGZzYh04JpF_DO0phrOcFw
    //  https://onlinelibrary.wiley.com/doi/abs/10.1034/j.1600-0668.2003.00189.x

    const GLOBAL_OUTDOOR = 420; // "Note ARANET4 meter calibrates to outdoor air assuming 420 ppm"
    const FRACTION_ADDED_TO_BREATH = 0.038; //"Ca = Volume fraction of CO2 added to exhaled breath"
    if (co2ppm < 0) {
        console.warn(`co2ppm (${co2ppm}) < 0, will give incorrect rebreathed percentages`);
    }
    const difference = co2ppm - GLOBAL_OUTDOOR;
    // debugger;
    const rebreathedAirFractionPpm = (difference/FRACTION_ADDED_TO_BREATH);
    const rebreathedAirPercent = rebreathedAirFractionPpm / 10_000;
    return rebreathedAirPercent;
}

export function rebreathedToString(percent: number): string {
    if (percent < 0) {
        return "co2ppm too low.";
    }
    return `${percent.toFixed(3)}%`
}
