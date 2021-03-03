import React from 'react';
import {useSelector, useDispatch} from 'react-redux';
import {Table, Button} from 'react-bootstrap';
// import {UserInfoDevice} from '../../utils/QueryDeviceInfo';
import {Link} from 'react-router-dom';

import {ManufacturerModelInfo} from '../manufacturers/manufacturerSlice';
import {deviceModelsPath} from '../../paths/paths';
import {setSelectedModel, selectSelectedModel, selectSelectedModelName, setSelectedModelName} from '../deviceModels/deviceModelsSlice';

const ModelsTableHeader = () =>
    <thead>
        <tr>
            <th>#</th>
            <th>Model ID</th>
            <th>Device model name</th>
            <th>Instances</th>
            <th>pick it!</th>
        </tr>
    </thead>

function modelRowKey(model: number): string {
    return `manufacturer-model-entry-key-${model}`;
}

const pickModel = (model_id: number, name: string, dispatch: ReturnType<typeof useDispatch>) => {
    dispatch(setSelectedModel(model_id));
    dispatch(setSelectedModelName(name));
}


const mapModelsToTableBody = (models: Array<ManufacturerModelInfo>, dispatch: ReturnType<typeof useDispatch>)/* JSX.Element */ => {
    // debugger;
    return models.map((model: ManufacturerModelInfo, index: number) => {
        return (
            <tr key={modelRowKey(model.model_id)}>
                <td><Link to={`${deviceModelsPath}/${model.model_id}`}>{index}</Link></td>
                <td><Link to={`${deviceModelsPath}/${model.model_id}`}>{model.model_id}</Link></td>
                <td><Link to={`${deviceModelsPath}/${model.model_id}`}>{model.name}</Link></td>
                <td><Link to={`${deviceModelsPath}/${model.model_id}`}>{model.count}</Link></td>
                <td><Button variant="primary" onClick={(event) => {pickModel(model.model_id, model.name, dispatch)}}>Pick</Button></td>
            </tr>
        )
    })
}

const deviceModelsBody = (models: Array<ManufacturerModelInfo>, dispatch: ReturnType<typeof useDispatch>): JSX.Element =>
    <tbody>
        {mapModelsToTableBody(models, dispatch)}
    </tbody>

const renderTable = (models: Array<ManufacturerModelInfo>, dispatch: ReturnType<typeof useDispatch>) =>
    <Table striped bordered hover>
        {ModelsTableHeader()}
        {deviceModelsBody(models, dispatch)}
    </Table>

export const ManufacturerDeviceModelsTable = (props: {models: Array<ManufacturerModelInfo>, selectedManufacturer: number | null}) => {
    const selectedModel = useSelector(selectSelectedModel);
    const selectedModelName = useSelector(selectSelectedModelName);
    const dispatch = useDispatch();

    if (props.models.length === 0) {
        if (props.selectedManufacturer === null) {
            return null;
        }
        return (
            <h3>
                No models in database
            </h3>
        )
    }
    if (selectedModel === -1) {
        return (
            <>  
                {renderTable(props.models, dispatch)}
            </>
        );
    }
    return (
        <>
            <div>
                Selected a model! ({selectedModelName})
                <Button variant="secondary" onClick={() => {dispatch(setSelectedModel(-1)); dispatch(setSelectedModelName(''))}}>
                    Unselect {selectedModelName}
                </Button>
            </div>

        </>
    );
}

