import { inject, observer } from 'mobx-react';
import { toJS } from 'mobx';
import * as React from 'react';
import { Stores, DefaultStoreProps } from '../../../stores/RootStore';
import { TextField } from 'office-ui-fabric-react/lib/TextField';
import { PrimaryButton, DefaultButton } from 'office-ui-fabric-react/lib/Button';
import { Stack, IStackProps, IStackTokens } from 'office-ui-fabric-react/lib/Stack';
import { MessageBar, MessageBarType, IMessageBarStyleProps, IMessageBarStyles } from 'office-ui-fabric-react/lib/MessageBar';
import { Text } from 'office-ui-fabric-react/lib/Text';
import { SenderType, IMessage } from '../../../stores/AppStore';
import { IStyleFunctionOrObject } from 'office-ui-fabric-react/lib/Utilities';

const verticalStackProps: IStackProps = {
    styles: { root: { overflow: 'hidden', width: '95%' } },
    tokens: { childrenGap: 20 }
};

@inject(Stores.AppStore)
@observer
export default class Chat extends React.Component<DefaultStoreProps, any> {

    public state = {
        message: "",
        sendingMessage: false
    };

    // Used during testing
    private messages: IMessage[] = [
        {
            created: new Date(),
            from: "Person A",
            fromType: SenderType.Bob,
            message: "Hello world \n what's up my man vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv"
        },
        {
            created: new Date(),
            from: "Person B",
            fromType: SenderType.Alice,
            message: "Nuffing much majn just chillin word \n what's up my man cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc"
        }
    ];

    public render(): React.ReactElement<DefaultStoreProps> {
        const { message, sendingMessage } = this.state;
        const { messages, senderType } = this.props.appStore;

        // let senderType = SenderType.Alice;
        // let messages = this.messages;

        return (
            <>
                <Stack {...verticalStackProps}>
                    {toJS(messages.sort((x, y) => x.created.getTime() - y.created.getTime())).map(x => {
                        const isMyMsg: boolean = senderType === x.fromType;
                        return (
                            <MessageBar
                                styles={this.chatStyles(isMyMsg)}
                                isMultiline
                                messageBarType={isMyMsg ? MessageBarType.success : MessageBarType.info}>
                                <Text variant={'large'} >{x.message}</Text>
                                <p></p>
                                <Text variant={'small'} >{x.created.toLocaleTimeString()} by {x.from}</Text>
                            </MessageBar>);
                    })}

                    <TextField placeholder={"Type a message"} value={message} onChange={(t, v) => this.setState({ message: v })} multiline autoAdjustHeight />
                    <Stack horizontal disableShrink styles={{ root: { overflow: 'hidden', width: '100%' } }} tokens={{ childrenGap: 10 }}>
                        <PrimaryButton styles={{ root: { width: '80%' } }} disabled={sendingMessage} onClick={this.sendMessage}>Send</PrimaryButton>
                        <DefaultButton styles={{ root: { width: '19%' } }} onClick={this.endSession}>End Session</DefaultButton>
                    </Stack>

                </Stack>
            </>
        );
    }

    private chatStyles(isMyMsg: boolean): IStyleFunctionOrObject<IMessageBarStyleProps, IMessageBarStyles> {
        const root = {
            width: "auto",
            maxWidth: "800px",
            padding: "5px",
            borderRadius: "15px",
            boxShadow: "0 2px 4px 0 rgba(0, 0, 0, 0.2), 0 3px 10px 0 rgba(0, 0, 0, 0.19)"
        };

        return {
            icon: null,
            iconContainer: {
                display: "none"
            },
            content: {
                whiteSpace: "pre-line"
            },
            root: isMyMsg ? { ...root, float: "right", marginRight: "10px" } : { ...root, float: "left", marginLeft: "10px" }
        };
    }

    private sendMessage = async () => {
        const { message } = this.state;
        const { sendMessage } = this.props.appStore;

        this.setState({ sendingMessage: true });

        try {
            await sendMessage(message);
        } catch (ex) {
            console.error(ex);
        }

        this.setState({ message: "", sendingMessage: false });
    }

    private endSession = async () => {
        const { endChatSession } = this.props.appStore;
        await endChatSession();
    }
}
