'use strict';
const electron = require('electron');
const util = require('./util');

const {ipcRenderer: ipc} = electron;

ipc.callMain = (channel, data) => new Promise((resolve, reject) => {
	const {sendChannel, dataChannel, errorChannel} = util.getResponseChannels(channel);

	const cleanup = () => {
		ipc.removeAllListeners(dataChannel);
		ipc.removeAllListeners(errorChannel);
	};

	ipc.on(dataChannel, (event, result) => {
		cleanup();
		resolve(result);
	});

	ipc.on(errorChannel, (event, error) => {
		cleanup();
		reject(error);
	});

	ipc.send(sendChannel, data);
});

ipc.callHost = (channel, data) => new Promise((resolve, reject) => {
	const {sendChannel, dataChannel, errorChannel} = util.getResponseChannels(channel);

	const cleanup = () => {
		ipc.removeAllListeners(dataChannel);
		ipc.removeAllListeners(errorChannel);
	};

	ipc.on(dataChannel, (event, result) => {
		cleanup();
		resolve(result);
	});

	ipc.on(errorChannel, (event, error) => {
		cleanup();
		reject(error);
	});

	ipc.sendToHost(sendChannel, data);
});

ipc.answerHostedRenderer = (channel, callback) => {
	const {sendChannel, dataChannel, errorChannel} = util.getResponseChannels(channel);

	ipc.on(sendChannel, async (event, data) => {
		const send = (channel, data) => {
			event.sender.send(channel, data);
		};

		try {
			send(dataChannel, await callback(data));
		} catch (error) {
			send(errorChannel, error);
		}
	});
};

ipc.answerMain = (channel, callback) => {
	const window = electron.remote.getCurrentWindow();
	const {sendChannel, dataChannel, errorChannel} = util.getRendererResponseChannels(window.id, channel);

	ipc.on(sendChannel, async (event, data) => {
		try {
			ipc.send(dataChannel, await callback(data));
		} catch (err) {
			ipc.send(errorChannel, err);
		}
	});
};

module.exports = ipc;
