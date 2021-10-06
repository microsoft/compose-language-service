/*!--------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ErrorCodes, Position, Range, ResponseError, TextDocumentIdentifier, TextDocumentsConfiguration } from 'vscode-languageserver';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { CST, Document as YamlDocument, Parser, Composer, isDocument } from 'yaml';
import { CRLF, DocumentSettings, DocumentSettingsRequest, LF } from '../client/DocumentSettings';
import { ExtendedParams, ExtendedPositionParams, PositionInfo } from './ExtendedParams';
import { Lazy } from './utils/Lazy';

const EmptyDocumentCST: CST.Document = {
    type: 'document',
    offset: 0,
    start: [],
};

// The stated behavior of character number in the `Position` class is to roll back to line length if it exceeds the line length. So, this will work for any line <1m characters. That should cover most of them.
const MaximumLineLength = 1000 * 1000;

export class ComposeDocument {
    public readonly fullCst = new Lazy(() => this.buildFullCst());
    public readonly documentCst = new Lazy(() => this.buildDocumentCst());
    public readonly yamlDocument = new Lazy(() => this.buildYamlDocument());

    private documentSettings: DocumentSettings | undefined;

    /* private */ #textDocument: TextDocument;
    public get textDocument(): TextDocument {
        return this.#textDocument;
    }

    public get id(): TextDocumentIdentifier {
        return {
            uri: this.textDocument.uri,
        };
    }

    private constructor(doc: TextDocument) {
        this.#textDocument = doc;
    }

    private update(doc: TextDocument): ComposeDocument {
        this.#textDocument = doc;
        this.yamlDocument.clear();
        this.documentCst.clear();
        this.fullCst.clear();

        return this;
    }

    public lineAt(line: Position | number): string {
        // Flatten to a position at the start of the line
        const startOfLine = (typeof line === 'number') ? Position.create(line, 0) : Position.create(line.line, 0);
        const endOfLine = Position.create(startOfLine.line, MaximumLineLength);

        if (startOfLine.line > this.textDocument.lineCount) {
            throw new Error(`Requested line ${startOfLine.line} is out of bounds.`);
        }

        return this.textDocument.getText(Range.create(startOfLine, endOfLine));
    }

    public async getSettings(params: ExtendedParams): Promise<DocumentSettings> {
        // First, try asking the client, if the capability is present
        if (!this.documentSettings && params.clientCapabilities.experimental?.documentSettings?.request) {
            const result = await params.connection.sendRequest(DocumentSettingsRequest.type, { textDocument: this.id });
            if (result) {
                this.documentSettings = result;
            }
        }

        // If the capability is not present, or the above didn't get a result for some reason, try heuristically guessing
        if (!this.documentSettings) {
            this.documentSettings = this.guessDocumentSettings();
        }

        return this.documentSettings;
    }

    public updateSettings(params: DocumentSettings): void {
        this.documentSettings = params;
    }

    public async getPositionInfo(params: ExtendedPositionParams): Promise<PositionInfo> {
        const { tabSize } = await this.getSettings(params);
        const partialPositionInfo = await this.getFirstLinePositionInfo(params, tabSize);
        const fullPathParts = [...partialPositionInfo.pathParts];

        let currentIndentDepth = partialPositionInfo.cursorIndentDepth;

        for (let i = params.position.line - 1; i >= 0 && currentIndentDepth > 0; i--) {
            const currentLine = this.lineAt(i);
            let indentDepth = MaximumLineLength;
            let result: RegExpExecArray | null;

            /* eslint-disable @typescript-eslint/no-non-null-assertion */
            if ((result = ItemValueRegex.exec(currentLine))) {
                indentDepth = result.groups!['indent'].length / tabSize;

                if (indentDepth < currentIndentDepth) {
                    currentIndentDepth = indentDepth;
                    fullPathParts.unshift(Item);
                }
            } else if ((result = KeyValueRegex.exec(currentLine))) {
                indentDepth = result.groups!['indent'].length / tabSize;

                if (indentDepth < currentIndentDepth) {
                    currentIndentDepth = indentDepth;
                    fullPathParts.unshift(result.groups!['keyName']);
                }
            }
            /* eslint-enable @typescript-eslint/no-non-null-assertion */
        }

        return {
            path: '/' + fullPathParts.join('/'),
            indentDepth: partialPositionInfo.cursorIndentDepth,
        };
    }

    public static DocumentManagerConfig: TextDocumentsConfiguration<ComposeDocument> = {
        create: (uri, languageId, version, content) => new ComposeDocument(TextDocument.create(uri, languageId, version, content)),
        update: (document, changes, version) => document.update(TextDocument.update(document.textDocument, changes, version)),
    };

    private buildFullCst(): CST.Token[] {
        return Array.from(new Parser().parse(this.textDocument.getText()));
    }

    private buildDocumentCst(): CST.Document {
        // The CST can consist of more than just the document
        // Get the first `type === 'document'` item out of the list; this is the actual document
        // If there isn't one, return `EmptyDocumentCST`
        return this.fullCst.value.find(t => t.type === 'document') as CST.Document || EmptyDocumentCST;
    }

    private buildYamlDocument(): YamlDocument {
        const composedTokens = new Composer().compose(this.fullCst.value, true);
        const [yamlDocument] = composedTokens;

        if (!isDocument(yamlDocument)) {
            // TODO: empty documents are a normal thing but will not have a YamlDocument, that should be handled differently than erroring
            throw new ResponseError(ErrorCodes.ParseError, 'Malformed YAML document');
        }

        return yamlDocument;
    }

    private guessDocumentSettings(): DocumentSettings {
        const documentText = this.textDocument.getText();

        // For line endings, see if there are any \r
        const eol = /\r/ig.test(documentText) ? CRLF : LF;

        // For tab size, look for the first key with nonzero indentation. If none found, assume 2.
        let tabSize = 2;
        const indentedKeyLineMatch = /^(?<indentation>[ ]+)(?<key>[.\w-]+:\s*)$/im.exec(documentText);

        if (indentedKeyLineMatch?.groups?.['indentation']) {
            tabSize = indentedKeyLineMatch.groups['indentation'].length;
        }

        return {
            eol,
            tabSize,
        };
    }

    private getFirstLinePositionInfo(params: ExtendedPositionParams, tabSize: number): { pathParts: string[], cursorIndentDepth: number } {
        // For the first step, we have to consider the cursor position within the line
        const currentLine = this.lineAt(params.position);
        const pathParts: string[] = [];
        let cursorIndentDepth = 0;

        let result: RegExpExecArray | null;

        /* eslint-disable @typescript-eslint/no-non-null-assertion */
        if ((result = ItemKeyValueRegex.exec(currentLine))) {
            const itemSepPosition = currentLine.indexOf(result.groups!['itemInd']);
            const keySepPosition = currentLine.indexOf(result.groups!['keyInd'], itemSepPosition);
            const indentLength = result.groups!['indent'].length;
            const keyName = result.groups!['keyName'];

            cursorIndentDepth = indentLength / tabSize + 1; // We will add 1 to the indent depth, because YAML is too permissive and allows item lists at the same indent depth as their parent key

            if (params.position.character > keySepPosition) {
                pathParts.unshift(Value);
                pathParts.unshift(keyName);
                pathParts.unshift(Item);
            } else if (params.position.character === keySepPosition) {
                pathParts.unshift(Sep);
                pathParts.unshift(keyName);
                pathParts.unshift(Item);
            } else if (params.position.character > itemSepPosition) {
                pathParts.unshift(keyName);
                pathParts.unshift(Item);
            } else if (params.position.character === itemSepPosition) {
                pathParts.unshift(Sep);
                pathParts.unshift(Item); // TODO: sometimes we get <item>/<item> because of that indent+1 behavior
            } else if (params.position.character < indentLength) {
                cursorIndentDepth = params.position.character / tabSize;
            }
        } else if ((result = KeyValueRegex.exec(currentLine))) {
            const keySepPosition = currentLine.indexOf(result.groups!['keyInd']);
            const indentLength = result.groups!['indent'].length;
            const keyName = result.groups!['keyName'];

            cursorIndentDepth = indentLength / tabSize;

            if (params.position.character > keySepPosition) {
                pathParts.unshift(Value);
                pathParts.unshift(keyName);
            } else if (params.position.character === keySepPosition) {
                pathParts.unshift(Sep);
                pathParts.unshift(keyName); // TODO: the position is right here for hover, but not completions--if you do complete at the `:` in a key it thinks you're on the value
            } else if (params.position.character > indentLength) {
                pathParts.unshift(keyName);
            } else if (params.position.character < indentLength) {
                cursorIndentDepth = params.position.character / tabSize;
            }
        } else if ((result = ItemValueRegex.exec(currentLine))) {
            const itemSepPosition = currentLine.indexOf(result.groups!['itemInd']);
            const indentLength = result.groups!['indent'].length;

            cursorIndentDepth = indentLength / tabSize + 1; // We will add 1 to the indent depth, because YAML is too permissive and allows item lists at the same indent depth as their parent key

            if (params.position.character > itemSepPosition) {
                pathParts.unshift(Value);
                pathParts.unshift(Item);
            } else if (params.position.character === itemSepPosition) {
                pathParts.unshift(Sep);
                pathParts.unshift(Item);
            } else if (params.position.character < indentLength) {
                cursorIndentDepth = params.position.character / tabSize;
            }
        } else if ((result = ValueRegex.exec(currentLine))) {
            const indentLength = result.groups!['indent'].length;

            cursorIndentDepth = indentLength / tabSize;

            if (params.position.character > indentLength) {
                pathParts.unshift(Value);
            } else if (params.position.character < indentLength) {
                cursorIndentDepth = params.position.character / tabSize;
            }
        } else if ((result = WhitespaceRegex.exec(currentLine))) {
            const indentLength = result.groups!['indent'].length;

            cursorIndentDepth = indentLength / tabSize;

            if (params.position.character < indentLength) {
                cursorIndentDepth = params.position.character / tabSize;
            }
        }
        /* eslint-enable @typescript-eslint/no-non-null-assertion */

        return {
            pathParts,
            cursorIndentDepth,
        };
    }
}

export const KeyValueRegex = /^(?<indent> *)(?<key>(?<keyName>[.\w-]+)(?<keyInd>(?<keySep>:)\s+))(?<value>.*)$/im;
const ItemValueRegex = /^(?<indent> *)(?<itemInd>(?<itemSep>-) +)(?<value>.*)$/im;
const ItemKeyValueRegex = /^(?<indent> *)(?<itemInd>(?<itemSep>-) +)(?<key>(?<keyName>[.\w-]+)(?<keyInd>(?<keySep>:)\s+))(?<value>.*)$/im;
const ValueRegex = /^(?<indent> *)(?<value>\S+)$/im;
const WhitespaceRegex = /^(?<indent> *)$/im;

const Value = '<value>';
const Item = '<item>';
const Sep = '<sep>';
