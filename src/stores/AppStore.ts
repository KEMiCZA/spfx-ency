import { action, computed, observable, runInAction } from 'mobx';
import { RootStore } from "./RootStore";
import { sp } from '@pnp/sp';
import '@pnp/sp/webs';
// import { Web } from '@pnp/sp/webs';
import '@pnp/sp/lists';
import '@pnp/sp/items';
import '@pnp/sp/subscriptions';
import '@pnp/sp/fields';
import '@pnp/sp/files';
import '@pnp/sp/folders';
import { Guid } from '@microsoft/sp-core-library';
import { isEmpty } from '@microsoft/sp-lodash-subset';
// import { isEmpty } from '@microsoft/sp-lodash-subset';


export enum ApplicationStatus {
    Initializing = "Initializing",
    // ConfigureWebhookUrl = "Configure Webhook URL",
    CreateList = "Create List",
    WaitingForParty = "Waiting for party",
    ChatReady = "Chat Ready",
    Completed = "Completed"
}

export interface IWebhookItemCreationInfo {
    title: string;
    webhookUrl: string;
    webUrl: string;
    listId: string;
}

export interface IWebhookItemInfo {
    Title: string;
    webhookUrl: string;
    webhookGatewayUrl: string;
    webUrl: string;
    subscriptionId: string;
    expirationDateTime: string;
    resource: string;
    Id: number;
}

export enum SenderType {
    Alice,
    Bob
}

export class AppStore {
    private configListTitle: string;
    private currentItemId: number = 0;

    @observable public isLoadingConfiguration: boolean;
    @observable public isLoadingOtherStuff: boolean;
    @observable public status: ApplicationStatus;
    @observable public items: IWebhookItemInfo[];
    @observable public selectedItems: IWebhookItemInfo[];
    @observable public isDeleteFormVisible: boolean;
    @observable public formItem: IWebhookItemInfo;
    /**
     * Used for logging the deletion progress.
     */
    @observable public deletionProgress: string;
    @observable public renewallProgress: string;

    @observable public senderType: SenderType;

    private _onCreateListSubscription: (id: string) => void;
    /**
     * Since we are using list notifications we need to make sure to not reload our list when creating a new item
     * We solve this by adding a setTimeout to set the creatingItem to false after 10 seconds
     */
    private _creatingItem: boolean;
    private _deletingItems: boolean;
    private _renewingItems: boolean;

    constructor(private rootStore: RootStore) {

        this.setInitialState();
    }

    public setOnCreateListSubscriptionDelegate = (delegate: (id: string) => void) => {
        this._onCreateListSubscription = delegate;
    }

    @action
    private setInitialState(): void {
        this.status = ApplicationStatus.Initializing;
        this.senderType = SenderType.Alice;

        this.items = [];
        this.selectedItems = [];
        this.formItem = null;
        this.deletionProgress = "";
        this.renewallProgress = "";
        this.isDeleteFormVisible = false;

        this.isLoadingConfiguration = true;
        this.isLoadingOtherStuff = false;

        this._creatingItem = false;
        this._deletingItems = false;
        this._renewingItems = false;
    }

    @action
    public init = async () => {
        // const { isValidWebhookGatewayUrl } = this.rootStore.configStore;

        var url = new URL(window.location.href);
        var cid = url?.searchParams?.get("cid");
        if (!isEmpty(cid)) {
            this.configListTitle = cid;
            this.currentItemId = 0;
            this.senderType = SenderType.Bob;
        } else {
            this.senderType = SenderType.Alice;
        }

        if (!isEmpty(this.configListTitle)) {
            const lists = await sp.web.lists.select("Id").filter(`Title eq '${this.configListTitle}'`)();
            if (lists.length > 0) {
                await this.getMessages();
                const listId = lists[0].Id;
                this._onCreateListSubscription(listId);
            } else {
                throw Error("List should exist?");
            }
        }
        else {
            runInAction(() => {
                this.status = ApplicationStatus.CreateList;
            });
        }

    }

    @action
    public getMessages = async () => {

        // if (this._creatingItem || this._deletingItems || this._renewingItems)
        //     return;

        if (this.currentItemId === 0) {
            // 
        }
        else if (this.currentItemId === 1) {

        }

        // Here we should fetch items only from currentId..
        const items = await sp.web.lists.getByTitle(this.configListTitle).items.getAll();

        runInAction(() => {
            this.items = items;
            this.status = ApplicationStatus.ChatReady;
        });
    }

    @computed
    public get isFormItemAvailable(): boolean {
        return !(this.formItem === null || this.formItem === undefined);
    }

    @computed
    public get isInitializing(): boolean {
        return this.isLoadingConfiguration || this.isLoadingOtherStuff;
    }

    @computed
    public get selectedItemsCount(): number {
        return this.selectedItems.length;
    }

    @action
    public setFormItem = (formItem: IWebhookItemInfo) => {
        this.formItem = formItem;
    }

    @action
    public clearFormItem = () => {
        this.formItem = null;
    }

    @action
    public createList = async (): Promise<void> => {

        await sp.web.lists.add(this.configListTitle, "Temp Document library used for exchanging encrypted messages", 101, true);

        runInAction(() => {
            this.status = ApplicationStatus.WaitingForParty;
        });
    }


}