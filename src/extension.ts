// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { handleClick } from './utils';
import { MenuService } from './service';
import { MenuDataProvider } from './provider';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "easynotes" is now active!');

	const svc = new MenuService;
	vscode.window.registerTreeDataProvider('view.easynotes', new MenuDataProvider(svc));

	let syncfile = vscode.commands.registerCommand("easynotes.click", (content) => {
		// vscode.window.showInformationMessage(content);
		let folder = vscode.workspace.workspaceFolders;
		handleClick(content, folder);
	});
	
	context.subscriptions.push(syncfile);
}

// this method is called when your extension is deactivated
export function deactivate() {}
