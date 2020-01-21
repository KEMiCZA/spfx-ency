import { action } from "mobx";
import { RootStore } from "./RootStore";

export class ConfigStore {
    constructor(private rootStore: RootStore) {
    }
}