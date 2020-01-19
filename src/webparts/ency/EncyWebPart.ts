import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import {
  IPropertyPaneConfiguration,
  PropertyPaneTextField
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import * as strings from 'EncyWebPartStrings';
import Ency from './components/Ency';
import { IEncyProps } from './components/IEncyProps';
import * as sjcl from 'sjcl';
import { RootStore } from '../../stores/RootStore';
import EncyProvider from './EncyProvider';
import { configure } from 'mobx';
import { ListSubscriptionFactory, IListSubscription } from '@microsoft/sp-list-subscription';
import { Guid } from '@microsoft/sp-core-library';

import { sp } from "@pnp/sp";
import "@pnp/sp/webs";
// import "@pnp/sp/"
// import { sp } from "@pnp/sp/presets/all";
configure({ enforceActions: "always" });
export interface IEncyWebPartProps {
  description: string;
}

export default class EncyWebPart extends BaseClientSideWebPart<IEncyWebPartProps> {
  private readonly dependencies = { rootStore: new RootStore() };

  private _listSubscriptionFactory: ListSubscriptionFactory;
  // private _listSubscription: IListSubscription;

  private async createListSubscription(id: string) {
    if (this._listSubscriptionFactory)
      return;

    this._listSubscriptionFactory = new ListSubscriptionFactory(this);

    await this._listSubscriptionFactory.createSubscription({
      listId: Guid.parse(id),
      callbacks: {
        notification: this._loadmessages
      }
    });
  }

  private _loadmessages = (): void => {
    const { getMessages } = this.dependencies.rootStore.appStore;
    getMessages();
  }

  protected onInit(): Promise<void> {

    return super.onInit().then(_ => {

      const { setOnCreateListSubscriptionDelegate, init } = this.dependencies.rootStore.appStore;
      setOnCreateListSubscriptionDelegate((id: string) => {
        this.createListSubscription(id);
      });

      sp.setup({
        spfxContext: this.context
      });


      sp.web.get().then(x => {
        console.log(x);
      });

      init();
    });
  }

  constructor() {
    super();
    sjcl.random.addEventListener('seeded', () => { });
    sjcl.random.startCollectors();

    const randomWords = sjcl.random.randomWords(1337, 1);
    sjcl.random.addEntropy(randomWords, 1024, "crypto.getRandomValues");
  }

  public render(): void {
    const element: React.ReactElement<{}> = React.createElement(
      EncyProvider,
      {
        stores: { ...this.dependencies.rootStore }
      }
    );

    ReactDom.render(element, this.domElement);
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: {
            description: strings.PropertyPaneDescription
          },
          groups: [
            {
              groupName: strings.BasicGroupName,
              groupFields: [
                PropertyPaneTextField('description', {
                  label: strings.DescriptionFieldLabel
                })
              ]
            }
          ]
        }
      ]
    };
  }
}