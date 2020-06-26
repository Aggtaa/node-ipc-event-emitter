import { isNullOrUndefined } from 'util';
import crypro from 'crypto';

import { IpcEventEmitterOptions, EventEmitter } from './base';

export class Client extends EventEmitter {

    constructor(id?: string, options?: IpcEventEmitterOptions) {
        if (isNullOrUndefined(id))
            id = crypro.randomBytes(4).toString('hex');

        super(id, options);
    }

    start(): Promise<void> {

        return new Promise((res) => {
            this.ipc.connectTo('server', this.options.socketPath, () => {
                this.ipc.of['server'].on('connect', () => {
                    this.log('connected to server');
                    this.emitTo('server', '$hello');
                    this.ee.emit('open');
                });
                this.ipc.of['server'].on('disconnect', () => {
                    this.log('disconnected from server');
                    this.ee.emit('close');
                });
                this.ipc.of['server'].on('message', (data) => {
                    if (data &&
                            !isNullOrUndefined(data.message) &&
                            !isNullOrUndefined(data.sender) &&
                            !isNullOrUndefined(data.recipient)
                    ) {
                        this.log(`message from server: ${data.message}`);
                        if (data.sender !== this.id)
                            if (data.recipient === this.id || data.recipient === '$all')
                                this.ee.emit('message', data.message, data.sender);
                            else
                                this.ee.emit('message.promiscious', data.message, data.sender, data.recipient);

                    }
                });

                res();
            });
        });
    }

    emit(message: unknown): this {
        this.log(`emitting ${message}`);
        return this.emitTo('$all', message);
    }

    emitTo(recipientId: string, message: unknown): this {
        this.log(`emitting ${message} to ${recipientId}`);
        this.ipc.of.server.emit('message', { message, sender: this.id, recipient: recipientId });
        return this;
    }

}
