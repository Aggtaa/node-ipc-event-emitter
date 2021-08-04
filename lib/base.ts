import { EventEmitter as EE } from 'events';
import nodeIpc from 'node-ipc';
import { Socket } from 'net';
import { isUndefined } from 'util';

export type LoggerCallback = (message: string) => void;

export interface Options {
    socketPath: string;
    retry: number;
    verbose: boolean;
    logger: LoggerCallback;
    maxListeners: number;
}

export interface Instance {
    
        id: string;

        start(): Promise<void>;
        stop(): void;

        on(event: 'open' | 'close', callback: () => void): this;

        on(event: 'message', callback: (topic: string, message: unknown, from: string) => void): this;
        on(event: 'message.promiscious', callback: (topic: string, message: unknown, from: string, to: string) => void): this;

        off(event: string, callback: (...args: any[]) => any): this;

        emit(message: unknown): this;

        emit(message: unknown, topic: string, sticky: boolean): this;

        emitTo(recipientId: string, message: unknown, topic?: string): this;
}

export interface Message {
    topic?: string;
    message: unknown;
    sender: string;
    recipient: string;
    sticky?: boolean;
}

// fix for broken node-ipc definitions
export type NodeIPCSendMethod = ((event: 'message', value: Message) => void);
export type NodeIPCSendToMethod = ((socket: Socket, event: 'message', value: Message) => void);

export interface NodeIPCInstance {
    on(event: string, callback: (...args: any[]) => void): void;
}

export type NodeIPCClient = NodeIPCInstance & { 
    emit: NodeIPCSendMethod;
}

export type NodeIPCServer = NodeIPCInstance & { 
    start: () => void;
    stop: () => void;
    emit: NodeIPCSendToMethod;
    broadcast: NodeIPCSendMethod;
}

export interface NodeIPC { 
    config: { [x: string]: unknown },

    serve(path: string, callback?: () => void): void;
    connectTo(id: string, path?: string, callback?: () => void): void;
    disconnect(id: string): void;

    server: NodeIPCServer;
    of: { server: NodeIPCClient },
}

export abstract class AbstractInstance<TOptions extends Options> implements Instance {

        readonly id: string;

        readonly options: TOptions;
        protected ipc: NodeIPC;
        protected ee: EE = new EE();

        constructor(id: string, options?: Partial<TOptions>) {

            this.id = id;

            this.options = {
                ...{
                    socketPath: '/var/run/node-ipc-event-emitter',
                    retry: 1500,
                    verbose: false,
                    logger: this.defaultLogger,
                    maxListeners: 0,
                } as TOptions,

                ...(options || {})
            };

            if (!isUndefined(this.options.maxListeners))
                this.ee.setMaxListeners(this.options.maxListeners);
    
            this.ipc = new nodeIpc.IPC() as unknown as NodeIPC;
            this.ipc.config.id = process.pid.toString();
            this.ipc.config.retry = this.options.retry;
            this.ipc.config.rawBuffer = false;
            this.ipc.config.silent = !this.options.verbose;
            this.ipc.config.logger = this.log;
            this.ipc.config.logInColor = false;
            this.ipc.config.logDepth = 0;
            // this.ipc.config.maxRetries = false;
        }

        private defaultLogger = (message: string): void => {
            console.log(`IPC ${this.id}: ${message}`);
        }

        log = (message: string): void => {
            if (this.options.logger)
                this.options.logger(message);
        }

        abstract start(): Promise<void>;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        on(event: string, callback: (...args: any[]) => void): this {
            this.ee.on(event, callback);
            return this;
        }

        off(event: string, callback: (...args: any[]) => any): this {
            this.ee.off(event, callback);
            return this;
        }

        abstract emit(message: unknown): this;

        abstract emit(message: unknown, topic: string, sticky: boolean): this;

        abstract emitTo(recipientId: string, message: unknown): this;

        abstract stop(): void;

}
