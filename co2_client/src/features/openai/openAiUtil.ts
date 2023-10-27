// import * as Sentry from "@sentry/browser"; // for manual error reporting.

// import { BACKEND_CHATGPT_SEND_CHAT_ACTION_URL } from "../../utils/UrlPath";
// import { patchRequestOptions } from "../../utils/DefaultRequestOptions";
// import { formatErrors, withErrors } from "../../utils/ErrorObject";
// import { AppDispatch } from "../../app/store";
// import { fetchJSONWithChecks } from "../../utils/FetchHelpers";
// import { setOpenAIChatGPTErrorString } from "./openAiSlice";




// interface chatGPTBackendProxyResponse {

// }

// export type chatGPTBackendProxyResponseType = (chatGPTBackendProxyResponse & withErrors);

export function thisChatID(): string {
    if (process.env.NODE_ENV === 'production') {
        console.error("For development purposes, there is no unique ChatGPT ID at the moment?");
        throw new Error(`ChatGPT temporary non-unique ID used in production - cannot continue.`)
    }
    console.warn("For development purposes, there is no unique ChatGPT ID at the moment?");
    return '';
}

// export async function proxyChatGPTThroughBackendForWhateverReasonTheyAllWannaDoThis(message: string, dispatch: AppDispatch) {
//     const fetchFailedCallback = async (awaitedResponse: Response): Promise<chatGPTBackendProxyResponseType> => {
//         console.error("failed to send chat to ChatGPT!");
//         return awaitedResponse.json();
//     }
//     const fetchSuccessCallback = async (awaitedResponse: Response): Promise<chatGPTBackendProxyResponseType> => {
//         console.log("fetch to send chat to chatGPT!");
//         return awaitedResponse.json();
//     }

//     const chatID = thisChatID();
//     const thisChatURL = `${BACKEND_CHATGPT_SEND_CHAT_ACTION_URL}/${chatID}`;
//     const result = fetchJSONWithChecks(thisChatURL, patchRequestOptions(), 200, true, fetchFailedCallback, fetchSuccessCallback) as Promise<chatGPTBackendProxyResponseType>;


    
//     return result.then((response) => {
//         if (response.errors !== undefined) {
//             console.error(`Trouble sending chatGPT message: ${formatErrors(response.errors)}`);
//             dispatch(setOpenAIChatGPTErrorString(formatErrors(response.errors)));
//             alert("Temporary dev hackaround: reload page");
//             debugger;
//             // window.location.reload();
//             return;
//         }

//     });
// }


