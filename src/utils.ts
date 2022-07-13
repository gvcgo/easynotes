import { ToolConfig } from './api';
import * as vscode from 'vscode';
import { SyncFiles } from './tools';
import fs = require("fs");
import path = require("path");

export class Config implements ToolConfig {
    public webdavUrl: string;
    public userName: string;
    public password: string;
    public localRoot: string;
    public remoteRoot: string;
    constructor(cnf: ToolConfig) {
        this.webdavUrl = cnf.webdavUrl;
        this.userName = cnf.userName;
        this.password = cnf.password;
        this.localRoot = cnf.localRoot;
        this.remoteRoot = cnf.remoteRoot;
    };
}

export function getConfigFileName() :string {
    return ".easynotes.conf";
}

export function generateConfig(workspaceFolders: any) {
    if (workspaceFolders) {
        let confDirPath = workspaceFolders[0]["uri"]["fsPath"];
        let confFilePath = path.join(confDirPath, getConfigFileName());
        const conf = {
            webdavUrl: "",
            userName: "",
            password: "",
            localRoot: confDirPath,
            remoteRoot: "", 
        };
        if (!fs.existsSync(confFilePath)){
            fs.writeFileSync(confFilePath, JSON.stringify(conf, null, 4));
            vscode.window.showInformationMessage("webdav config file successfully created!");
        } else {
            vscode.window.showInformationMessage("a config file already exists!");
        };
    } else {
        vscode.window.showInformationMessage("please open a workspace!");
    };
};

export function loadConfigFile(workspaceFolders: any) :Config {
    if (workspaceFolders) {
        for (let folder of workspaceFolders) {
            const dirPath: string = folder["uri"]["fsPath"];
            const filePath: string = path.join(dirPath, getConfigFileName());
            if (fs.existsSync(filePath)) {
                let cnfString = fs.readFileSync(filePath);
                return new Config(JSON.parse(cnfString.toString()));
            };
        };
    };
    return new Config({
        webdavUrl: "",
        userName: "",
        password: "",
        localRoot: "",
        remoteRoot: "", 
    });
};

function pushNoteFiles(conf: ToolConfig) {
    let cnf = new SyncFiles(conf);
    cnf.createRootDir();
    cnf.isVersionExists();
    cnf.createVersion(true);
    cnf.pushWalkDirs(conf.localRoot);
    cnf.deleteRemoteFiles(conf.remoteRoot);
    vscode.window.showInformationMessage("push file completed!"); 
};

function pullhNoteFiles(conf: ToolConfig) {
    let cnf = new SyncFiles(conf);
    cnf.pullWalkDirs(conf.remoteRoot);
    cnf.deleteLocalFiles(conf.localRoot);
    vscode.window.showInformationMessage("pull file completed!");
};

export function handleClick(content: string, workspaceFolders: any) {
    if (content === "create") {
        generateConfig(workspaceFolders);
        return;
    };
    const conf = loadConfigFile(workspaceFolders);
    if (!(conf.webdavUrl && conf.userName && conf.password && conf.localRoot && conf.remoteRoot)) {
        vscode.window.showInformationMessage("please check you config file!");
        return;
    }
    if (content === "push") {
        pushNoteFiles(conf);
    } else if (content === "pull") {
        pullhNoteFiles(conf);
    } else {
        vscode.window.showInformationMessage("unknown operations!");
    };
};
