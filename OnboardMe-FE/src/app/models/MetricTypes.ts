export interface DataPointDTO {
  label: string;
  value: number;
}

export interface GenericMetricDTO {
  metricType: string;
  data: DataPointDTO[];
}

export type MetricTypeDTO =
  | "COURSE_COMPLETION"
  | "AVG_COMPLETION_TIME"
  | "SECTION_DROPOFF"
  | "BUDDY_COVERAGE"
  | "USER_PROGRESS"
  | "COURSE_USER_AVG_COMPLETION_TIME";