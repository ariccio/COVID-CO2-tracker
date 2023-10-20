import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../../app/store';


export interface openAIState {
    openAI_platform_key: string | null
    openAI_key_errors: string | null
}

export const defaultOpenAIState: openAIState = {
    openAI_platform_key: null,
    openAI_key_errors: null
};

export interface ChatGPTMessage {
    sender: 'user' | 'chatgpt' | 'invalid';
    content: string;
}

export const defaultChatGPTMessageState: ChatGPTMessage[] = [{
    sender: 'invalid',
    content: ''
}]


export interface OpenAISlice {
    openAI: openAIState,
    messages: ChatGPTMessage[] | null,
    errorString: string | null,
    submittingInProgress: boolean
}

const initialState: OpenAISlice = {
    openAI: defaultOpenAIState,
    messages: defaultChatGPTMessageState,
    errorString: null,
    submittingInProgress: false
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
        }
    }
})

export const {setOpenAIPlatformKey, setChatGPTMessages, setOpenAIChatGPTErrorString, setSubmittingInProgress, setOpenAIKeyErrors} = openAISlice.actions;

export const selectOpenAIPlatformKey = (state: RootState) => state.openAI.openAI.openAI_platform_key;
export const selectOpenAIChatGPTMessages = (state: RootState) => state.openAI.messages;
export const selectOpenAIChatGPTErrors = (state: RootState) => state.openAI.errorString;
export const selectSubmittingInProgress = (state: RootState) => state.openAI.submittingInProgress;
export const selectOpenAIKeyErrors = (state: RootState) => state.openAI.openAI.openAI_key_errors
export const openAIReducer = openAISlice.reducer;
