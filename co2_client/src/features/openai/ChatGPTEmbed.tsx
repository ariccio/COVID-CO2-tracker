import * as Sentry from "@sentry/browser"; // for manual error reporting.

import React, { useEffect, useState } from 'react';
import { Button, Form, ListGroup, Spinner } from 'react-bootstrap';
import { AppDispatch } from '../../app/store';
import { ChatGPTMessage, defaultChatGPTMessageState, selectOpenAIChatGPTErrors, selectOpenAIChatGPTMessages, selectOpenAIKeyErrors, selectOpenAIPlatformKey, selectSubmittingInProgress, setChatGPTMessages, setOpenAIChatGPTErrorString, setOpenAIKeyErrors, setOpenAIPlatformKey, setSubmittingInProgress } from './openAiSlice';
import { useDispatch, useSelector } from 'react-redux';
import { MaybeIfValueNot } from '../../utils/RenderValues';
// import { proxyChatGPTThroughBackendForWhateverReasonTheyAllWannaDoThis } from './openAiUtil';
import { userRequestOptions } from '../../utils/DefaultRequestOptions';
import { formatErrors } from '../../utils/ErrorObject';
import { fetchJSONWithChecks } from "../../utils/FetchHelpers";
import { API_URL } from "../../utils/UrlPath";


// ChatGPT generated the draft of this, lets see if it's any good :)


const GET_API_KEY_URL = API_URL + '/keys';
const OPENAI_KEY = '/OPENAI_API_KEY';
const OPENAI_KEY_URL = (GET_API_KEY_URL + OPENAI_KEY);
const OPENAI_COMPLETION_URL = "https://api.openai.com/v1/chat/completions";

interface ChatGPTCompletionRequestBody {
    model: string;
    messages: ChatGPTMessage[];
    temperature?: number;
}

export interface ChatGPTContentFunctionCall {
    arguments: string;
    name: string;
}

interface ChatGPTMessageResponse {
    content: string | null;
    role: string;
    function_call: ChatGPTContentFunctionCall;
}

interface ChatGPTChoice {
    finish_reason: string;
    index: number;
    message: ChatGPTMessageResponse;

}

interface ChatGPTUsageObject {
    completion_tokens: number;
    prompt_tokens: number;
    total_tokens: number;
}

// https://platform.openai.com/docs/api-reference/chat/object
interface ChatGPTCompletionResponse {
    id: string;
    choices: ChatGPTChoice[];
    object: string;
    usage: ChatGPTUsageObject;
}

