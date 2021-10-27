/*!--------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// These interfaces are loosely copied from https://github.com/microsoft/vscode-azuretools/blob/be03d9a57f66bb25efdd6f2e281052d05b0ec01b/ui/index.d.ts#L536-L592
// Ideally they would just be used directly but I'm reluctant to add the dependency on vscode-azureextensionui, given how much unrelated stuff it contains...

export interface TelemetryEvent {
    /**
     * The event name.
     */
    eventName: string;

    /**
     * Properties of the event. Successful events will be aggregated, and each property from each event attached to the ultimate aggregated event.
     */
    properties: TelemetryProperties;

    /**
     * Measurements of the event. Successful events will be aggregated, and each measurement from each event attached to the ultimate aggregated event, with special handling of `duration`.
     */
    measurements: TelemetryMeasurements;

    /**
     * The key values that, in addition to event name, will be used for event grouping. This is treated as a set, so order does not matter.
     * At the time of aggregation, the keys will be added in sorted order to a property called `eventKey`.
     */
    keys: string[];

    /**
     * If true, the event will not be sent if it is successful.
     */
    suppressIfSuccessful?: boolean;

    /**
     * If true, the event will not be sent.
     */
    suppressAll?: boolean;
}

interface TelemetryProperties {
    result?: 'Succeeded' | 'Failed' | 'Canceled';
    error?: string;
    errorMessage?: string;

    [key: string]: string | undefined;
}

interface TelemetryMeasurements {
    duration?: number;
    [key: string]: number | undefined;
}

export function initEvent(eventName: string): TelemetryEvent {
    return {
        eventName: eventName,
        properties: {
            result: 'Succeeded',
        },
        measurements: {},
        keys: [],
    };
}
