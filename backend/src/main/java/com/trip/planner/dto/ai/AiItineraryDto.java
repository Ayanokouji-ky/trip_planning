package com.trip.planner.dto.ai;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

import java.io.Serializable;
import java.util.List;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class AiItineraryDto implements Serializable {

    private static final long serialVersionUID = 1L;

    private String destination;
    private Integer days;
    private String summary;
    private List<AiDayDto> itinerary;
}
