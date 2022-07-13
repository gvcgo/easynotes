---------------------------
## EasyNotes Introduction
---------------------------
EasyNotes is a vscode plugin for storing your local notes files to remote webdav server more conveniently!
It will automatically walk through the local folder defined in config file.
EasyNotes能将本地的笔记(理论上所有文本类型)文件上传到配置好的webdav服务或网盘(如坚果云等)，支持目录的自动遍历上传。同时支持从webdav服务同步文件到本地，支持文件修改对比等。

---------------------------
## EasyNotes Usage
---------------------------

### create
---------------------------
create a config file in current workspace;
在当前workspace中创建一个配置文件，用于配置webdav以及文件夹等相关信息；

---------------------------
### push
---------------------------
push you note files to the remote webdav server;
将本地文件夹推送到wedav服务；

---------------------------
### pull
---------------------------
pull remote files to local folder;
从webdav服务拉取文件夹内容；

---------------------------
### Config Items For Example
---------------------------
典型的配置文件内容如下：
- "webdavUrl": "https://dav.jianguoyun.com/dav/"
- "userName": "***"
- "password": "***"
- "localRoot": "e:\\project\\js\\test\\mynote"
- "remoteRoot": "/mynote"