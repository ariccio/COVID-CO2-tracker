import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../../app/store';
import { ChatGPTContentFunctionCall } from './ChatGPTEmbed';


export interface openAIState {
    openAI_platform_key: string | null
    openAI_key_errors: string | null
}

export const defaultOpenAIState: openAIState = {
    openAI_platform_key: null,
    openAI_key_errors: null
};

export interface ChatGPTMessage {
    role: 'user' | 'assistant' | 'system' | 'invalid';
    content: string | null;
    finish_reason?: string;
    function_call?: ChatGPTContentFunctionCall;
}

export const defaultChatGPTMessageState: ChatGPTMessage[] = [{
    role: 'invalid',
    content: ''
}]


export interface OpenAISlice {
    openAI: openAIState,
    messages: ChatGPTMessage[] | null,
    errorString: string | null,
    submittingInProgress: boolean,
    chatGPTSystemMessage: string | null
}

const initialState: OpenAISlice = {
    openAI: defaultOpenAIState,
    messages: defaultChatGPTMessageState,
    errorString: null,
    submittingInProgress: false,
    chatGPTSystemMessage: null
};

export const openAISlice = createSlice({
    name: 'openAI',
    initialState,
    reducers: {
        setOpenAIPlatformKey: (state, action: PayloadAction<string | null>) => {
            state.openAI.openAI_platform_key = action.payload;
        },
        setChatGPTMessages: (state, action: PayloadAction<ChatGPTMessage[]>) => {
            state.messages = action.payload;
        },
        setOpenAIChatGPTErrorString: (state, action: PayloadAction<string | null>) => {
            state.errorString = action.payload;
        },
        setSubmittingInProgress: (state, action: PayloadAction<boolean>) => {
            state.submittingInProgress = action.payload;
        },
        setOpenAIKeyErrors: (state, action: PayloadAction<string | null>) => {
            state.openAI.openAI_key_errors = action.payload;
        },
        setChatGPTSystemMessage: (state, action: PayloadAction<string | null>) => {
            state.chatGPTSystemMessage = action.payload;
        }
    }
})

export const {setOpenAIPlatformKey, setChatGPTMessages, setOpenAIChatGPTErrorString, setSubmittingInProgress, setOpenAIKeyErrors, setChatGPTSystemMessage} = openAISlice.actions;

export const selectOpenAIPlatformKey = (state: RootState) => state.openAI.openAI.openAI_platform_key;
export const selectOpenAIChatGPTMessages = (state: RootState) => state.openAI.messages;
export const selectOpenAIChatGPTErrors = (state: RootState) => state.openAI.errorString;
export const selectSubmittingInProgress = (state: RootState) => state.openAI.submittingInProgress;
export const selectOpenAIKeyErrors = (state: RootState) => state.openAI.openAI.openAI_key_errors
export const selectChatGPTSystemMessage = (state: RootState) => state.openAI.chatGPTSystemMessage;
export const openAIReducer = openAISlice.reducer;
