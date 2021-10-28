/*!--------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CancellationToken, CompletionItem, CompletionParams, WorkDoneProgressReporter } from 'vscode-languageserver';
import { ExtendedCompletionParams, ExtendedParams, ExtendedPositionParams } from '../../ExtendedParams';
import { getCurrentContext } from '../../utils/ActionContext';
import { ProviderBase } from '../ProviderBase';
import { CompletionCollection } from './CompletionCollection';
import { RootCompletionCollection } from './RootCompletionCollection';
import { ServiceCompletionCollection } from './ServiceCompletionCollection';
import { VolumesCompletionCollection } from './VolumesCompletionCollection';

/**
 * Completions are one of the more involved features so we will split up the code, with this multi-provider calling each of them
 * Most will no-op but the results will all be aggregated upon return
 * Importantly, if any fail, we will throw an error--all other results will be ignored
 */
export class MultiCompletionProvider extends ProviderBase<CompletionParams & ExtendedParams, CompletionItem[] | undefined, never, never> {
    private readonly completionCollections: CompletionCollection[];

    public constructor() {
        super();

        this.completionCollections = [
            RootCompletionCollection,
            ServiceCompletionCollection,
            VolumesCompletionCollection,
        ];
    }

    public override async on(params: CompletionParams & ExtendedPositionParams, token: CancellationToken, workDoneProgress: WorkDoneProgressReporter): Promise<CompletionItem[] | undefined> {
        const ctx = getCurrentContext();

        const extendedParams: ExtendedCompletionParams = {
            ...params,
            positionInfo: await params.document.getPositionInfo(params),
        };

        const results: CompletionItem[] = [];

        for (const collection of this.completionCollections) {
            // Within each loop we'll check for cancellation
            if (token.isCancellationRequested) {
                return undefined;
            }

            const subresults = collection.getActiveCompletionItems(extendedParams);

            if (subresults?.length) {
                ctx.telemetry.keys.push(collection.name); // The set of collection(s) that answer will be part of an aggregated event group, *and* attached as a property (below)
                results.push(...subresults);
            }

            // The set of collection(s) that answer will be attached as a property
            ctx.telemetry.properties.collectionsWithResults = ctx.telemetry.keys.sort().join(',');
        }

        return results.length > 0 ? results : undefined;
    }
}