// Why doesn't typescript have macros yet? https://github.com/microsoft/TypeScript/issues/4892
function chatGPTCompletionResponseToStrongType(response: unknown, dispatch: AppDispatch): ChatGPTCompletionResponse | null {
    if (response === null) {
        dispatch(setOpenAIChatGPTErrorString('response from chatGPT is null.'));
        return null;
    }
    if (response === undefined) {
        dispatch(setOpenAIChatGPTErrorString('response from chatGPT is undefined.'));
        return null;
    }
    const someResponse: any = response;
    if (someResponse.id === undefined) {
        dispatch(setOpenAIChatGPTErrorString('response from chatGPT is missing id (undefined).'));
        return null;
    }
    if (someResponse.id === null) {
        dispatch(setOpenAIChatGPTErrorString('response from chatGPT is missing id (null).'));
        return null;
    }
    if (someResponse.choices === undefined) {
        dispatch(setOpenAIChatGPTErrorString('response from chatGPT is missing choices (undefined).'));
        return null;
    }
    if (someResponse.choices === null) {
        dispatch(setOpenAIChatGPTErrorString('response from chatGPT is missing choices (null).'));
        return null;
    }
    const maybeChoices = someResponse.choices;
    if (maybeChoices.length === undefined) {
        dispatch(setOpenAIChatGPTErrorString('response from chatGPT is missing choices.length (undefined).'));
        return null;
    }
    if (maybeChoices.length === null) {
        dispatch(setOpenAIChatGPTErrorString('response from chatGPT is missing choices.length (null).'));
        return null;
    }
    console.log(`choices: ${maybeChoices.length}`);
    if (maybeChoices.length === 0) {
        return null;
    }
    for (let i = 0; i < maybeChoices.length; ++i) {
        if (maybeChoices[i] === null) {
            dispatch(setOpenAIChatGPTErrorString(`response from chatGPT is missing choices[${i}] (null).`));
            return null;
        }
        if (maybeChoices[i] === undefined) {
            dispatch(setOpenAIChatGPTErrorString(`response from chatGPT is missing choices[${i}] (undefined).`));
            return null;
        }
        if (maybeChoices[i].finish_reason === undefined) {
            dispatch(setOpenAIChatGPTErrorString(`response from chatGPT is missing choices[${i}].finish_reason (undefined).`));
            return null;
        }
        if (maybeChoices[i].finish_reason === null) {
            dispatch(setOpenAIChatGPTErrorString(`response from chatGPT is missing choices[${i}].finish_reason (null).`));
            return null;
        }
        console.log(`Choice ${i} finish reason: ${maybeChoices[i].finish_reason}`);
        if (maybeChoices[i].index === undefined) {
            dispatch(setOpenAIChatGPTErrorString(`response from chatGPT is missing choices[${i}].index (undefined).`));
            return null;
        }
        if (maybeChoices[i].index === null) {
            dispatch(setOpenAIChatGPTErrorString(`response from chatGPT is missing choices[${i}].index (null).`));
            return null;
        }
        if (maybeChoices[i].message === undefined) {
            dispatch(setOpenAIChatGPTErrorString(`response from chatGPT is missing choices[${i}].message (undefined).`));
            return null;
        }
        if (maybeChoices[i].message === null) {
            dispatch(setOpenAIChatGPTErrorString(`response from chatGPT is missing choices[${i}].message (null).`));
            return null;
        }
        if (maybeChoices[i].message.content === undefined) {
            dispatch(setOpenAIChatGPTErrorString(`response from chatGPT is missing choices[${i}].message.content (undefined).`));
            return null;
        }
        if (maybeChoices[i].message.content === null) {
            dispatch(setOpenAIChatGPTErrorString(`response from chatGPT is missing choices[${i}].message.content (null).`));
            return null;
        }
        console.log(`Choice ${i} message content: ${maybeChoices[i].message.content}`);
        if (maybeChoices[i].message.role === undefined) {
            dispatch(setOpenAIChatGPTErrorString(`response from chatGPT is missing choices[${i}].message.role (undefined).`));
            return null;
        }
        if (maybeChoices[i].message.role === null) {
            dispatch(setOpenAIChatGPTErrorString(`response from chatGPT is missing choices[${i}].message.role (null).`));
            return null;
        }
        console.log(`Choice ${i} message role: ${maybeChoices[i].message.role}`);
        if (maybeChoices[i].message.function_call === undefined) {
            console.log(`Choice ${i} function call undefined`);
            
        }
        if (maybeChoices[i].message.function_call === null) {
            console.log(`Choice ${i} function call null`);
        }
        
        if (maybeChoices[i].message.function_call.arguments === undefined) {
            console.log(`Choice ${i} function call arguments undefined`);
        }
        if (maybeChoices[i].message.function_call.arguments === null) {
            console.log(`Choice ${i} function call arguments null`);
        }
        console.log(`Choice ${i} function call arguments: ${maybeChoices[i].message.function_call.arguments}`);
        if (maybeChoices[i].message.function_call.name === undefined) {
            console.log(`Choice ${i} function call arguments undefined`);
        }
        if (maybeChoices[i].message.function_call.name === null) {
            console.log(`Choice ${i} function call arguments null`);
        }
        console.log(`Choice ${i} function call arguments: ${maybeChoices[i].message.function_call.name}`);
    }
    if (someResponse.object === undefined) {
        dispatch(setOpenAIChatGPTErrorString('response from chatGPT is missing object (undefined).'));
        return null;
    }
    if (someResponse.object === null) {
        dispatch(setOpenAIChatGPTErrorString('response from chatGPT is missing object (null).'));
        return null;
    }
    if (someResponse.usage === undefined) {
        dispatch(setOpenAIChatGPTErrorString('response from chatGPT is missing usage (undefined).'));
        return null;
    }
    if (someResponse.usage === null) {
        dispatch(setOpenAIChatGPTErrorString('response from chatGPT is missing usage (null).'));
        return null;
    }
    if (someResponse.usage.completion_tokens === undefined) {
        dispatch(setOpenAIChatGPTErrorString('response from chatGPT is missing usage.completion_tokens (undefined).'));
        return null;
    }
    if (someResponse.usage.completion_tokens === null) {
        dispatch(setOpenAIChatGPTErrorString('response from chatGPT is missing usage.completion_tokens (null).'));
        return null;
    }
    if (someResponse.usage.prompt_tokens === undefined) {
        dispatch(setOpenAIChatGPTErrorString('response from chatGPT is missing usage.prompt_tokens (undefined).'));
        return null;
    }
    if (someResponse.usage.prompt_tokens === null) {
        dispatch(setOpenAIChatGPTErrorString('response from chatGPT is missing usage.prompt_tokens (null).'));
        return null;
    }

    if (someResponse.usage.total_tokens === undefined) {
        dispatch(setOpenAIChatGPTErrorString('response from chatGPT is missing usage.total_tokens (undefined).'));
        return null;
    }
    if (someResponse.usage.total_tokens === null) {
        dispatch(setOpenAIChatGPTErrorString('response from chatGPT is missing usage.total_tokens (null).'));
        return null;
    }
    return someResponse;
}

