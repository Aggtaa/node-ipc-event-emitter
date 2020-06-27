import { isNullOrUndefined } from 'util';
import crypro from 'crypto';

import { Options, AbstractInstance, Message } from './base';

export class Client extends AbstractInstance {

    constructor(id?: string, options?: Partial<Options>) {
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
                this.ipc.of['server'].on('message', (data: Message) => {
                    if (data &&
                            !isNullOrUndefined(data.message) &&
                            !isNullOrUndefined(data.sender) &&
                            !isNullOrUndefined(data.recipient)
                    ) {
                        this.log(`message from server: ${JSON.stringify(data.message)}`);
                        if (data.sender !== this.id)
                            if (data.recipient === this.id || data.recipient === '$all')
                                this.ee.emit('message', data.topic, data.message, data.sender);
                            else
                                this.ee.emit('message.promiscious', data.topic, data.message, data.sender, data.recipient);

                    }
                });

                res();
            });
        });
    }
    stop(): void {
        this.ipc.disconnect(this.id);
    }

    emit(message: unknown, topic?: string, sticky: boolean = false): this {
        return this.emitTo('$all', message, topic, sticky);
    }

    emitTo(recipientId: string, message: unknown, topic?: string, sticky: boolean = false): this {
        this.log(`emitting ${JSON.stringify(message)} to topic "${topic}"` + (sticky ? ' (sticky)' : '') + ` to ${recipientId}`);
        this.ipc.of.server.emit('message', { topic, message, sender: this.id, recipient: recipientId, sticky });
        return this;
    }

}
