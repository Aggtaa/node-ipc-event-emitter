import { EventEmitter as EE } from 'events';
import nodeIpc from 'node-ipc';

export interface IpcEventEmitterOptions {
    socketPath?: string;
    retry?: number;
    silent?: boolean;
}

export interface Instance {

        start(): Promise<void>;

        on(event: 'open' | 'close', callback: () => void): this;

        on(event: 'message', callback: (message: unknown, from: string) => void): this;
        on(event: 'message.promiscious', callback: (message: unknown, from: string, to: string) => void): this;

        emit(message: unknown): this;

        emitTo(recipientId: string, message: unknown): this;
    }

export abstract class EventEmitter implements Instance {

        protected id: string;
        protected options: IpcEventEmitterOptions;
        protected ipc;
        protected ee: EE = new EE();

        constructor(id: string, options: IpcEventEmitterOptions) {

            this.id = id;

            this.options = {
                socketPath: '/var/run/node-ipc-event-emitter',
                retry: 1500,
                silent: true,

                ...options,
            };

            this.ipc = new nodeIpc.IPC();
            this.ipc.config.id = process.pid.toString();
            this.ipc.config.retry = this.options.retry;
            this.ipc.config.rawBuffer = false;
            this.ipc.config.silent = this.options.silent;
            this.ipc.config.logger = this.nodeIpcLogger;
            this.ipc.config.logInColor = false;
            this.ipc.config.logDepth = 0;
            this.ipc.config.maxRetries = false;
        }

        private nodeIpcLogger(msg: string): void {
            this.log(msg);
        }

        abstract start(): Promise<void>;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        on(event: string, callback: (...args: any[]) => void): this {
            this.ee.on(event, callback);
            return this;
        }

        abstract emit(message: unknown): this;

        abstract emitTo(recipientId: string, message: unknown): this;

        log(message): void {
            console.log(`IPC ${this.id}: ${message}`);
        }

}
