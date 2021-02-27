import React from 'react';
import {Table} from 'react-bootstrap';
// import {UserInfoDevice} from '../../utils/QueryDeviceInfo';
import {Link} from 'react-router-dom';


import {SingleManufacturerInfo, ManufacturerModelInfo} from '../manufacturers/manufacturerSlice';
import {deviceModelsPath} from '../../paths/paths';


const ModelsTableHeader = () =>
    <thead>
        <tr>
            <th>#</th>
            <th>Model ID</th>
            <th>Device model name</th>
            <th>Instances</th>
        </tr>
    </thead>

function modelRowKey(model: number): string {
    return `manufacturer-model-entry-key-${model}`;
}


const mapModelsToTableBody = (models: Array<ManufacturerModelInfo>)/* JSX.Element */ => {
    // debugger;
    return models.map((model: ManufacturerModelInfo, index: number) => {
        return (
            <tr key={modelRowKey(model.model_id)}>
                <td><Link to={`${deviceModelsPath}/${model.model_id}`}>{index}</Link></td>
                <td><Link to={`${deviceModelsPath}/${model.model_id}`}>{model.model_id}</Link></td>
                <td><Link to={`${deviceModelsPath}/${model.model_id}`}>{model.name}</Link></td>
                <td><Link to={`${deviceModelsPath}/${model.model_id}`}>{model.count}</Link></td>
            </tr>
        )
    })
}

const deviceModelsBody = (models: Array<ManufacturerModelInfo>): JSX.Element =>
    <tbody>
        {mapModelsToTableBody(models)}
    </tbody>

export const ManufacturerDeviceModelsTable = (props: {models: Array<ManufacturerModelInfo>}) => {

    if (props.models.length === 0) {
        return (
            <h3>
                No models in database
            </h3>
        )
    }
    return (
        <>
            <Table striped bordered hover>
                {ModelsTableHeader()}
                {deviceModelsBody(props.models)}
            </Table>
        </>
    );
}

