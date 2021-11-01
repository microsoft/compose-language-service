/*!--------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { default as Ajv, ValidateFunction } from 'ajv';
import * as fs from 'fs';
import { Diagnostic, DiagnosticSeverity, Range, TextDocumentChangeEvent } from 'vscode-languageserver';
import { ComposeDocument } from '../ComposeDocument';
import { ExtendedParams } from '../ExtendedParams';
import { getCurrentContext } from '../utils/ActionContext';
import { debounce } from '../utils/debounce';
import { yamlRangeToLspRange } from '../utils/yamlRangeToLspRange';
import { ProviderBase } from './ProviderBase';

// The time between when typing stops and when diagnostics will be sent (milliseconds)

const DiagnosticDelay = 1000;

export class DiagnosticProvider extends ProviderBase<TextDocumentChangeEvent<ComposeDocument> & ExtendedParams, void, never, never> {
    private readonly validate: ValidateFunction;
    public constructor() {
        super();

        const schema = JSON.parse(fs.readFileSync('./resources/compose-spec.json', 'utf-8'));
        const ajv = new Ajv({ allErrors: true });
        this.validate = ajv.compile(schema);
    }

    public on(params: TextDocumentChangeEvent<ComposeDocument> & ExtendedParams): void {
        const ctx = getCurrentContext();
        if (!ctx.clientCapabilities.textDocument?.publishDiagnostics) {
            return;
        }

        ctx.telemetry.suppressAll = true; // Diagnostics is async and telemetry won't really work

        debounce(DiagnosticDelay, { uri: params.document.textDocument.uri, callId: 'diagnostics' }, () => {
            const diagnostics: Diagnostic[] = this.getDiagnostics(params);

            ctx.connection.sendDiagnostics({
                uri: params.document.textDocument.uri,
                diagnostics: diagnostics,
            });
        }, this);
    }

    private getDiagnostics(params: ExtendedParams): Diagnostic[] {
        const results: Diagnostic[] = [];

        const syntaxErrors = [...params.document.yamlDocument.value.errors, ...params.document.yamlDocument.value.warnings];

        for (const error of syntaxErrors) {
            results.push(
                Diagnostic.create(
                    yamlRangeToLspRange(params.document.textDocument, error.pos),
                    error.message,
                    error.name === 'YAMLWarning' ? DiagnosticSeverity.Warning : DiagnosticSeverity.Error,
                    error.code,
                )
            );
        }

        if (results.length > 0) {
            // If there are syntax errors, we will not go on to check for schema errors
            return results;
        }

        if (!this.validate(params.document.yamlDocument.value.toJS())) {
            const schemaErrors = this.validate.errors ?? [];

            for (const error of schemaErrors) {
                results.push(
                    Diagnostic.create(
                        Range.create(0, 0, 0, 0), // TODO: compute the range? Is that even possible?
                        error.message ?? 'foo',
                        DiagnosticSeverity.Error,
                    )
                );
            }
        }

        return results;
    }
}
