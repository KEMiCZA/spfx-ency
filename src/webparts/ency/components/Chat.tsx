import { inject, observer } from 'mobx-react';
import * as React from 'react';
import { Stores, DefaultStoreProps } from '../../../stores/RootStore';
import { TextField } from 'office-ui-fabric-react/lib/TextField';
import { PrimaryButton } from 'office-ui-fabric-react/lib/Button';

@inject(Stores.AppStore)
@observer
export default class Chat extends React.Component<DefaultStoreProps, any> {

    public state = {
        message: ""
    };

    public render(): React.ReactElement<DefaultStoreProps> {
        const { message } = this.state;
        const { messages } = this.props.appStore;

        return (
            <>
                <ul>
                    {messages.map(x => (<li>{x.fromType.toString()} | {x.message}</li>))}
                </ul>
                <TextField value={message} onChange={(t, v) => this.setState({ message: v })} multiline />
                <PrimaryButton onClick={this.sendMessage}>Send</PrimaryButton>
            </>
        );
    }

    private sendMessage = async () => {
        const { message } = this.state;
        const { sendMessage } = this.props.appStore;

        await sendMessage(message);

        this.setState({ message: "" });
    }
}
