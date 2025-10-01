export interface DataPointDTO {
  label: string;
  value: number;
}

export interface GenericMetricDTO {
  metricType: string;
  data: DataPointDTO[];
}

export type MetricTypeDTO =
  | "COURSE_USER_PROGRESS"
  | "COURSE_USER_AVG_COMPLETION_TIME"
  | "USER_COURSE_COMPLETION";