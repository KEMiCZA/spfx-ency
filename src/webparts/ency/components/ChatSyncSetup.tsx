import { inject, observer } from 'mobx-react';
import * as React from 'react';
import { Stores, DefaultStoreProps } from '../../../stores/RootStore';
import { ApplicationStatus, SenderType } from '../../../stores/AppStore';
import { CompoundButton } from 'office-ui-fabric-react/lib/Button';
import { Text } from 'office-ui-fabric-react/lib/Text';
import { TextField, ITextField } from 'office-ui-fabric-react/lib/TextField';
import { ProgressIndicator } from 'office-ui-fabric-react/lib/ProgressIndicator';

@inject(Stores.AppStore)
@observer
export default class ChatSyncSetup extends React.Component<DefaultStoreProps, any> {
    private textfieldRef: ITextField;

    public state = {
        disabled: false
    };

    public render(): React.ReactElement<DefaultStoreProps> {
        const { status, chatId, senderType, chatStatus, chatSyncPercentage } = this.props.appStore;

        if (senderType === SenderType.Bob) {
            return (
                <>
                    <Text
                        variant={'large'}>
                        Syncing with party to join chat...<p></p>
                    </Text>
                    <ProgressIndicator
                        label="Pairing/Sync status"
                        description={chatStatus?.toString()}
                        percentComplete={chatSyncPercentage} />
                </>
            );
        }
        else {
            return (
                <>
                    {status === ApplicationStatus.WaitingForParty ? (
                        <>
                            <Text
                                variant={'large'}>
                                Waiting for party to join...<p></p>
                                Please send the following link to your party to join<p></p>
                            </Text>
                            <TextField
                                componentRef={(ref) => this.textfieldRef = ref}
                                styles={{ field: { cursor: "pointer" }, icon: { backgroundColor: "white" } }}
                                onClick={(ev) => { ev.preventDefault(); this.copyToClipboard(this.getInviteLink(chatId)); }}
                                value={this.getInviteLink(chatId)}
                                iconProps={{ iconName: 'Copy' }}></TextField>
                            <p></p>
                            <ProgressIndicator label="Pairing/Sync status" description={chatStatus?.toString()} percentComplete={chatSyncPercentage} />
                        </>
                    ) : (
                            <CompoundButton
                                primary
                                secondaryText={this.state.disabled ? "Initializing encrypted chat..." : "Click here to start an encrypted conversation"}
                                disabled={this.state.disabled}
                                checked={false}
                                onClick={this.createList}>Start Chat</CompoundButton>)
                    }
                </>
            );
        }
    }
    private copyToClipboard = (text: string) => {
        try {
            this.textfieldRef.select();
            document.execCommand('copy');
        } catch (err) { }
    }

    private getInviteLink = (chatId: string): string => {
        const url = new URL(window.location.href);
        url?.searchParams?.append('cid', chatId);
        return url.href;
    }

    private createList = async () => {
        this.setState({ disabled: true });
        await this.props.appStore.createList();
    }
}
