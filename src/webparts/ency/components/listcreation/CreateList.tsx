import { inject, observer } from 'mobx-react';
import * as React from 'react';
import { Stores, DefaultStoreProps } from '../../../../stores/RootStore';
import { ApplicationStatus } from '../../../../stores/AppStore';
import { CompoundButton } from 'office-ui-fabric-react/lib/Button';

@inject(Stores.AppStore)
@observer
export default class CreateList extends React.Component<DefaultStoreProps, any> {

    public state = {
        disabled: false
    };

    public render(): React.ReactElement<DefaultStoreProps> {
        const { status, chatId } = this.props.appStore;

        return (
            <>
                <CompoundButton
                    primary
                    secondaryText={status === ApplicationStatus.WaitingForParty ? "Waiting for party to join" : "Click here to start an encrypted conversation"}
                    disabled={this.state.disabled || status === ApplicationStatus.WaitingForParty}
                    checked={false}
                    onClick={this.createList}
                >{status === ApplicationStatus.WaitingForParty ? "Starting..." : "Start Chat"}</CompoundButton>

                {status === ApplicationStatus.WaitingForParty ? (<p>Please send the following link to your party to join: {`${window.location.href}&cid=${chatId}`} </p>) : null}
            </>
        );
    }

    private createList = async () => {
        this.setState({ disabled: true });
        await this.props.appStore.createList();
    }
}
