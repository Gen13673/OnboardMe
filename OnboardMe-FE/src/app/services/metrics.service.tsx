import Api from "./Api";
import { GenericMetricDTO } from "../models/MetricTypes";

export function getMetric(
  metricType: string,
  params?: { idBuddy?: number; idUser?: number; }
) {
  return Api.get<GenericMetricDTO>("/metrics", {
    params: { metricType, ...params },
  });
}