function appendMessageAndReturnMessagesForQuery(chatGPTMessages: ChatGPTMessage[] | null, dispatch: AppDispatch, messageTextToSend: string) {
    if (chatGPTMessages === null) {
        const newChatGPTMessage: ChatGPTMessage = { role: 'user', content: messageTextToSend }
        const newMessages = [newChatGPTMessage];
        dispatch(setChatGPTMessages(newMessages));
        return newMessages;
    }
    else if (chatGPTMessages === defaultChatGPTMessageState) {
        const newChatGPTMessage: ChatGPTMessage = { role: 'user', content: messageTextToSend };
        const newMessages = [newChatGPTMessage];
        dispatch(setChatGPTMessages(newMessages));
        return newMessages;
    }
    // Add user message to chat
    const newChatGPTMessage: ChatGPTMessage = { role: 'user', content: messageTextToSend };
    const newMessages = [...chatGPTMessages, newChatGPTMessage];
    dispatch(setChatGPTMessages(newMessages));
    return newMessages;
}


const sendMessageToBackendOrChatGPT = async (dispatch: AppDispatch, chatGPTMessages: ChatGPTMessage[] | null, inputValue: string, setInputValue: React.Dispatch<React.SetStateAction<string>>, openAIPlatformKey: string) => {
    if (inputValue.trim() === '') {
        return;
    }
    const messageTextToSend = inputValue;
    dispatch(setSubmittingInProgress(true))
    setInputValue('');
    
    const newMessages = appendMessageAndReturnMessagesForQuery(chatGPTMessages, dispatch, messageTextToSend);

    const chatGPTBody: ChatGPTCompletionRequestBody = {
        model: "gpt-3.5-turbo",
        messages: newMessages,
    }

    const chatGPTPostRequest: RequestInit = {
        method: "POST",
        headers: {
            "Authorization": "Bearer " + openAIPlatformKey,
            "Content-Type": "application/json",    
        },
        body: JSON.stringify(chatGPTBody)
    };

    const fetchFailedCallback = async (awaitedResponse: Response): Promise<ChatGPTCompletionResponse | null> => {
        console.error("failed to send chat to ChatGPT!");
        return chatGPTCompletionResponseToStrongType(awaitedResponse.json(), dispatch);
    }
    const fetchSuccessCallback = async (awaitedResponse: Response): Promise<ChatGPTCompletionResponse | null> => {
        console.log("fetch to send chat to chatGPT!");
        return chatGPTCompletionResponseToStrongType(awaitedResponse.json(), dispatch);
    }


    const response = fetchJSONWithChecks(OPENAI_COMPLETION_URL, chatGPTPostRequest, 200, false, fetchFailedCallback, fetchSuccessCallback) as Promise<ChatGPTCompletionResponse | null>;

    response.then((chatGPTResponse) => {
        debugger;
        if (chatGPTResponse === null) {
            const newChatGPTMessage: ChatGPTMessage = { role: 'invalid', content: "ERROR" };
            const messagesWithReply = [...newMessages, newChatGPTMessage];
            
            // is there a risk of a race here?
            dispatch(setChatGPTMessages(messagesWithReply));
            dispatch(setSubmittingInProgress(false));
            return;
        }
        // const newChatGPTMessage: ChatGPTMessage = { sender: 'invalid', content: "ERROR" };
        chatGPTResponse.choices[0].finish_reason 
        const newChatGPTMessage: ChatGPTMessage = {
            role: "chatgpt",
            content: chatGPTResponse.choices[0].message.content,
            finish_reason: chatGPTResponse.choices[0].finish_reason,
            function_call: chatGPTResponse.choices[0].message.function_call
        }
        const messagesWithReply = [...newMessages, newChatGPTMessage];
        
        // is there a risk of a race here?
        dispatch(setChatGPTMessages(messagesWithReply));
        dispatch(setSubmittingInProgress(false));
        return;
    }).catch((error) => {
        dispatch(setOpenAIChatGPTErrorString(`Network error: ${JSON.stringify(error)}`));
        dispatch(setSubmittingInProgress(false));
    })

    
    // // Send message to backend
    // const response = await fetch('/api/chat', {
    //     method: 'POST',
    //     headers: {
    //         'Content-Type': 'application/json',
    //     },
    //     body: JSON.stringify({ message: inputValue }),
    // });

    // const data = await response.json();

    // proxyChatGPTThroughBackendForWhateverReasonTheyAllWannaDoThis()

    // Add ChatGPT's response to chat
    // setMessages([...messages,  { sender: 'chatgpt', content: data.response }]);
    
};

