/*!--------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CST, parseDocument, Parser } from 'yaml';

const doc = `version: '3.4'

services: @
  flasktest:
    image: flasktest
    build:
      context: .
      dockerfile: ./Dockerfile
    ports::asdfasdfasdf
      - 5001:5000asdfasd

tags:
  - tag:
     uuid: 98fb0d90-e067-11e3-8b68-0800200c9a66
     name: Mathematics
  - tag:
     uuid: 3f25f680-e068-11e3-8b68-0800200c9a66
     name: Logic
foo:
    ? [ New York Yankees,Atlanta Braves ]
    : [ 2001-07-02, 2001-08-12, 2001-08-14]
`;

describe.skip('CST playground', () => {
    it('Should test', async () => {
        const [parsed] = new Parser().parse(doc) as unknown as [CST.Document];

        const foo = CST.visit.itemAtPath(parsed, [['key', 0]]);
        console.log(parsed);
        console.log(foo);
        CST.visit(parsed, (item, path) => {
            console.log(item);
            console.log(path);
        });

        const foobar = parseDocument(doc, { prettyErrors: false });
        console.log(foobar);
    });
});
