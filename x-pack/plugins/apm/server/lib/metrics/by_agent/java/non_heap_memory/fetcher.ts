/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */
import {
  SERVICE_AGENT_NAME,
  PROCESSOR_EVENT,
  SERVICE_NAME,
  METRIC_JAVA_NON_HEAP_MEMORY_MAX,
  METRIC_JAVA_NON_HEAP_MEMORY_COMMITTED,
  METRIC_JAVA_NON_HEAP_MEMORY_USED
} from '../../../../../../common/elasticsearch_fieldnames';
import { Setup } from '../../../../helpers/setup_request';
import { MetricsAggs, MetricSeriesKeys, AggValue } from '../../../types';
import { getMetricsDateHistogramParams } from '../../../../helpers/metrics';
import { rangeFilter } from '../../../../helpers/range_filter';

export interface NonHeapMemoryMetrics extends MetricSeriesKeys {
  nonHeapMemoryCommitted: AggValue;
  nonHeapMemoryUsed: AggValue;
}

export async function fetch(setup: Setup, serviceName: string) {
  const { start, end, uiFiltersES, client, config } = setup;

  const aggs = {
    nonHeapMemoryMax: { avg: { field: METRIC_JAVA_NON_HEAP_MEMORY_MAX } },
    nonHeapMemoryCommitted: {
      avg: { field: METRIC_JAVA_NON_HEAP_MEMORY_COMMITTED }
    },
    nonHeapMemoryUsed: {
      avg: { field: METRIC_JAVA_NON_HEAP_MEMORY_USED }
    }
  };

  const params = {
    index: config.get<string>('apm_oss.metricsIndices'),
    body: {
      size: 0,
      query: {
        bool: {
          filter: [
            { term: { [SERVICE_NAME]: serviceName } },
            { term: { [PROCESSOR_EVENT]: 'metric' } },
            { term: { [SERVICE_AGENT_NAME]: 'java' } },
            {
              range: rangeFilter(start, end)
            },
            ...uiFiltersES
          ]
        }
      },
      aggs: {
        timeseriesData: {
          date_histogram: getMetricsDateHistogramParams(start, end),
          aggs
        },
        ...aggs
      }
    }
  };

  return client.search<void, MetricsAggs<NonHeapMemoryMetrics>>(params);
}
