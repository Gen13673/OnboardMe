package org.onboardme.controllers;

import com.onboardme.api.MetricsApi;
import com.onboardme.model.GenericMetricDTO;
import com.onboardme.model.MetricTypeDTO;
import org.onboardme.services.MetricsService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class MetricsController implements MetricsApi {

    private final MetricsService metricsService;

    public MetricsController(MetricsService metricsService) {
        this.metricsService = metricsService;
    }

    @Override
    public ResponseEntity<GenericMetricDTO> getMetric(
            @RequestParam("metricType") MetricTypeDTO metricType,
            @RequestParam(value = "idBuddy", required = false) Long idBuddy,
            @RequestParam(value = "idCourse", required = false) Long idCourse
    ) {
        return ResponseEntity.ok(metricsService.getMetric(metricType, idBuddy, idCourse));
    }
}
