/*!--------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Disposable, Emitter, ServerRequestHandler } from 'vscode-languageserver'

/**
 * Allows multiplexing one LSP event to multiple event handlers.
 * Necessary due to https://github.com/microsoft/vscode-languageserver-node/issues/174
 */
export class EventCollector<P, R, PR, E> implements ServerRequestHandler<P, R, PR, E>, Disposable {
    private readonly emitter = new Emitter<ServerRequestHandler<P, R, PR, E>>(
        {
            onLastListenerRemove: () => this.dispose()
        }
    );

    public dispose(): void {
        this.emitter.dispose();
    }

    public onEvent = this.emitter.event;

    public fire(params: P): R {
        this.emitter.fire(params);
    }
}