const sendMessage = (dispatch: AppDispatch, chatGPTMessages: ChatGPTMessage[] | null, inputValue: string, setInputValue: React.Dispatch<React.SetStateAction<string>>, openAIPlatformKey: string) => {
    sendMessageToBackendOrChatGPT(dispatch, chatGPTMessages, inputValue, setInputValue, openAIPlatformKey).then()
}



function ChatGPTMessagesListGroup(props: {chatGPTMessages: ChatGPTMessage[] | null}) {
    if (props.chatGPTMessages === null) {
        return null;
    }
    
    return (
    <ListGroup>
        {props.chatGPTMessages.map(
            (message, index) => (
                <ListGroup.Item key={`chatgpt-message-entry-${index}`} className={message.role}>
                    {message.content}
                    
                </ListGroup.Item>
                )
        )}
    </ListGroup>
    );
   
}


function SubmitButtonOrSpinner(props: { chatGPTMessages: ChatGPTMessage[] | null, inputValue: string, setInputValue: React.Dispatch<React.SetStateAction<string>>, openAIPlatformKey: string}) {
    const dispatch = useDispatch();
    const submitting = useSelector(selectSubmittingInProgress)

    if (submitting) {
        return (
            <div>
                <Spinner animation="border" role="status">
                    <span className="visually-hidden">
                        Working...
                    </span>
                </Spinner>
            </div>
        );

    }

    return (
        <Button onClick={() => sendMessage(dispatch, props.chatGPTMessages, props.inputValue, props.setInputValue, props.openAIPlatformKey)}>
            Send
        </Button>
    );
    
}

