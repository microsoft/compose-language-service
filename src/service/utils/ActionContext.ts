/*!--------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as async from 'async_hooks';
import { Connection } from 'vscode-languageserver';
import { ComposeLanguageClientCapabilities } from '../../client/DocumentSettings';
import { TelemetryEvent } from '../../client/TelemetryEvent';

export const als = new async.AsyncLocalStorage<ActionContext>();

export interface ActionContext {
    clientCapabilities: ComposeLanguageClientCapabilities;
    connection: Connection;
    telemetry: TelemetryEvent;
}
