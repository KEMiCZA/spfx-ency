import { action, computed, observable, runInAction } from 'mobx';
import { RootStore } from "./RootStore";
import { sp } from '@pnp/sp';
import '@pnp/sp/webs';
import '@pnp/sp/lists';
import '@pnp/sp/items';
import '@pnp/sp/fields';
import '@pnp/sp/files';
import '@pnp/sp/folders';
import { Guid } from '@microsoft/sp-core-library';
import { isEmpty } from '@microsoft/sp-lodash-subset';
import * as sjcl from 'sjcl';

export enum ApplicationStatus {
    Initializing = "Initializing",
    CreateList = "Create List",
    WaitingForParty = "Waiting for party",
    ChatReady = "Chat Ready",
    Completed = "Completed"
}

export enum ChatInitializationStatus {
    WaitingForPubKey = "Waiting for public key retrieval from party",
    SendingPublicKey = "Sending public key to party",
    PublicKeyStored = "Public key stored"
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
    Alice = "Alice",
    Bob = "Bob"
}

export interface IMessage {
    fromType: SenderType;
    from: string;
    message: string;
    created: Date;
}

export interface IMessageCreationInfo {
    fromType: SenderType;
    from: string;
    message: string;
    created: string;
}

export interface IMessageUpdateInfo {
    encyval: string;
    encytype: string;
}

export class AppStore {
    private readonly _encyvalFieldName = "encyval";
    private readonly _encySenderTypeFieldName = "encytype";
    private readonly _encyEndSessionIdentifierString = "ency-end-session-yo";

    private pub: sjcl.SjclElGamalPublicKey;
    private secret: sjcl.SjclElGamalSecretKey;
    private pubEnc: sjcl.SjclElGamalPublicKey;
    private currentItemId: number = 0;
    private _onCreateListSubscription: (id: string) => void;

    @observable private configListTitle: string;
    @observable public status: ApplicationStatus;
    @observable public chatStatus: ChatInitializationStatus;
    @observable public messages: IMessage[];
    @observable public senderType: SenderType;
    @observable public currentUsersDisplayName: string;

    constructor(private rootStore: RootStore) {
        this.setInitialState();
    }

    public setOnCreateListSubscriptionDelegate = (delegate: (id: string) => void) => {
        this._onCreateListSubscription = delegate;
    }

    @computed
    public get chatId(): string {
        return this.configListTitle;
    }

    @computed
    public get chatSyncPercentage(): number {
        const isAlice = this.senderType === SenderType.Alice;

        switch (this.chatStatus) {
            case ChatInitializationStatus.WaitingForPubKey:
                return isAlice ? 0 : 50;
            case ChatInitializationStatus.SendingPublicKey:
                return isAlice ? 50 : 0;
            case ChatInitializationStatus.PublicKeyStored:
                return isAlice ? 100 : 100;
        }
    }

    @action
    private setInitialState(): void {
        this.status = ApplicationStatus.Initializing;
        this.senderType = SenderType.Alice;
        this.messages = [];
    }

