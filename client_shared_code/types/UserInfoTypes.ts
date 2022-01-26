// interface UserInfoInternal {
//     username: string,
//     devices: Array<UserInfoDevice>,
//     measurements: {
//         data: Array<SerializedSingleMeasurement>
//     }
// }

// export interface UserInfoType {
//     user_info: UserInfoInternal,
//     errors?: Array<ErrorObjectType>
// }

// export const defaultUserInfo: UserInfoType = {
//     user_info: {
//         username: '',
//         devices: [],
//         measurements: {
//             data: []
//         }
//     }
// }

// export interface UserDevicesInfo {
//     devices: Array<UserInfoDevice>
//     errors?: Array<ErrorObjectType>
// }

// export const defaultDevicesInfo: UserDevicesInfo = {
//     devices: []
// }

// export function userInfoToStrongType(userInfo: any): UserInfoType {
//     console.assert(userInfo !== undefined);
//     if (userInfo.errors === undefined) {
//         console.assert(userInfo.user_info !== undefined);
//         console.assert(userInfo.devices !== undefined);
//     }
//     if (userInfo.errors !== undefined) {
//         return userInfo;
//     }
//     // debugger;
//     const return_value: UserInfoType =  {
//         user_info: {
//             username: userInfo.user_info.email,
//             devices: userInfo.devices,
//             measurements: userInfo.measurements
//         },
//         errors: userInfo.errors
//     }
//     return return_value;
// }
