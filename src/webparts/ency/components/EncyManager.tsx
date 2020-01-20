import { inject, observer } from 'mobx-react';
import * as React from 'react';
import { Stores, DefaultStoreProps } from '../../../stores/RootStore';
import { ApplicationStatus } from '../../../stores/AppStore';
import ChatSyncSetup from './listcreation/ChatSyncSetup';
import Chat from './Chat';

@inject(Stores.AppStore, Stores.ConfigurationStore)
@observer
export default class EncyManager extends React.Component<DefaultStoreProps, {}> {

  public render(): React.ReactElement<DefaultStoreProps> {
    const { status } = this.props.appStore;
    // return (<Chat></Chat>);

    switch (status) {
      case ApplicationStatus.Initializing:
        return (<p>Loading...</p>);
      case ApplicationStatus.WaitingForParty:
      case ApplicationStatus.CreateList:
        return (
          <ChatSyncSetup></ChatSyncSetup>
        );
      case ApplicationStatus.ChatReady:
        return (<Chat></Chat>);
      case ApplicationStatus.Completed:
        return (<p>Chat has ended. Please close this window.</p>);
      default:
        return (<p>Unkown status</p>);
    }
  }
}