    @action
    public init = async (userDisplayName: string) => {
        this.currentUsersDisplayName = userDisplayName;

        window.onbeforeunload = (e) => {
            if (this.status === ApplicationStatus.ChatReady) {
                const dialogText = 'Please end the chat session first before closing the window!';
                e.returnValue = dialogText;
                return dialogText;
            } else {
                return null;
            }
        };

        const url = new URL(window.location.href);
        const cid = url?.searchParams?.get("cid");
        if (!isEmpty(cid)) {
            this.configListTitle = cid;
            this.currentItemId = 0;
            this.senderType = SenderType.Bob;
            this._onCreateListSubscription(cid);
        } else {
            this.senderType = SenderType.Alice;
        }

        if (!isEmpty(this.configListTitle)) {
            const lists = await sp.web.lists.select("Id").filter(`Id eq guid'${this.configListTitle}'`)();
            if (lists.length > 0) {
                const items = await sp.web.lists.getById(this.configListTitle).items.get();
                if (items.length === 1) {
                    await this.getMessages();
                } else {
                    throw Error("Chat had already been initialized previously or by another party.");
                }
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
        if (this.status === ApplicationStatus.Completed)
            return;

        const list = sp.web.lists.getById(this.configListTitle);

        if (this.status === ApplicationStatus.ChatReady) {
            // Only fetch items from id currentItemId
            const items = await list.items.select(`${this._encyvalFieldName},${this._encySenderTypeFieldName},Id`).filter(`Id gt ${this.currentItemId}`).get();

            if (items.length === 0)
                return;

            // If the metadata is not yet updated on the file
            if (items.filter(x => x[this._encySenderTypeFieldName] === null).length > 0)
                return;

            this.currentItemId = items[items.length - 1].Id;
            // Filter out only my messages
            const newMessages = [...this.messages];

            items
                .filter(x => x[this._encySenderTypeFieldName] !== this.senderType)
                .forEach(x => {
                    const decryptedMessage = sjcl.decrypt(this.secret, JSON.parse(x[this._encyvalFieldName]));
                    const msg = JSON.parse(decryptedMessage);
                    msg.created = new Date(msg.created);
                    newMessages.push(msg);
                });

            const endSession: boolean = newMessages.filter(x => x.message === this._encyEndSessionIdentifierString).length > 0;

            if (endSession) {
                // List might've been deleted already
                await sp.web.lists.getById(this.configListTitle).delete();
            }

            runInAction(() => {
                if (endSession) {
                    this.status = ApplicationStatus.Completed;
                    this.messages = [];
                } else {
                    this.messages = newMessages;
                }
            });
        }
        else {

            const items = await list.items.getAll();

            if (items.length === 0) {
                return;
            }

            else if (items.length === 1) {
                // If we are Alice, we don't need to do anything
                if (this.senderType === SenderType.Alice) {
                    runInAction(() => {
                        this.chatStatus = ChatInitializationStatus.WaitingForPubKey;
                    });
                    return;
                }

                // If we are Bob we should generate our own public key and send it encrypted back to Alice

                runInAction(() => {
                    this.chatStatus = ChatInitializationStatus.SendingPublicKey;
                });

                let pair = sjcl.ecc.elGamal.generateKeys(sjcl.ecc.curves.c256, 1);
                let pubBob = pair.pub.get();
                var pubHex = sjcl.codec.hex.fromBits(pubBob.x) + sjcl.codec.hex.fromBits(pubBob.y);

                const item = await list.items.getById(1).get();
                const pubKeyAliceHex = item[this._encyvalFieldName];

                // In case a race condition where the encyval field has not been updated yet
                if (isEmpty(pubKeyAliceHex))
                    return;

                const pubKeyAliceData = sjcl.codec.hex.toBits(pubKeyAliceHex);
                const pubKeyAlice = new sjcl.ecc.elGamal.publicKey(sjcl.ecc.curves.c256, pubKeyAliceData);

                const encryptedBobPublicKey = sjcl.encrypt(pubKeyAlice, pubHex);
                const encryptedBobPublicKeyJson = JSON.stringify(encryptedBobPublicKey);

                const firstItemPub = await list.rootFolder.files.add(Guid.newGuid().toString(), "X");
                await (await firstItemPub.file.getItem()).update(<IMessageUpdateInfo>{
                    encyval: encryptedBobPublicKeyJson
                });

                runInAction(() => {
                    this.status = ApplicationStatus.WaitingForParty;
                    this.pub = pair.pub;
                    this.secret = pair.sec;
                });

            }
            else if (items.length === 2) {
                // If we are Bob, do nothing
                if (this.senderType === SenderType.Bob) {
                    runInAction(() => {
                        this.chatStatus = ChatInitializationStatus.WaitingForPubKey;
                    });
                    return;
                }

                // If we are Alice we should decrypt the public key of Bob and send a new Encrypted public key to Bob
                runInAction(() => {
                    this.chatStatus = ChatInitializationStatus.SendingPublicKey;
                });
                const itemResp = await list.items.getById(2).get();

                // In case a race condition where the encyval field has not been updated yet
                if (isEmpty(itemResp[this._encyvalFieldName]))
                    return;

                const encryptedBobPublicKey: sjcl.SjclCipherEncrypted = JSON.parse(itemResp[this._encyvalFieldName] as string);

                const publicKeyBobHex = sjcl.decrypt(this.secret, encryptedBobPublicKey);
                const pubKeyBobData = sjcl.codec.hex.toBits(publicKeyBobHex);
                const pubKeyBob = new sjcl.ecc.elGamal.publicKey(sjcl.ecc.curves.c256, pubKeyBobData);

                const pair = sjcl.ecc.elGamal.generateKeys(sjcl.ecc.curves.c256, 1);
                const pubAlice = pair.pub.get();
                const pubAliceHex = sjcl.codec.hex.fromBits(pubAlice.x) + sjcl.codec.hex.fromBits(pubAlice.y);

                const encryptedAlicePublicKey = sjcl.encrypt(pubKeyBob, pubAliceHex);
                const encryptedAlicePublicKeyJSON = JSON.stringify(encryptedAlicePublicKey);

                const item = await list.rootFolder.files.add(Guid.newGuid().toString(), "x");

                await (await item.file.getItem()).update(<IMessageUpdateInfo>{
                    encyval: encryptedAlicePublicKeyJSON
                });

                runInAction(() => {
                    this.status = ApplicationStatus.WaitingForParty;
                    this.pubEnc = pubKeyBob;
                    this.pub = pair.pub;
                    this.secret = pair.sec;
                });

            }
            else if (items.length === 3) {
                // If we are Alice don't do anything
                if (this.senderType === SenderType.Alice) {
                    runInAction(() => {
                        this.chatStatus = ChatInitializationStatus.PublicKeyStored;
                    });
                    return;
                }

                // If we are Bob decrypt Alice's public key and we can start chatting
                const itemResp = await list.items.getById(3).get();
                const encryptedAlicePublicKey: sjcl.SjclCipherEncrypted = JSON.parse(itemResp[this._encyvalFieldName] as string);
                const publicKeyAlice = sjcl.decrypt(this.secret, encryptedAlicePublicKey);

                const pubKeyAliceData = sjcl.codec.hex.toBits(publicKeyAlice);
                const pubKeyAlice = new sjcl.ecc.elGamal.publicKey(sjcl.ecc.curves.c256, pubKeyAliceData);

                // Create another file to indicate we can start chatting for Bob
                await list.rootFolder.files.add(Guid.newGuid().toString(), "ACK");
                runInAction(() => {
                    this.status = ApplicationStatus.ChatReady;
                    this.pubEnc = pubKeyAlice;
                    this.currentItemId = 4;
                });

            }
            else if (items.length >= 4) {
                if (this.senderType === SenderType.Bob) {
                    runInAction(() => {
                        this.chatStatus = ChatInitializationStatus.PublicKeyStored;
                    });
                    return;
                }

                runInAction(() => {
                    this.status = ApplicationStatus.ChatReady;
                    this.currentItemId = 4;
                });
            }
        }
    }

    @action
    public endChatSession = async (): Promise<void> => {
        await this.sendMessage(this._encyEndSessionIdentifierString);
        runInAction(() => {
            this.messages = [];
            this.status = ApplicationStatus.Completed;
        });
    }

    @action
    public createList = async (): Promise<void> => {
        const listTitle = Guid.newGuid().toString();

        const listResponse = await sp.web.lists.add(listTitle, "Temp Document library used for exchanging encrypted messages", 101, true);

        await listResponse.list.fields.addMultilineText(this._encyvalFieldName, 10, false, false, false, false);
        await listResponse.list.fields.addText(this._encySenderTypeFieldName);

        // Add the first public key
        let pair = sjcl.ecc.elGamal.generateKeys(sjcl.ecc.curves.c256, 1);
        let pub = pair.pub.get();

        var public_key_hex = sjcl.codec.hex.fromBits(pub.x) + sjcl.codec.hex.fromBits(pub.y);

        const item = await listResponse.list.rootFolder.files.add(Guid.newGuid().toString(), "x");

        await (await item.file.getItem()).update(<IMessageUpdateInfo>{
            encyval: public_key_hex
        });

        const chatId = listResponse.data.Id;
        this._onCreateListSubscription(chatId);

        runInAction(() => {
            this.status = ApplicationStatus.WaitingForParty;
            this.chatStatus = ChatInitializationStatus.WaitingForPubKey;
            this.configListTitle = chatId;
            this.pub = pair.pub;
            this.secret = pair.sec;
        });
    }

    @action
    public sendMessage = async (message: string) => {
        const list = sp.web.lists.getById(this.configListTitle);
        const messageObj: IMessage = {
            created: new Date(),
            from: this.currentUsersDisplayName,
            fromType: this.senderType,
            message: message
        };

        const encMessage = sjcl.encrypt(this.pubEnc, JSON.stringify(<IMessageCreationInfo>{
            ...messageObj,
            created: messageObj.created.toISOString(),
        }));

        const encMessageJSON = JSON.stringify(encMessage);

        const msg = await list.rootFolder.files.add(Guid.newGuid().toString(), "x");

        await (await msg.file.getItem()).update(<IMessageUpdateInfo>{
            encyval: encMessageJSON,
            encytype: this.senderType.toString()
        });

        runInAction(() => {
            this.messages.push(messageObj);
        });
    }

}