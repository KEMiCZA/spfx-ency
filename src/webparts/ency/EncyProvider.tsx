import { Provider } from "mobx-react";
import * as React from 'react';
import EncyManager from './components/EncyManager';

export interface ProviderOwnProps {
    stores: {};
}

export default class EncyProvider extends React.Component<ProviderOwnProps, {}> {
    public render(): React.ReactElement<{}> {
        return (
            <Provider {...this.props.stores}>
                <EncyManager></EncyManager>
            </Provider>
        );
    }
}