/*!--------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ErrorCodes, ResponseError } from 'vscode-languageserver';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { CST, Document as YamlDocument, Parser, Composer, isDocument } from 'yaml';

export class CachedDocument {
    private constructor(
        public readonly textDocument: TextDocument,
        public readonly cst: CST.Document,
        public readonly yamlDocument: YamlDocument,
    ) { }

    public static create(textDocument: TextDocument): CachedDocument {
        const tokens = new Parser().parse(textDocument.getText());
        const [cstDocument] = tokens;
        const composedTokens = new Composer().compose([cstDocument]);
        const [parsedDocument] = composedTokens;

        if (cstDocument.type !== 'document') {
            throw new ResponseError(ErrorCodes.ParseError, 'Malformed YAML document');
        }

        if (!isDocument(parsedDocument)) {
            throw new ResponseError(ErrorCodes.ParseError, 'Malformed YAML document');
        }

        return new CachedDocument(textDocument, cstDocument, parsedDocument);
    }
}
