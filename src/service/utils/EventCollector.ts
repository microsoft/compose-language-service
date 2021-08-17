/*!--------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CancellationToken, Disposable, HandlerResult, ResultProgressReporter, ServerRequestHandler, WorkDoneProgressReporter } from 'vscode-languageserver'

/**
 * Allows multiplexing one LSP event to multiple event handlers.
 * Necessary due to https://github.com/microsoft/vscode-languageserver-node/issues/174
 */
export class CollectorEmitter<P, R extends Array<unknown>, PR, E> implements Disposable {
    private readonly subscribers: ServerRequestHandler<P, R, PR, E>[] = [];

    public dispose(): void {
        this.emitter.dispose();
    }

    public async fire(params: P, token: CancellationToken, workDoneProgress: WorkDoneProgressReporter, resultProgress?: ResultProgressReporter<PR>): HandlerResult<R, E> {
        return await Promise.all(
            this.subscribers.map(s => s(p, token, workDoneProgress, resultProgress))
        )
    }

    public subscribe(handler: ServerRequestHandler<P, R, PR, E>): Disposable {
        this.subscribers.push(handler);

        return undefined; // TODO
    }
}
