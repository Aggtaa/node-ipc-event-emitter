import { isNullOrUndefined } from 'util';

import { IpcEventEmitterOptions, EventEmitter } from './base';

export class Server extends EventEmitter {

    private sockets = new Map<string, unknown>();

    constructor(options?: IpcEventEmitterOptions) {
        super('server', options);
    }

    start(): Promise<void> {

        return new Promise((res, rej) => {
            try {
                this.ipc.serve(this.options.socketPath, () => {

                    this.ee.emit('open');

                    this.ipc.server.on('message', (data, socket) => {
                        if (data &&
                            !isNullOrUndefined(data.message) &&
                            !isNullOrUndefined(data.sender) &&
                            !isNullOrUndefined(data.recipient)
                        ) {
                            this.log(`message ${JSON.stringify(data)} from ${data.sender}`);
                            if (data.message === '$hello') {
                                this.sockets.set(data.sender, socket);
                                this.log(`client ${data.sender} connected`);
                                this.ee.emit('client.connect', data.sender);
                            }
                            else {
                                this.ee.emit('message', data.message, data.sender, data.recipient);
                                if (data.recipient === '$all')
                                    this.emitFrom(data.message, data.sender);
                            }
                        }
                    });
                    this.ipc.server.on('connect', () => {
                        this.log('unknown client connected');
                        this.ee.emit('client.connect.raw');
                    });
                    this.ipc.server.on('socket.disconnected', (socket, id) => {
                        this.log(`client ${id} disconnected`);
                        this.ee.emit('client.disconnect', id);
                    });

                    this.ipc.server.on('destroy', () => {
                        this.ee.emit('close');
                    });

                    res();
                });

                this.ipc.server.start();
            }
            catch (err) {
                rej(err);
            }
        });
    }

    private emitFrom(message: unknown, sender: string): this {
        this.log(`re-emitting ${message} from ${sender}`);
        this.ipc.server['broadcast']('message', { message, sender, recipient: '$all' });
        return this;
    }

    emit(message: unknown): this {
        this.log(`emitting ${message}`);
        this.ipc.server['broadcast']('message', { message, sender: this.id, recipient: '$all' });
        return this;
    }

    emitTo(recipient: string, message: unknown): this {
        if (recipient === this.id) {
            this.log(`emitting ${message} to self`);
            this.ee.emit('message', message);
        }

        else {
            this.log(`emitting ${message} to ${recipient}`);
            const recipientSocket = this.sockets.get(recipient);
            this.ipc.server.emit(recipientSocket, 'message', { message, sender: this.id, recipient });
        }
        return this;
    }

}
