package com.trip.planner.dto.response;

import com.trip.planner.entity.PlanDay;
import com.trip.planner.entity.PlanNode;
import com.trip.planner.entity.PlanRoute;
import com.trip.planner.entity.TravelPlan;
import lombok.Data;

import java.io.Serializable;
import java.util.List;

@Data
public class PlanDetailResponse implements Serializable {

    private static final long serialVersionUID = 1L;

    private TravelPlan plan;
    private List<PlanDay> days;
    private List<PlanNode> nodes;
    private List<PlanRoute> routes;
}
