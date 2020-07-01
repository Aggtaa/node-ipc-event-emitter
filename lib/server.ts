import { isNullOrUndefined, isUndefined } from 'util';

import { Options, AbstractInstance, Message } from './base';
import { Socket } from 'net';

export class Server extends AbstractInstance<Options> {

    private sockets = new Map<string, Socket>();
    private stickyTopics = new Map<string, unknown>();

    constructor(options?: Partial<Options>) {
        super('server', options);
    }

    start(): Promise<void> {

        return new Promise((res, rej) => {
            try {
                this.ipc.serve(this.options.socketPath || '', () => {

                    this.ee.emit('open');

                    this.ipc.server.on('message', (data: Message, socket: Socket) => {
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
                                this.emitStickyTopics(data.sender);
                            }
                            else {
                                this.ee.emit('message', data.topic, data.message, data.sender, data.recipient);
                                if (data.recipient === '$all')
                                    this.emit(data.message, data.topic, data.sticky, data.sender);
                            }
                        }
                    });
                    this.ipc.server.on('connect', () => {
                        this.log('unknown client connected');
                        this.ee.emit('client.connect.raw');
                    });
                    this.ipc.server.on('socket.disconnected', (socket: Socket) => {
                        const idAndSocket = Array.from(this.sockets.entries()).find(([, s]) => s === socket);
                        if (isUndefined(idAndSocket)) {
                            this.log(`unknown client disconnected. this is an error situation`);
                            this.ee.emit('client.disconnect', undefined);
                        }
                        else {
                            this.log(`client ${idAndSocket[0]} disconnected`);
                            this.ee.emit('client.disconnect', idAndSocket[0]);
                        }
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

    stop(): void {
        this.ipc.server.stop();
    }

    emit(message: unknown, topic?: string, sticky: boolean = false, onBehalfOf: string = this.id): this {
        if (onBehalfOf !== this.id)
            this.log(`re-emitting ${JSON.stringify(message)} to topic "${topic}"` + (sticky ? ' (sticky)' : '') + ` from ${onBehalfOf}`);
        else
            this.log(`emitting ${JSON.stringify(message)} to topic "${topic}"` + (sticky ? ' (sticky)' : ''));
        if (!isUndefined(topic)) {
            if (sticky)
                this.stickyTopics.set(topic, message)
            if (isUndefined(message))
                this.stickyTopics.delete(topic);
        }
        this.ipc.server['broadcast']('message', { topic, message, sender: onBehalfOf, recipient: '$all' });
        return this;
    }

    emitTo(recipient: string, message: unknown, topic?: string): this {
        if (recipient === this.id) {
            this.log(`emitting ${JSON.stringify(message)} to self`);
            this.ee.emit('message', message);
        }
        else {
            this.log(`emitting ${JSON.stringify(message)} to ${recipient}`);
            const recipientSocket = this.sockets.get(recipient);
            if (!isUndefined(recipientSocket))
                this.ipc.server.emit(recipientSocket, 'message', { topic, message, sender: this.id, recipient });
        }
        return this;
    }

    private emitStickyTopics(to: string) {
        new Map(this.stickyTopics).forEach((message, topic) => 
            this.emitTo(to, message, topic)
        );
    }

}
