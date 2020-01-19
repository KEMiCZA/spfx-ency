import { inject, observer } from 'mobx-react';
import * as React from 'react';
import { Stores, DefaultStoreProps } from '../../../stores/RootStore';
import { TextField } from 'office-ui-fabric-react/lib/TextField';
import { PrimaryButton } from 'office-ui-fabric-react/lib/Button';
import { Stack, IStackProps } from 'office-ui-fabric-react/lib/Stack';
import { MessageBar, MessageBarType } from 'office-ui-fabric-react/lib/MessageBar';
import { Text } from 'office-ui-fabric-react/lib/Text';
import { SenderType, IMessage } from '../../../stores/AppStore';

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
            message: "Nuffing much majn just chillin world \n what's up my man cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc"
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
                    {messages.map(x => {

                        return <MessageBar
                            styles={
                                {
                                    icon: null,
                                    iconContainer: {
                                        display: "none"
                                    },
                                    content: {
                                        whiteSpace: "pre-line"
                                    },
                                    root: senderType === x.fromType ? {
                                        float: "right",
                                        width: "auto",
                                        maxWidth: "500px",
                                        marginRight: "10px",
                                        padding: "5px",
                                        borderRadius: "15px",
                                        boxShadow: "0 2px 4px 0 rgba(0, 0, 0, 0.2), 0 3px 10px 0 rgba(0, 0, 0, 0.19)"
                                    } : {
                                            float: "left",
                                            width: "auto",
                                            maxWidth: "500px",
                                            marginLeft: "10px",
                                            padding: "5px",
                                            borderRadius: "15px",
                                            boxShadow: "0 2px 4px 0 rgba(0, 0, 0, 0.2), 0 3px 10px 0 rgba(0, 0, 0, 0.19)"
                                        }
                                }
                            }
                            isMultiline
                            messageBarType={senderType === x.fromType ? MessageBarType.success : MessageBarType.info}>
                            <Text variant={'large'} >{x.message}</Text>
                            <p></p>
                            <Text variant={'small'} >{x.created.toLocaleTimeString()} by {x.from}</Text>
                        </MessageBar>;

                    })}

                    <TextField placeholder={"Type a message"} value={message} onChange={(t, v) => this.setState({ message: v })} multiline autoAdjustHeight />
                    <PrimaryButton disabled={sendingMessage} onClick={this.sendMessage}>Send</PrimaryButton>
                </Stack>


            </>
        );
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
}