function fetchOpenAIPlatformKey(dispatch: AppDispatch) {
    const requestOptions = userRequestOptions();
    dispatch(setOpenAIPlatformKey(''));

    const fetchFailedCallback = async (awaitedResponse: Response): Promise<string | null> => {
        console.error("couldn't get google maps key!");
        debugger;
        const jsonResponse = (await awaitedResponse.clone().json());
        console.error(`API key fetch failed. Response: ${JSON.stringify(jsonResponse.clone())}`);
        dispatch(setOpenAIKeyErrors(formatErrors(jsonResponse.errors)));
        return null;
      }

      const fetchSuccessCallback = async (awaitedResponse: Response): Promise<string | null> => {
        const rawJSONResponse = (await awaitedResponse.json());
        if (rawJSONResponse.key === undefined) {
          console.error(`API key fetch succeeded but key field is 'undefined'. Response: ${JSON.stringify(rawJSONResponse.clone())}`);
          Sentry.captureMessage(`API key fetch failed: key undefined`);
          dispatch(setOpenAIKeyErrors(`API key fetch failed: key undefined`));
          return null;
        }
        if (rawJSONResponse.key === null) {
          console.error(`API key fetch succeeded but key field is 'null'. Response: ${JSON.stringify(rawJSONResponse.clone())}`);
          Sentry.captureMessage(`API key fetch failed: key null`);
          dispatch(setOpenAIKeyErrors(`API key fetch failed: key null`));
          return null;
        }
        return rawJSONResponse.key;
      }
    
    const response = fetchJSONWithChecks(OPENAI_KEY_URL, requestOptions, 200, false, fetchFailedCallback, fetchSuccessCallback) as Promise<string>;
    response.then((key) => {
        if (key === null) {
            return;
        }
        dispatch(setOpenAIPlatformKey(key));
    }).catch((error) => {
        console.error(JSON.stringify(error));
        dispatch(setOpenAIKeyErrors(JSON.stringify(error)));
        dispatch(setOpenAIPlatformKey(''));
    })
    
}

export const ChatComponent: React.FC = () => {
    const dispatch = useDispatch();
    const chatGPTMessages = useSelector(selectOpenAIChatGPTMessages);
    const chatGPTErrors = useSelector(selectOpenAIChatGPTErrors);
    const openAIPlatformKey = useSelector(selectOpenAIPlatformKey);
    const openAIPlatformKeyErrors = useSelector(selectOpenAIKeyErrors);
    const [inputValue, setInputValue] = useState<string>('');
    // const [submittingMessage, setSubmittingMessage] = useState<boolean>(false);

    useEffect(() => {
        if (openAIPlatformKey === null) {
            fetchOpenAIPlatformKey(dispatch);
        }
        else if (openAIPlatformKey === '') {
            return;
        }

    }, [openAIPlatformKey, dispatch])

    if (openAIPlatformKey === null) {
        return (
            <>
                OpenAI platform key loading.
            </>
        )
    }
    if (openAIPlatformKey === '') {
        if (openAIPlatformKeyErrors === null) {
            return (
                <>
                    OpenAI platform key loading...
                </>
            );
        }
        return (
            <>
                Error loading OpenAI platform Key: {openAIPlatformKeyErrors}
            </>
        );
    }

    return (
        <div>
            <ChatGPTMessagesListGroup chatGPTMessages={chatGPTMessages}/>
            
            <Form>
                <Form.Group>
                    <Form.Control
                        as="textarea"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Type your message..."
                    />
                </Form.Group>
                <Form.Text>
                    <MaybeIfValueNot text={"Error with chatGPT: "} compareAgainst={''} value={chatGPTErrors}/>
                </Form.Text>
                <SubmitButtonOrSpinner chatGPTMessages={chatGPTMessages} inputValue={inputValue} setInputValue={setInputValue} openAIPlatformKey={openAIPlatformKey}/>
            </Form>
        </div>
    );
};


