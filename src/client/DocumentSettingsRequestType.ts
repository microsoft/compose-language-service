/*!--------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ProtocolRequestType } from 'vscode-languageserver-protocol';
import { DocumentSettings } from './DocumentSettings';
import { DocumentSettingsParams } from './DocumentSettingsParams';

export const DocumentSettingsRequestType = new ProtocolRequestType<DocumentSettingsParams, DocumentSettings, never, void, never>('$/documentSettings');
