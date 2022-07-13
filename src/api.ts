import { TreeItem, TreeItemCollapsibleState } from "vscode";

export interface Menu{
    menuId: string;
    label: string;
    tooltip: string;
}

export interface ToolConfig{
    webdavUrl: string;
    userName:string;
    password:string;
    localRoot:string;
    remoteRoot:string;
}

export class MenuTreeItem extends TreeItem{
    constructor(info: Menu){
        super("", TreeItemCollapsibleState.None);
        this.id = info.menuId;
        this.label = info.label;
        this.description = "";
        this.tooltip = info.tooltip;
        this.command = {
            title: "点击",
            command: "easynotes.click",
            arguments: [info.label],
        };
    }
}