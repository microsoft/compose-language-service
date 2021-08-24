/*!--------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CancellationToken, ResultProgressReporter, WorkDoneProgressReporter } from 'vscode-languageserver';
import { ExtendedPositionParams } from '../ExtendedParams';
import { ExtendedPosition } from '../ExtendedPosition';
import { ProviderBase } from './ProviderBase';

export abstract class MultiProviderBase<P extends ExtendedPositionParams, R, PR> extends ProviderBase {
    protected readonly subproviders: SubproviderBase<P, R, PR>[] = [];

    public register(subprovider: SubproviderBase<P, R, PR>): void {
        this.subproviders.push(subprovider);
    }

    public async on(params: P, token: CancellationToken, workDoneProgress: WorkDoneProgressReporter, resultProgress?: ResultProgressReporter<PR>): Promise<R | undefined> {
        params.extendedPosition = ExtendedPosition.build(params.document, params.position);
        const subpromises = this.subproviders.map(s => s.on(params, token, workDoneProgress, resultProgress));

        const subresults = await Promise.all(subpromises);

        return this.reduce(subresults);
    }

    protected abstract reduce(subresults: (R | undefined)[]): R | undefined;
}

export interface SubproviderBase<P, R, PR> {
    on: (params: P, token: CancellationToken, workDoneProgress: WorkDoneProgressReporter, resultProgress?: ResultProgressReporter<PR>) => Promise<R>;
}
