import webdav = require('webdav');
import { ToolConfig } from './api';
import * as vscode from 'vscode';
import path = require('path');
import fs = require('fs');
import rimraf = require('rimraf');

export class SyncFiles{
    private webdavUrl: string;
    private userName:string;
    private password:string;
    private localRoot:string;
    private remoteRoot:string;
    private versionFileName:string;
    private configureFileName: string;
    private localVersionPath:string;
    private remoteVersionPath:string;
    private client: webdav.WebDAVClient;
    private isRemoteVersionExist:any;
    private isLocalVersionExist:any;
    constructor(config: ToolConfig){
        this.webdavUrl = config.webdavUrl;
        this.userName = config.userName;
        this.password = config.password;
        this.localRoot = path.resolve(config.localRoot);
        this.remoteRoot = config.remoteRoot;
        this.versionFileName = "version.info.txt";
        this.configureFileName = ".easynotes.conf";
        this.localVersionPath = path.join(this.localRoot, this.versionFileName);
        this.remoteVersionPath = path.join(this.remoteRoot, this.versionFileName);
        this.client = webdav.createClient(this.webdavUrl, {
            authType: webdav.AuthType.Password,
            username: this.userName,
            password: this.password,
        });
        
    }

   public async createRootDir() :Promise<void> {
        if (!(await this.client.exists(this.remoteRoot))) {
            await this.client.createDirectory(this.remoteRoot);
        }
   };

   public async isVersionExists(): Promise<void> {
        this.isRemoteVersionExist = await this.client.exists(this.remoteVersionPath);
        this.isLocalVersionExist = fs.existsSync(this.localVersionPath);
   };
   
   public writeVersion() :void {
        fs.writeFile(this.localVersionPath, Date.now().toString(), function (err){
            if (err) {
                console.log(err);
                return false;
            };
        }); 
    };

    public createVersion(updateLocal: boolean): void {
        if (updateLocal) {
            this.writeVersion();
            return;
        }
        if (!this.isRemoteVersionExist && !this.isLocalVersionExist) {
            this.writeVersion();
        };
    };

    public async checkNewVersion() :Promise<string> {
        const remoteVersion = this.isRemoteVersionExist? await this.client.getFileContents(this.remoteVersionPath, {format: 'text'}): "0";
        const localVersion = this.isLocalVersionExist ? fs.readFileSync(this.localVersionPath).toString() : "0";
        console.log("remoteVersion: " + remoteVersion + " localVersion: " + localVersion);
        const result = (Number(remoteVersion) - Number(localVersion)) >= 120000 ? "remote" : "local";
        return result; 
    }

    public async getLatestModifiedTime(filePath: string, remoteFilePath: string): Promise<string> {
        var localFileMTime: number = Date.parse(fs.statSync(filePath).mtime.toString());
        const contents: any = await this.client.getDirectoryContents(path.dirname(remoteFilePath));
        const fileName = path.basename(remoteFilePath); 
        for (let file of contents) {
            if (file.basename === fileName) {
                let remoteFileMTime: number = Date.parse(file.lastmod);
                if (remoteFileMTime <= localFileMTime) { 
                    return "local";
                } else {
                    return "remote";
                }
            }
        };
        return "local";
    }

    public async pushFile(filePath: string, remoteFilePath: string): Promise<void> {
        const data = fs.readFileSync(filePath);
        await this.client.putFileContents((remoteFilePath.split('\\').join("/")), data);
    };

    public async deleteRemoteFiles(remotePath: string): Promise<void> {
        const contents: any = await this.client.getDirectoryContents(remotePath);
        for (const remoteFile of contents) {
            const fileName = remoteFile.filename.split(this.remoteRoot)[1];
            const localFile = path.join(this.localRoot, fileName);
            if (!fs.existsSync(localFile) && remoteFile.basename !== this.versionFileName) {
                await this.client.deleteFile(remoteFile.filename);
                if (remoteFile.type === 'directory') {
                    continue;
                };
            };
            if (fs.existsSync(localFile) && remoteFile.type === 'directory' && (await this.checkNewVersion() === "local")) {
                await this.deleteRemoteFiles(remoteFile.filename);
            };
        }; 
    };
    
