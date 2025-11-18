package org.onboardme.exceptions;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public class OnboardMeException extends RuntimeException {
    private final HttpStatus status;

    public OnboardMeException(final HttpStatus httpStatus) {
        this.status = httpStatus;
    }

    public OnboardMeException(final HttpStatus httpStatus, final String message) {
        super(message);
        this.status = httpStatus;
    }

}
