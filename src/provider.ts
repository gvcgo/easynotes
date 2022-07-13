import { TreeDataProvider } from "vscode";
import { MenuTreeItem } from './api';
import { MenuService } from './service';

export class MenuDataProvider implements TreeDataProvider<MenuTreeItem> {
    private mService: MenuService;
    constructor(mService: MenuService) {
        this.mService = mService;
    }
    getTreeItem(item: MenuTreeItem){
        return item;
    }

    getParent(item: MenuTreeItem) {
        return null;
    }

    getChildren(item: MenuTreeItem) {
        return this.mService.getMenuList();
    }
}