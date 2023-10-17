import React, { useState } from 'react';
import { Button, Form, ListGroup } from 'react-bootstrap';


// ChatGPT generated the draft of this, lets see if it's any good :)

interface Message {
    sender: 'user' | 'chatgpt';
    content: string;
}

export const ChatComponent: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState<string>('');

    const sendMessage = async () => {
        if (inputValue.trim() === '') return;

        // Add user message to chat
        setMessages([...messages, { sender: 'user', content: inputValue }]);

        // Send message to backend
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: inputValue }),
        });

        const data = await response.json();

        // Add ChatGPT's response to chat
        setMessages([...messages, { sender: 'user', content: inputValue }, { sender: 'chatgpt', content: data.response }]);
        setInputValue('');
    };

    return (
        <div>
            <ListGroup>
                {messages.map((message, index) => (
                    <ListGroup.Item key={index} className={message.sender}>
                        {message.content}
                    </ListGroup.Item>
                ))}
            </ListGroup>
            <Form>
                <Form.Group>
                    <Form.Control
                        as="textarea"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Type your message..."
                    />
                </Form.Group>
                <Button onClick={sendMessage}>Send</Button>
            </Form>
        </div>
    );
};