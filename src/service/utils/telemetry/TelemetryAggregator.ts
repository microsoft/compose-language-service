/*!--------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Connection, Disposable } from 'vscode-languageserver';
import { initEvent, TelemetryEvent } from '../../../client/TelemetryEvent';
import { logNormal } from './logNormal';

// One minute flush interval by default
const FlushIntervalMilliseconds = 60 * 1000;

export class TelemetryAggregator implements Disposable {
    private eventBuffer: TelemetryEvent[] = [];
    private readonly timer: NodeJS.Timeout;

    public constructor(private readonly connection: Connection, private readonly interval: number = FlushIntervalMilliseconds) {
        this.timer = setInterval(() => this.flush(), this.interval);
    }

    public dispose(): void {
        clearInterval(this.timer);

        // Flush one last time
        this.flush();
    }

    public logEvent(event: TelemetryEvent): void {
        if (event.suppressAll) {
            // Do nothing, this event is suppressed
        } else if (event.properties.result === 'Succeeded' && event.suppressIfSuccessful) {
            // Do nothing, the event succeeded and has suppressIfSuccessful === true
        } else if (event.properties.result === 'Failed') {
            // Event is an error, send immediately rather than buffering
            this.connection.telemetry.logEvent(event);
        } else {
            // Add it to the event buffer to be flushed on the interval
            this.eventBuffer.push(event);
        }
    }

    private flush(): void {
        try {
            for (const evt of this.getAggregatedEvents()) {
                this.connection.telemetry.logEvent(evt);
            }
        } catch (err) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const error = err instanceof Error ? err : Error((err as any).toString());
            const telemetryFailedEvent = initEvent('telemetryaggregatorfailure');

            telemetryFailedEvent.properties.result = 'Failed';
            telemetryFailedEvent.properties.error = error.name;
            telemetryFailedEvent.properties.errorMessage = error.message;

            this.connection.telemetry.logEvent(telemetryFailedEvent);
        } finally {
            // Finally, clear out the buffer
            this.eventBuffer = [];
        }
    }

    private getAggregatedEvents(): TelemetryEvent[] {
        const aggregated: TelemetryEvent[] = [];
        const eventGroups = new Map<string, TelemetryEvent[]>();

        // Group events by their name and key properties
        for (const evt of this.eventBuffer) {
            const key = this.getEventKey(evt);

            if (!eventGroups.has(key)) {
                eventGroups.set(key, []);
            }

            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            eventGroups.get(key)!.push(evt);
        }

        // For each group, aggregate properties and measurements, and add performance statistics, to get one aggregated event per group
        for (const key of eventGroups.keys()) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const events = eventGroups.get(key)!;
            const eventName = events[0].eventName;
            const eventKeys = events[0].keys;

            const aggregatedEvent = initEvent(eventName);

            // Aggregate the performance statistics
            const durations = events.map(e => e.measurements.duration ?? undefined).filter(d => d !== undefined) as number[] || [];
            const stats = logNormal(durations);

            aggregatedEvent.measurements.count = events.length;
            aggregatedEvent.measurements.durationMu = stats.mu;
            aggregatedEvent.measurements.durationSigma = stats.sigma;
            aggregatedEvent.measurements.durationMedian = stats.median;

            // Aggregate the properties and measurements--this will apply all properties from all events, with the recent events overriding prior events if there is a conflict
            events.forEach(evt => Object.assign(aggregatedEvent.properties, evt.properties));
            events.forEach(evt => {
                Object.keys(evt.measurements).forEach(k => {
                    if (k !== 'duration') {
                        aggregatedEvent.measurements[k] = evt.measurements[k];
                    }
                });
            });

            // Lastly, attach the event keys as a property
            aggregatedEvent.properties.eventKey = eventKeys.sort().join(',');

            aggregated.push(aggregatedEvent);
        }

        return aggregated;
    }

    private getEventKey(event: TelemetryEvent): string {
        const sorted = event.keys.sort();
        return `${event.eventName}/${sorted.join(',')}`;
    }
}
