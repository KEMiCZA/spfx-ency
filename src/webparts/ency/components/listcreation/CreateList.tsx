import { inject, observer } from 'mobx-react';
import * as React from 'react';
import { CompoundButton } from 'office-ui-fabric-react';
import { Stores, DefaultStoreProps } from '../../../../stores/RootStore';

@inject(Stores.AppStore)
@observer
export default class CreateList extends React.Component<DefaultStoreProps, any> {

    public state = {
        disabled: false
    };

    public render(): React.ReactElement<DefaultStoreProps> {

        return (
            <>
                <CompoundButton
                    primary
                    secondaryText="Click here to start an encrypted conversation"
                    disabled={this.state.disabled}
                    checked={false}
                    onClick={this.createList}
                >Start Chat</CompoundButton>
            </>
        );
    }

    private createList = async () => {
        this.setState({ disabled: true });
        await this.props.appStore.createList();
    }
}
