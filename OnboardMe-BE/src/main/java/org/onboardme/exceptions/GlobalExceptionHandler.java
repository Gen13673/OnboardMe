package org.onboardme.exceptions;

import org.onboardme.dao.entities.ErrorResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(OnboardMeException.class)
    public ResponseEntity<ErrorResponse> handleOnboardMeException(OnboardMeException ex) {
        ErrorResponse body = new ErrorResponse(ex.getStatus().value(), ex.getMessage());
        return new ResponseEntity<>(body, ex.getStatus());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleOtherExceptions(Exception ex) {
        ErrorResponse body = new ErrorResponse(500, "Error inesperado: " + ex.getMessage());
        return ResponseEntity.status(500).body(body);
    }
}
