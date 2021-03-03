import React from 'react';
import {useSelector, useDispatch} from 'react-redux';
import {Modal, Button, Form} from 'react-bootstrap';
import {useLocation, useHistory} from 'react-router-dom';
import {selectSelectedModel, selectSelectedModelName, setSelectedModelName, setSelectedModel} from '../deviceModels/deviceModelsSlice';


const ModalHeader = (modelName: string) =>
    <Modal.Header closeButton>
        <Modal.Title>Enter serial number of your {modelName} </Modal.Title>
    </Modal.Header>


export interface CreateMyDeviceInstanceProps {
    show: boolean
}

export const CreateMyDeviceInstance: React.FC<CreateMyDeviceInstanceProps> = (props: CreateMyDeviceInstanceProps) => {
    const selectedModel = useSelector(selectSelectedModel);
    const selectedModelName = useSelector(selectSelectedModelName);
    const dispatch = useDispatch();

    return (
        <>
            <Modal show={props.show} onHide={() => {dispatch(setSelectedModel(-1)); dispatch(setSelectedModelName(''));}}>
                {ModalHeader(selectedModelName)}
                <Modal.Body>
                    <Form>
                        <Form.Label>
                            You're almost there! Enter serial number:
                        </Form.Label>
                        <Form.Control type="text" placeholder="1234567890"/>
                    </Form>
                </Modal.Body>

            </Modal>
        </>
    );
}