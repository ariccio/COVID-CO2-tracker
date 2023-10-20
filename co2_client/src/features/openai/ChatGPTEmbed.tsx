import * as Sentry from "@sentry/browser"; // for manual error reporting.

import React, { useEffect, useState } from 'react';
import { Button, Form, ListGroup, Spinner } from 'react-bootstrap';
import { AppDispatch } from '../../app/store';
import { ChatGPTMessage, defaultChatGPTMessageState, selectOpenAIChatGPTErrors, selectOpenAIChatGPTMessages, selectOpenAIKeyErrors, selectOpenAIPlatformKey, selectSubmittingInProgress, setChatGPTMessages, setOpenAIChatGPTErrorString, setOpenAIKeyErrors, setOpenAIPlatformKey, setSubmittingInProgress } from './openAiSlice';
import { useDispatch, useSelector } from 'react-redux';
import { MaybeIfValueNot } from '../../utils/RenderValues';
import { proxyChatGPTThroughBackendForWhateverReasonTheyAllWannaDoThis } from './openAiUtil';
import { userRequestOptions } from '../../utils/DefaultRequestOptions';
import { formatErrors } from '../../utils/ErrorObject';
import { fetchJSONWithChecks } from "../../utils/FetchHelpers";
import { API_URL } from "../../utils/UrlPath";


// ChatGPT generated the draft of this, lets see if it's any good :)


const GET_API_KEY_URL = API_URL + '/keys';
const OPENAI_KEY = '/OPENAI_API_KEY';
const OPENAI_KEY_URL = (GET_API_KEY_URL + OPENAI_KEY)

interface ChatGPTCompletionRequest {
    model: string;
    messages: ChatGPTMessage[];
    temperature: number;
}


const sendMessageToBackendOrChatGPT = async (dispatch: AppDispatch, chatGPTMessages: ChatGPTMessage[] | null, inputValue: string, setInputValue: React.Dispatch<React.SetStateAction<string>>, openAIPlatformKey: string) => {
    if (inputValue.trim() === '') {
        return;
    }
    const messageTextToSend = inputValue;
    dispatch(setSubmittingInProgress(true))
    setInputValue('');
    
    if (chatGPTMessages === null) {
        dispatch(setChatGPTMessages([{ sender: 'user', content: messageTextToSend }]));
    }
    else if (chatGPTMessages === defaultChatGPTMessageState) {
        dispatch(setChatGPTMessages([{ sender: 'user', content: messageTextToSend }]));
    }
    else {
        // Add user message to chat
        dispatch(setChatGPTMessages([...chatGPTMessages, { sender: 'user', content: messageTextToSend }]));
    }


    const chatGPTPostRequest: RequestInit = {
        method: "POST",
        headers: {
            "Authorization": "Bearer " + openAIPlatformKey,
            "Content-Type": "application/json",    
        }
    }
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
                <ListGroup.Item key={`chatgpt-message-entry-${index}`} className={message.sender}>
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


