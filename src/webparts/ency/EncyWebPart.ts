import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import { IPropertyPaneConfiguration, PropertyPaneTextField } from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import * as strings from 'EncyWebPartStrings';
import * as sjcl from 'sjcl';
import { RootStore } from '../../stores/RootStore';
import EncyProvider from './EncyProvider';
import { configure } from 'mobx';
import { ListSubscriptionFactory } from '@microsoft/sp-list-subscription';
import { Guid } from '@microsoft/sp-core-library';
import { sp } from "@pnp/sp";

configure({ enforceActions: "always" });
export interface IEncyWebPartProps {
  description: string;
}

export default class EncyWebPart extends BaseClientSideWebPart<IEncyWebPartProps> {
  private readonly dependencies = { rootStore: new RootStore() };

  private _listSubscriptionFactory: ListSubscriptionFactory;

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
      
      init(this.context.pageContext.user.displayName);
    });
  }

  constructor() {
    super();
    sjcl.random.addEventListener('seeded', () => { });
    sjcl.random.startCollectors();
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
