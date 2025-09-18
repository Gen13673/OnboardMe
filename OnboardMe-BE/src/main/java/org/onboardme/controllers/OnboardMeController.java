package org.onboardme.controllers;

import com.onboardme.api.HelloApi;
import com.onboardme.model.HelloGet200Response;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.logging.Logger;

@RestController
@RequestMapping("/onboardMe")
public class OnboardMeController implements HelloApi {

    Logger logger = Logger.getLogger(getClass().getName());

    @Override
    public ResponseEntity<HelloGet200Response> helloGet() {
        HelloGet200Response response = new HelloGet200Response();
        response.setMessage("hello");
        logger.info("this works");
        return ResponseEntity.ok(response);
    }
}
