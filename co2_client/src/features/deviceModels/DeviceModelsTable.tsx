import {Suspense} from 'react';
import {useSelector, useDispatch} from 'react-redux';
import {Table, Button} from 'react-bootstrap';
// import {UserInfoDevice} from '../../utils/QueryDeviceInfo';
import {Link} from 'react-router-dom';

import { useTranslation } from 'react-i18next';

import {ManufacturerModelInfo} from '../manufacturers/manufacturerSlice';
import {deviceModelsPath} from '../../paths/paths';
import {setSelectedModel, selectSelectedModel, selectSelectedModelName, setSelectedModelName} from '../deviceModels/deviceModelsSlice';
import { AppDispatch } from '../../app/store';

const ModelsTableHeader = () => {
    const [translate] = useTranslation();
    return (
        <thead>
            <tr>
                <th>#</th>
                <th>{translate('Model ID')}</th>
                <th>{translate('Device model name')}</th>
                <th>{translate('Instances')}</th>
                <th>{translate('pick it!')}</th>
            </tr>
        </thead>
    );
}

function modelRowKey(model: number): string {
    return `manufacturer-model-entry-key-${model}`;
}

const pickModel = (model_id: number, name: string, dispatch: AppDispatch) => {
    dispatch(setSelectedModel(model_id));
    dispatch(setSelectedModelName(name));
}


const mapModelsToTableBody = (models: Array<ManufacturerModelInfo>, dispatch: AppDispatch)/* JSX.Element */ => {
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

const deviceModelsBody = (models: Array<ManufacturerModelInfo>, dispatch: AppDispatch): JSX.Element =>
    <tbody>
        {mapModelsToTableBody(models, dispatch)}
    </tbody>

const renderTable = (models: Array<ManufacturerModelInfo>, dispatch: AppDispatch) =>
    <Table striped bordered hover>
        <Suspense fallback="Loading translations...">
            <ModelsTableHeader/>
        </Suspense>
        {deviceModelsBody(models, dispatch)}
    </Table>

export const ManufacturerDeviceModelsTable = (props: {models: Array<ManufacturerModelInfo>, selectedManufacturer: number | null}) => {
    const [translate] = useTranslation();
    const selectedModel = useSelector(selectSelectedModel);
    const selectedModelName = useSelector(selectSelectedModelName);
    const dispatch = useDispatch();

    if (props.models.length === 0) {
        if (props.selectedManufacturer === null) {
            return null;
        }
        return (
            <div>
                <h3>
                    No models in database
                </h3>
            </div>
        );
    }
    if (selectedModel === -1) {
        if (props.models === undefined) {
            throw new Error(`props.models is undefined! This is a bug in DeviceModelsTable.tsx. selectedManufacturer: ${props.selectedManufacturer}, selectedModel: ${selectedModel}, selectedModelName: ${selectedModelName}`);
        }
        return (
            <div>  
                {renderTable(props.models, dispatch)}
            </div>
        );
    }
    return (
        <div>
            <div>
                <span>
                    {translate('Selected a model!')} ({selectedModelName})
                </span>
                <br/>
                <Button variant="secondary" onClick={() => {dispatch(setSelectedModel(-1)); dispatch(setSelectedModelName(''))}}>
                    <span>
                        {translate('Unselect')} {selectedModelName}
                    </span>
                </Button>
            </div>

        </div>
    );
}

