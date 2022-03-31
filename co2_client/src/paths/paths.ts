// React route paths. NOT rails paths.
//Should these be in the files where the compoents are defined, or here all together?

export const manufacturersPath: string = '/manufacturers';
export const homePath: string = '/home';
export const devicesPath: string = '/devices';
export const devicesPathWithParam: string = `${devicesPath}/:deviceId`;
export const profilePath: string = '/profile';
export const deviceModelsPath: string = '/devicemodels';
export const deviceModelsPathWithParam: string = `${deviceModelsPath}/:deviceModelId`;
// export const loginPath: string = '/login';
export const placesPath: string = '/places';
export const placesPathWithParam: string = `${placesPath}/:placeId`;
export const moreInfoPath: string = '/moreInfo';
export const bluetoothPath: string ='/mystery';
//Found a bug while doing this. Yay!
// export const signupPath: string = '/signup';
