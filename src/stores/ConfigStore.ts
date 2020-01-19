import { action, observable, computed } from "mobx";
import { RootStore } from "./RootStore";
// import * as validUrl from 'valid-url';
import { ApplicationStatus } from "./AppStore";

export class ConfigStore {
    // @observable public webhookGatewayUrl: string;

    constructor(private rootStore: RootStore) {
        this.setInitialState();
    }

    @action
    public setInitialState(): void {
        // this.webhookGatewayUrl = undefined;
    }

    // @action
    // public setWebhookGatewayUrl = (url: string): void => {
    //     const { status, init } = this.rootStore.appStore;

    //     this.webhookGatewayUrl = url;
    //     if (this.isValidWebhookGatewayUrl) {
    //         if (status === ApplicationStatus.ConfigureWebhookUrl)
    //             init();
    //     } else {
    //         if (status !== ApplicationStatus.ConfigureWebhookUrl)
    //             init();
    //     }
    // }

    // @computed
    // public get isValidWebhookGatewayUrl(): boolean {
    //     return true;
    //     // return validUrl.isHttpsUri(this.webhookGatewayUrl) != undefined;
    // }
}