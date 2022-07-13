import { MenuTreeItem } from "./api";

export class MenuService{
    private items: MenuTreeItem[] = [];
    getMenuList():Array<MenuTreeItem>{
        this.items.push(new MenuTreeItem({
            menuId: "0",
            label: "create",
            tooltip: "create a webdav config file in current workspace"
        }));
        this.items.push(new MenuTreeItem({
            menuId: "1",
            label: "push",
            tooltip: "push file to remote webdav",
        }));
        this.items.push(new MenuTreeItem({
            menuId: "2",
            label: "pull",
            tooltip: "pull file from remote webdav",
        }));
        return this.items;
    }
}