    public async pushWalkDirs(currentDir: string) {
        const contents = fs.readdirSync(currentDir, {withFileTypes: true});
        for (const dirent of contents) {
            var filePath = path.join(currentDir, dirent.name); 
            const remoteFilePath = path.join(this.remoteRoot, filePath.split(this.localRoot)[1]).split("\\").join("/");
            const isExisted = await this.client.exists(remoteFilePath);
            const isFile = dirent.isFile();
            const isDir = dirent.isDirectory();
            if (isDir) {
                if (!isExisted) {
                    await this.client.createDirectory(remoteFilePath);
                };
                await this.pushWalkDirs(filePath);
            } else if (isFile && dirent.name !== this.configureFileName) {
                if (!isExisted) {
                    console.log("upload files");
                    await this.pushFile(filePath, remoteFilePath);
                } else {
                    if ((await this.getLatestModifiedTime(filePath, remoteFilePath)) === "local") {
                        // console.log("---update: " + remoteFilePath);
                        if (await this.checkNewVersion() === "local") {
                            await this.pushFile(filePath, remoteFilePath);
                        } else {
                            vscode.window.showInformationMessage("PushFile: " + filePath + " maybe conflict with remote file: " + remoteFilePath + "!");
                        };
                    };
                };
            };
        };
    };

    public async pullFileToLocal(filePath: string, remoteFilePath: string): Promise<void> {
        const data: any = await this.client.getFileContents(remoteFilePath.split("\\").join("/"), {format: "text"});
        fs.writeFile(filePath, data, function(error){
            if (error) {
                console.log(error);
                return false;
            };
        }); 
    };

    public async deleteLocalFiles(currentDir: string): Promise<void> {
        const localFiles = fs.readdirSync(currentDir, {withFileTypes: true});
        for (const dirent of localFiles) {
            var filePath = path.join(currentDir, dirent.name); 
            const remoteFilePath = path.join(this.remoteRoot, filePath.split(this.localRoot)[1]).split("\\").join("/");
            const isExisted = await this.client.exists(remoteFilePath);
            const isFile = dirent.isFile();
            const isDir = dirent.isDirectory();
            if (!isExisted) {
                if (isDir) {
                    rimraf(filePath, function(error){
                        if (error) {
                            console.log(error);
                            return false;
                        };
                    });
                    continue;
                };
                if (isFile && dirent.name !== this.versionFileName && dirent.name !== this.configureFileName && (await this.checkNewVersion() === "remote")) {
                    fs.unlink(filePath, function(error){
                        if (error) {
                            console.log(error);
                            return false;
                        };
                    });
                };
            }
            if (isDir) {
                await this.deleteLocalFiles(filePath);
            };
        }; 
    };
    
    public async pullWalkDirs(remoteCurrentDir: string): Promise<void> {
        const contents: any = await this.client.getDirectoryContents(remoteCurrentDir);
        for (const file of contents) {
            const remoteFilePath = file.filename;
            const filePath = path.join(this.localRoot, remoteFilePath.split(this.remoteRoot)[1]);
            const fileType = file.type;
            const isExisted = fs.existsSync(filePath);
            if (fileType === "directory") {
                if (!isExisted) {
                    fs.mkdir(filePath, function(error){
                        if (error) {
                            console.log(error);
                            return false;
                        };
                    });
                };
                await this.pullWalkDirs(remoteFilePath);
            } else if (fileType === "file") {
                if (!isExisted) {
                    await this.pullFileToLocal(remoteFilePath, filePath);
                } else {
                    if ((await this.getLatestModifiedTime(filePath, remoteFilePath)) === "remote") {
                        // console.log("---update: " + remoteFilePath);
                        if (await this.checkNewVersion() === "remote") {
                            await this.pullFileToLocal(remoteFilePath, filePath);
                        } else {
                            vscode.window.showInformationMessage("PullFile: " + filePath + " maybe conflict with remote file: " + remoteFilePath + "!");
                        };
                    };
                };
            };
        }; 
    };
};

