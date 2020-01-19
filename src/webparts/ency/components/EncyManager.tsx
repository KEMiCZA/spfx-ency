import { inject, observer } from 'mobx-react';
import * as React from 'react';
import { Stores, DefaultStoreProps } from '../../../stores/RootStore';
import { ApplicationStatus } from '../../../stores/AppStore';
import CreateList from './listcreation/CreateList';

@inject(Stores.AppStore, Stores.ConfigurationStore)
@observer
export default class EncyManager extends React.Component<DefaultStoreProps, {}> {

  public render(): React.ReactElement<DefaultStoreProps> {
    const { status } = this.props.appStore;

    switch (status) {
      case ApplicationStatus.Initializing:
        return (<div>"Loading..."</div>);
      case ApplicationStatus.CreateList:
        return (
          <CreateList></CreateList>
        );
      case ApplicationStatus.ChatReady:
        return (<p>RENDER CHAT PROGRAM</p>);
      default:
    }
  }
}
