package com.trip.planner.util;

public class PromptBuilder {

    private static final String SYSTEM_PROMPT =
            "你是专业旅游行程规划师。根据用户需求生成结构化行程，只输出一个合法 JSON 对象，"
            + "禁止输出解释、推理过程或 markdown 代码块标记。\n"
            + "规则：1.每天安排3-5个节点（景点、餐饮、住宿）；2.地点必须是真实存在、可被地图搜索到的具体名称；"
            + "3.节点按地理就近原则排序，时间安排合理；4.不确定的信息留空字符串，不要编造；"
            + "5.description和highlight各不超过50字，note不超过30字，summary不超过80字。\n"
            + "JSON结构（严格遵循，字段顺序不变）：\n"
            + "{\"destination\":\"目的地城市\",\"days\":天数(整数),\"summary\":\"行程概述\",\"itinerary\":["
            + "{\"day\":第几天(整数,从1开始),\"date\":\"日期(YYYY-MM-DD,未提供出发日期则省略此字段)\",\"summary\":\"当日摘要\",\"nodes\":["
            + "{\"place_name\":\"地点名称\",\"place_type\":\"ATTRACTION/RESTAURANT/HOTEL/TRANSPORT/OTHER\","
            + "\"time_start\":\"HH:mm\",\"time_end\":\"HH:mm\",\"suggested_duration\":时长分钟(整数),"
            + "\"highlight\":\"重点参观项目(50字内)\",\"description\":\"地点简介(50字内)\",\"open_time\":\"开放时间\","
            + "\"ticket_info\":\"门票信息\",\"transport_from_previous\":\"上一节点到此的交通方式\","
            + "\"estimated_cost\":预计花费(数字),\"note\":\"避坑提示(30字内)\"}]}]}\n"
            + "直接输出 JSON，不要输出任何多余文字。输出必须是完整闭合的合法 JSON，务必以 ]} 结尾，不要提前结束输出。";

    private static final String IMAGE_SYSTEM_PROMPT =
            "你是旅游行程规划师。请识别用户上传的旅游攻略/行程/景点图片，输出结构化行程。\n" +
            "要求：\n" +
            "1. 只输出一个合法 JSON 对象，不要输出解释、推理过程或 markdown 代码块\n" +
            "2. 多张图片若属于同一次旅行请合并为一个行程；地点按合理游览顺序排列\n" +
            "3. 地点名称补全为可被地图搜索到的真实具体名称（如「西湖」→「杭州西湖风景名胜区」）\n" +
            "4. 无法识别的字段留空字符串，不要编造\n" +
            "JSON 结构（严格遵循）：\n" +
            "{\"destination\":\"目的地城市\",\"days\":天数(整数),\"summary\":\"行程概述\",\"itinerary\":[" +
            "{\"day\":第几天(整数,从1开始),\"summary\":\"当日摘要\",\"nodes\":[" +
            "{\"place_name\":\"地点名称\",\"place_type\":\"ATTRACTION/RESTAURANT/HOTEL/TRANSPORT/OTHER\"," +
            "\"time_start\":\"HH:mm\",\"time_end\":\"HH:mm\",\"suggested_duration\":时长分钟(整数)," +
            "\"highlight\":\"重点参观项目\",\"description\":\"地点简介\",\"open_time\":\"开放时间\"," +
            "\"ticket_info\":\"门票信息\",\"transport_from_previous\":\"上一节点到此的交通方式\"," +
            "\"estimated_cost\":预计花费(数字),\"note\":\"备注\"}]}]}\n" +
            "请直接开始识别并输出 JSON，不要输出任何多余文字。输出必须是完整闭合的合法 JSON，务必以 ]} 结尾，不要提前结束输出。";

    private PromptBuilder() {
    }

    public static String buildSystemPrompt() {
        return SYSTEM_PROMPT;
    }

    public static String buildUserPrompt(String userRequirement) {
        return "用户需求如下：\n" + userRequirement +
                "\n\n请生成行程，直接输出 JSON 对象。";
    }

    public static String buildImageSystemPrompt() {
        return IMAGE_SYSTEM_PROMPT;
    }

    public static String buildImageUserPrompt(int imageCount) {
        return "请识别以上 " + imageCount + " 张图片中的旅游攻略/行程信息，整理为结构化行程并直接输出 JSON 对象。";
    }

    /**
     * Phase 18：节点 AI 智能填充提示词。
     * 只依据真实景点常识输出，不确定的字段返回 null（宁缺勿错）。
     */
    public static String buildNodeEnrichPrompt(String name, String city) {
        return "你是旅游信息助手。请根据常识补充地点「" + name + "」"
                + (city == null || city.trim().isEmpty() ? "" : "（位于" + city + "）")
                + "的旅游信息，只输出一个合法 JSON 对象，禁止输出解释或 markdown 代码块。\n"
                + "规则：1.只依据真实存在的公开信息；2.不确定的字段必须为 null，不要编造；"
                + "3.highlight不超过50字，description不超过80字；4.suggested_duration为建议游览时长分钟数(整数)；"
                + "5.estimated_cost为预计人均花费元数(数字,免费景点为0)；6.ticket_info附「仅供参考」语义可省略，前端统一标注。\n"
                + "JSON结构（严格遵循）：\n"
                + "{\"place_type\":\"ATTRACTION/RESTAURANT/HOTEL/TRANSPORT/OTHER\","
                + "\"suggested_duration\":时长分钟(整数或null),\"highlight\":\"重点参观项目(50字内或null)\","
                + "\"description\":\"地点简介(80字内或null)\",\"open_time\":\"开放时间(或null)\","
                + "\"ticket_info\":\"门票信息(或null)\",\"estimated_cost\":预计花费(数字或null)}\n"
                + "直接输出 JSON，不要输出任何多余文字。输出必须是完整闭合的合法 JSON，务必以 } 结尾。";
    }
}
